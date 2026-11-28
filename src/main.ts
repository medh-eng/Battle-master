/* Battle Master: The Bell Marches — entry point. */
// fonts ship with the game (offline, Android) — no Google Fonts request
import '@fontsource/alegreya/500.css';
import '@fontsource/alegreya/500-italic.css';
import '@fontsource/alegreya/700.css';
import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cinzel/600.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/alegreya-sans/500.css';
import '@fontsource/alegreya-sans/500-italic.css';
import '@fontsource/alegreya-sans/700.css';
import '@fontsource/alegreya-sans/800.css';
import { Stage } from './game/stage';
import { view } from './game/view';
import { canFullscreen, isFullscreen, toggleFullscreen } from './game/fullscreen';
import { titleScene } from './game/scenes/title';
import { battleScene, preloadBattle } from './game/scenes/battle';
import { tutorialScene } from './game/scenes/tutorial';
import { campScreen, codexScreen, lostScreen, musterScreen, rewardScreen, routeScreen, summaryScreen } from './game/scenes/march';
import { audio } from './game/audio';
import { CARD_ART, loadArt, loadBattlefield, loadUi } from './assets/manifest';
import { FONT_BODY, FONT_SERIF, FONT_STORY, FONT_TITLE } from './game/theme';
import {
  beginBattle, clearRun, discover, finishBattle, loadMeta, loadRun, newRun, quickRun, retry, saveMeta, saveRun, type RunState
} from './run/run';
import { runScenario } from './run/battle';

/** a quiet "loading" line over the screen while something is fetched */
async function loading<T>(p: Promise<T>): Promise<T> {
  const el = document.createElement('div');
  el.textContent = 'Unrolling the banners…';
  el.style.cssText = 'position:fixed;inset:auto 0 6%;text-align:center;color:#f0d79a;font:italic 500 22px Alegreya,Georgia,serif;text-shadow:0 1px 4px #000;pointer-events:none;opacity:0;transition:opacity .3s;z-index:20';
  const t = setTimeout(() => { document.body.appendChild(el); requestAnimationFrame(() => { el.style.opacity = '1'; }); }, 250);
  try { return await p; } finally { clearTimeout(t); el.remove(); }
}

async function boot(): Promise<void> {
  // Pixi draws text onto canvas, so the web fonts must be ready first.
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`700 40px ${FONT_SERIF}`), document.fonts.load(`600 40px ${FONT_SERIF}`),
        document.fonts.load(`500 40px ${FONT_SERIF}`), document.fonts.load(`italic 500 40px ${FONT_SERIF}`),
        document.fonts.load(`500 40px ${FONT_STORY}`), document.fonts.load(`italic 500 40px ${FONT_STORY}`),
        document.fonts.load(`700 40px ${FONT_TITLE}`), document.fonts.load(`600 40px ${FONT_TITLE}`),
        document.fonts.load(`700 40px ${FONT_BODY}`), document.fonts.load(`800 40px ${FONT_BODY}`),
        document.fonts.load(`500 40px ${FONT_BODY}`), document.fonts.load(`italic 500 40px ${FONT_BODY}`)
      ]),
      new Promise(r => setTimeout(r, 2500))
    ]);
  } catch { /* fall back to system serif */ }

  const stage = new Stage();
  await stage.init();
  await Promise.all([loadBattlefield('title'), loadUi('crest')]);
  document.getElementById('boot')?.remove();
  // every painting is small: load them all while the title is up, so camp and battle faces are ready
  const artReady = loadArt(CARD_ART);

  window.addEventListener('pointerdown', () => audio.unlock());
  // a sideways phone: the first press also goes full screen, hiding the address bar (once; ⛶ in battle toggles it)
  let askedFull = false;
  window.addEventListener('pointerup', () => {
    if (askedFull || !view.phone || !canFullscreen() || isFullscreen()) return;
    askedFull = true; void toggleFullscreen();
  });

  /* ---------------- the march: one controller, driven by the saved run's phase ---------------- */
  let run: RunState | null = loadRun();
  const save = (): void => { if (run) saveRun(run); };

  const go = (): void => {
    const s = run;
    if (!s) { title(); return; }
    save();
    switch (s.phase) {
      case 'route': stage.show(routeScreen(stage, s, go, title)); break;
      case 'camp': stage.show(campScreen(stage, s, save, () => { beginBattle(s); go(); }, title, () => manual(go))); break;
      case 'battle': fight(s); break;
      case 'reward': stage.show(rewardScreen(stage, s, go)); break;
      case 'lost': stage.show(lostScreen(stage, s, () => { retry(s); go(); }, () => endMarch(s))); break;
      case 'won': endMarch(s); break;
    }
  };

  const fight = (s: RunState, quick = false): void => {
    audio.unlock();
    const sc = runScenario(s, (won, st) => {
      if (quick) { title(); return; }
      finishBattle(s, won, Math.max(0, st.players[0].hq.hp));
      discover(s);
      go();
    });
    const back = quick ? title : () => { s.phase = 'camp'; go(); };
    void loading(Promise.all([artReady, preloadBattle(sc)])).then(() =>
      stage.show(battleScene(stage, title, sc, undefined, { title, map: back })));
  };

  const endMarch = (s: RunState): void => {
    const m = loadMeta();
    if (s.phase === 'won') m.victories += 1;
    m.bestStop = Math.max(m.bestStop, s.wins);
    saveMeta(m);
    clearRun(); run = null;
    stage.show(summaryScreen(stage, s, march, title));
  };

  /** the Field Manual; `back` is where Close and the last button lead. Seeing it once is remembered. */
  const manual = (back: () => void, finishLabel = 'Back to the game'): void => {
    void loading(artReady).then(() => {
      const seen = (): void => { const m = loadMeta(); if (!m.tutorial) { m.tutorial = true; saveMeta(m); } };
      stage.show(tutorialScene(stage, { finishLabel, onFinish: () => { seen(); back(); }, onExit: () => { seen(); back(); } }));
    });
  };

  const muster = (): void => {
    void loading(artReady).then(() => stage.show(musterScreen(stage, fams => {
      run = newRun(fams);
      const m = loadMeta(); m.marches += 1; saveMeta(m);
      discover(run);
      go();
    }, title, () => manual(muster))));
  };
  /** the first new march begins with the Field Manual; every later one goes straight to the muster */
  const march = (): void => {
    if (loadMeta().tutorial) muster(); else manual(muster, 'Muster my march');
  };

  const title = (): void => {
    const m = loadMeta();
    const record = m.marches ? `Marches: ${m.marches} · Victories at Fifth Bell: ${m.victories} · Best: ${m.bestStop} duels won` : 'Seven duels on the road to Fifth Bell. Every rival is your equal.';
    stage.show(titleScene(stage, {
      resume: run ? () => void loading(artReady).then(go) : null,
      march,
      quick: () => fight(quickRun(), true),
      codex: () => void loading(artReady).then(() => stage.show(codexScreen(stage, title))),
      learn: () => manual(title),
      record
    }));
  };
  title();
}

void boot();
