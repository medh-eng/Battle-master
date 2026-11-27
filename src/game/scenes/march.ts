/* ============================================================
   Battle Master — the screens between battles: choosing the
   starting regiments, the road, the camp (army and fort), rewards,
   and the end of a march. They are HTML laid over the stage's
   painted backdrop (quicker to make responsive than canvas UI);
   the card faces are the same painted faces the battle uses.
   All rules live in src/run/run.ts; these screens only call it.
   ============================================================ */
import { Container } from 'pixi.js';
import { CARDS, baseId } from '../../engine/cards';
import { cardFaceUrl } from '../cards/paint';
import { hasArt, loadBattlefield } from '../../assets/manifest';
import { audio } from '../audio';
import type { Scene, Stage } from '../stage';
import {
  DATA, FAMILIES, GATES, RIVALS, ROUTE, build, canFuseForm, cardOf, chooseRoad, currentNode, deckOf, dismiss, evolve, evolveCost,
  expand, familyName, familyOf, fuse, fusionOf, isHybrid, isLevy, loadMeta, nextForm, playId, recruit, repair, rewardById,
  rivalArmy, routeOptions, structureUpgrades, takeReward, train, trainCost, upgradeGate, upgradeStructure,
  type Family, type Result, type RunState
} from '../../run/run';
import { armyLine, rivalArt } from '../../run/battle';

/* ---------------- shared frame ---------------- */
const CSS = `
#bm-ui{position:fixed;inset:0;z-index:5;overflow:auto;color:#f3e6c4;font:500 clamp(12px,2.3vh,18px)/1.35 'Alegreya Sans',sans-serif;
  -webkit-tap-highlight-color:transparent;user-select:none;touch-action:pan-y;padding:max(1.6vh,env(safe-area-inset-top)) max(2.4vw,env(safe-area-inset-right)) 2vh max(2.4vw,env(safe-area-inset-left));box-sizing:border-box}
#bm-ui *{box-sizing:border-box}
#bm-ui h1{font:700 clamp(20px,5vh,44px) Cinzel,serif;letter-spacing:.08em;margin:0 0 .3em;color:#ffe9b0;text-shadow:0 2px 8px #000}
#bm-ui h2{font:700 clamp(13px,2.7vh,22px) Cinzel,serif;letter-spacing:.12em;margin:.2em 0 .5em;color:#e7c46e;text-shadow:0 1px 4px #000}
#bm-ui .story{font:500 clamp(13px,2.5vh,19px)/1.45 Alegreya,serif;color:#fbf1d8;text-shadow:0 1px 3px #000;max-width:70em}
#bm-ui .bar{display:flex;gap:1.2em;align-items:center;flex-wrap:wrap;margin-bottom:.8em}
#bm-ui .chip{background:rgba(16,24,38,.82);border:1px solid #c98a4a;border-radius:2em;padding:.25em .9em;font:700 1em Cinzel,serif;white-space:nowrap}
#bm-ui .gold{color:#ffd76a}
#bm-ui .panel{background:linear-gradient(180deg,rgba(18,28,44,.88),rgba(10,14,22,.9));border:1px solid rgba(201,138,74,.7);border-radius:12px;padding:.9em 1em;margin-bottom:1em;box-shadow:0 6px 24px rgba(0,0,0,.45)}
#bm-ui .row{display:flex;gap:.9em;flex-wrap:wrap;align-items:flex-start}
#bm-ui .cols{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:1em}
@media (max-aspect-ratio:4/3){#bm-ui .cols{grid-template-columns:1fr}}
#bm-ui .unit{width:clamp(96px,17vh,170px);display:flex;flex-direction:column;gap:.3em;align-items:stretch}
#bm-ui .unit img,#bm-ui .face{width:100%;aspect-ratio:480/672;border-radius:8px;display:block;box-shadow:0 4px 12px rgba(0,0,0,.6);cursor:pointer}
#bm-ui .unit.sel img{outline:4px solid #7fd4ff;outline-offset:2px}
#bm-ui .unit.dim img{filter:grayscale(.85) brightness(.6)}
#bm-ui button{font:700 .86em Cinzel,serif;letter-spacing:.04em;color:#2a1708;background:linear-gradient(180deg,#f4d58d,#c99a45);border:1px solid #6b4a1e;border-radius:7px;
  padding:.45em .6em;cursor:pointer;min-height:2.3em;box-shadow:0 2px 0 #5a3a12}
#bm-ui button.alt{background:linear-gradient(180deg,#36506f,#1f3049);color:#f3e6c4;border-color:#8fb0d4;box-shadow:0 2px 0 #0d1828}
#bm-ui button.big{font-size:1.15em;padding:.6em 1.6em}
#bm-ui button:disabled{filter:grayscale(1) brightness(.6);cursor:default}
#bm-ui .cost{color:#7a2a08}
#bm-ui .toast{min-height:1.5em;color:#9cff8a;font-weight:700;text-shadow:0 1px 3px #000}
#bm-ui .toast.bad{color:#ffb09a}
#bm-ui .road{display:flex;gap:1.4em;flex-wrap:wrap}
#bm-ui .roadcard{flex:1 1 20em;max-width:34em;display:flex;gap:1em}
#bm-ui .roadcard .face{width:clamp(90px,22vh,190px);flex:none}
#bm-ui .steps{display:flex;gap:.4em;align-items:center;flex-wrap:wrap}
#bm-ui .step{width:2.1em;height:2.1em;border-radius:50%;display:grid;place-items:center;font:700 .85em Cinzel,serif;border:2px solid #c98a4a;background:rgba(16,24,38,.85)}
#bm-ui .step.done{background:#c98a4a;color:#1a1008}
#bm-ui .step.now{background:#ffe9b0;color:#1a1008;box-shadow:0 0 12px #ffd76a}
#bm-ui .line{height:2px;width:1.4em;background:#c98a4a}
#bm-ui .hp{height:.9em;border-radius:1em;background:#3a1a12;border:1px solid #c98a4a;overflow:hidden;margin:.3em 0 .6em}
#bm-ui .hp>i{display:block;height:100%;background:linear-gradient(90deg,#c0392b,#e6a43a,#7ccf6a)}
#bm-ui .small{font-size:.85em;opacity:.9}
#bm-ui .slot{width:clamp(80px,14vh,140px)}
#bm-ui .empty{aspect-ratio:480/672;border:2px dashed rgba(231,196,110,.6);border-radius:8px;display:grid;place-items:center;text-align:center;padding:.4em;font:700 .85em Cinzel,serif;color:#e7c46e;background:rgba(0,0,0,.35)}
#bm-ui .actions{display:flex;flex-direction:column;gap:.25em}
#bm-ui .center{display:flex;flex-direction:column;align-items:center;text-align:center}
#bm-ui .pick{display:flex;gap:1.2em;flex-wrap:wrap;justify-content:center;margin:1em 0}
#bm-ui .pick .unit{width:clamp(110px,24vh,210px)}
#bm-ui .tag{display:inline-block;font:700 .75em Cinzel,serif;color:#1a1008;background:#e7c46e;border-radius:4px;padding:0 .4em;margin-right:.3em}
#bm-ui .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(80px,14vh,130px),1fr));gap:.7em}
#bm-ui .lock{filter:grayscale(1) brightness(.35)}
#bm-ui .portrait{object-fit:cover;border:3px solid #d4a94f}
#bm-ui .zoom{position:fixed;inset:0;background:rgba(0,0,0,.8);display:grid;place-items:center;z-index:9}
#bm-ui .zoom img{height:88vh;border-radius:14px}
`;
let styled = false;
function ensureStyle(): void {
  if (styled) return; styled = true;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el);
}

/** a scene that is an HTML page over a painted backdrop */
export function domScene(stage: Stage, backdrop: string, music: string, render: (root: HTMLElement) => void): Scene {
  const s: Scene = new Container();
  let root: HTMLDivElement | null = null;
  s.enter = () => {
    ensureStyle();
    void loadBattlefield(backdrop).then(t => { if (root) stage.setBackdrop(t, 0.55); });
    audio.playMusic(music as 'music_title');
    root = document.createElement('div'); root.id = 'bm-ui';
    root.addEventListener('pointerdown', () => audio.unlock());
    document.body.appendChild(root);
    render(root);
  };
  s.leave = () => { root?.remove(); root = null; };
  return s;
}

/** tiny element builder */
function h(tag: string, attrs: Record<string, unknown> = {}, ...kids: (Node | string | null | false)[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'onclick') el.addEventListener('click', e => { e.stopPropagation(); audio.play('click'); (v as () => void)(); });
    else if (k === 'class') el.className = String(v);
    else if (k === 'disabled') (el as HTMLButtonElement).disabled = !!v;
    else if (k === 'html') el.innerHTML = String(v);
    else el.setAttribute(k, String(v));
  }
  kids.forEach(c => { if (c !== null && c !== false) el.append(c); });
  return el;
}
/** a card face; a tap opens it large */
function face(id: string, cls = 'face'): HTMLElement {
  const img = h('img', { class: cls, src: cardFaceUrl(id), alt: CARDS[id]?.name ?? id, draggable: 'false' });
  img.addEventListener('click', () => {
    const z = h('div', { class: 'zoom' }, h('img', { src: cardFaceUrl(id) }));
    z.addEventListener('click', () => z.remove());
    img.closest('#bm-ui')?.appendChild(z);
  });
  return img;
}
/** a commander's portrait (falls back to their signature card until painted); a tap opens it large */
function portrait(rival: string, hero: string): HTMLElement {
  const id = rivalArt(rival);
  if (!hasArt(id)) return face(hero);
  const src = `${import.meta.env.BASE_URL}assets/cards/${id}.webp`;
  const img = h('img', { class: 'face portrait', src, alt: RIVALS[rival]?.name ?? rival, draggable: 'false' });
  img.addEventListener('click', () => {
    const z = h('div', { class: 'zoom' }, h('img', { src }));
    z.addEventListener('click', () => z.remove());
    img.closest('#bm-ui')?.appendChild(z);
  });
  return img;
}
const btn = (label: string, fn: () => void, opts: { alt?: boolean; big?: boolean; off?: boolean } = {}) =>
  h('button', { class: [opts.alt ? 'alt' : '', opts.big ? 'big' : ''].join(' '), onclick: fn, disabled: !!opts.off }, label);
const goldTxt = (n: number) => `${n} gold`;
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

function stepper(s: RunState): HTMLElement {
  const box = h('div', { class: 'steps' });
  ROUTE.forEach((_, i) => {
    if (i) box.append(h('i', { class: 'line' }));
    box.append(h('div', { class: `step ${i < s.stop ? 'done' : i === s.stop ? 'now' : ''}`, title: `Stop ${i + 1}` }, i === ROUTE.length - 1 ? '♔' : String(i + 1)));
  });
  return box;
}
function topBar(s: RunState, extra: (Node | string)[] = []): HTMLElement {
  return h('div', { class: 'bar' },
    h('span', { class: 'chip gold' }, `⛃ ${goldTxt(s.gold)}`),
    h('span', { class: 'chip' }, `♜ Fort ${s.fort.hp}/${s.fort.maxHp}`),
    h('span', { class: 'chip' }, `⚔ ${s.wins} won`),
    h('span', { class: 'chip' }, `↺ ${s.retries} second chance${s.retries === 1 ? '' : 's'}`),
    stepper(s), ...extra);
}

/* ---------------- 1. choosing the first two regiments ---------------- */
export function musterScreen(stage: Stage, begin: (f: Family[]) => void, back: () => void): Scene {
  return domScene(stage, 'first_ford', 'music_camp', root => {
    const chosen = new Set<Family>();
    const draw = (): void => {
      root.replaceChildren(
        h('div', { class: 'center' },
          h('h1', {}, 'Muster your march'),
          h('div', { class: 'story' }, `Choose ${DATA.start.pick} regiments to lead. Two Levy regiments and eight tactic cards fill out your deck. Every regiment can be trained, evolved through four forms, or fused with another family into a hybrid.`),
          h('div', { class: 'pick' }, ...FAMILIES.map(f => {
            const line = (DATA.forms as Record<string, string[]>)[f].map(id => CARDS[id].name).join(' → ');
            return h('div', { class: `unit ${chosen.has(f) ? 'sel' : chosen.size >= DATA.start.pick ? 'dim' : ''}` },
              (() => { const el = face(`${f}1`); el.addEventListener('click', e => { e.stopImmediatePropagation(); toggle(f); }, { capture: true }); return el; })(),
              h('h2', {}, familyName(f)),
              h('div', { class: 'small' }, line),
              btn(chosen.has(f) ? 'Chosen ✓' : 'Choose', () => toggle(f), { alt: !chosen.has(f) }));
          })),
          h('div', { class: 'row' },
            btn('Begin the march', () => begin([...chosen]), { big: true, off: chosen.size !== DATA.start.pick }),
            btn('Back', back, { alt: true }))));
    };
    const toggle = (f: Family): void => {
      if (chosen.has(f)) chosen.delete(f); else if (chosen.size < DATA.start.pick) chosen.add(f);
      draw();
    };
    draw();
  });
}

/* ---------------- 2. the road ---------------- */
const WEATHER = DATA.weatherText as Record<string, string>;
export function routeScreen(stage: Stage, s: RunState, done: () => void, quit: () => void): Scene {
  return domScene(stage, 'first_ford', 'music_camp', root => {
    const opts = routeOptions(s);
    root.replaceChildren(
      topBar(s),
      h('h1', {}, opts.length > 1 ? 'The road forks' : 'The road ahead'),
      h('div', { class: 'story' }, opts.length > 1 ? 'Scouts bring word of two commanders. Choose whom to face: you will see their army before you spend your gold.' : 'One road leads on.'),
      h('div', { class: 'road', style: 'margin-top:1em' }, ...opts.map(n => {
        const r = RIVALS[n.rival];
        const rv = rivalArmy(s, n);
        return h('div', { class: 'panel roadcard' },
          portrait(n.rival, r.hero),
          h('div', {},
            h('h2', {}, n.name),
            h('div', {}, h('span', { class: 'tag' }, n.kind === 'final' ? 'FINAL' : n.kind === 'elite' ? 'ELITE +3 gold' : 'DUEL'), h('b', {}, `${r.name}`), `, ${r.title}`),
            h('div', { class: 'small', style: 'margin:.4em 0' }, WEATHER[n.weather]),
            h('div', { class: 'small' }, `Army: ${armyLine(rv)}`),
            h('div', { style: 'margin-top:.6em' }, btn('Take this road', () => { chooseRoad(s, n.id); done(); }))));
      })),
      h('div', { class: 'row' }, btn('Title screen', quit, { alt: true })));
  });
}

/* ---------------- 3. camp ---------------- */
export function campScreen(stage: Stage, s: RunState, save: () => void, march: () => void, quit: () => void): Scene {
  return domScene(stage, currentNode(s)?.battlefield ?? 'first_ford', 'music_camp', root => {
    let msg: Result | null = null;
    let fuseA: number | null = null;
    let tab: 'army' | 'fort' | 'deck' = 'army';
    const act = (r: Result): void => { msg = r; if (r.ok) { audio.play(r.note.includes('fuse') || r.note.includes('evolves') ? 'deploy' : 'coin'); save(); } draw(); };

    const regimentCard = (uid: number): HTMLElement => {
      const r = s.regiments.find(x => x.uid === uid)!;
      const tc = trainCost(r), ec = evolveCost(r), nf = nextForm(r);
      const sel = fuseA === r.uid;
      const fuseHint = fuseA !== null && fuseA !== r.uid ? (() => { const a = s.regiments.find(x => x.uid === fuseA)!; const out = fusionOf(a, r); return out ? CARDS[out].name : null; })() : null;
      const actions = h('div', { class: 'actions' });
      if (fuseA !== null) {
        if (sel) actions.append(btn('Cancel fusion', () => { fuseA = null; draw(); }, { alt: true }));
        else actions.append(btn(fuseHint ? `Fuse → ${fuseHint} (${DATA.costs.fuse})` : 'No recipe', () => { const a = fuseA!; fuseA = null; act(fuse(s, a, r.uid)); }, { off: !fuseHint || !canFuseForm(r) || s.gold < DATA.costs.fuse }));
      } else {
        if (tc !== null) actions.append(btn(`Train ${'★'.repeat(r.stars + 1)} (${tc})`, () => act(train(s, r.uid)), { off: s.gold < tc }));
        if (nf && ec !== null) actions.append(btn(`Evolve → ${CARDS[nf].name} (${ec})`, () => act(evolve(s, r.uid)), { off: s.gold < ec }));
        if (!isHybrid(r) && !isLevy(r)) actions.append(btn(canFuseForm(r) ? 'Fuse with…' : `Fuse at form ${ROMAN[DATA.fusion.minForm]}`, () => { fuseA = r.uid; msg = { ok: true, note: 'Choose a regiment of another family to fuse with.' }; draw(); }, { alt: true, off: !canFuseForm(r) }));
        if (s.regiments.length > DATA.minRegiments) actions.append(btn('Dismiss', () => act(dismiss(s, r.uid)), { alt: true }));
      }
      const preview = nf ? h('div', { class: 'small' }, `Next: ${CARDS[nf].name}`) : h('div', { class: 'small' }, isLevy(r) ? 'Replace with a recruit' : 'Top form');
      return h('div', { class: `unit ${sel ? 'sel' : ''} ${fuseA !== null && !sel && !fuseHint ? 'dim' : ''}` }, face(playId(r)), preview, actions);
    };

    const armyTab = (): HTMLElement => {
      const missing = FAMILIES.filter(f => !s.regiments.some(r => familyOf(r) === f));
      const full = s.regiments.length >= DATA.maxRegiments && !s.regiments.some(isLevy);
      return h('div', { class: 'panel' },
        h('h2', {}, `Regiments (${s.regiments.length}/${DATA.maxRegiments}) · 3 cards each`),
        h('div', { class: 'row' }, ...s.regiments.map(r => regimentCard(r.uid)),
          ...(fuseA === null ? missing.map(f => h('div', { class: 'unit' }, face(`${f}1`), h('div', { class: 'small' }, `Recruit ${familyName(f)}${s.regiments.some(isLevy) ? ' (replaces a Levy)' : ''}`),
            btn(`Recruit (${DATA.costs.recruit})`, () => act(recruit(s, f)), { off: s.gold < DATA.costs.recruit || full }))) : [])),
        h('div', { class: 'small', style: 'margin-top:.6em' }, `Train: +1 attack and +1 health per star (2 then 4 gold). Evolve: next form, stars kept (3, 5, 7 gold). Fuse: two families at form ${ROMAN[DATA.fusion.minForm]}+ become one hybrid regiment at the lower star count, and Levies fill the freed place (${DATA.costs.fuse} gold); hybrids evolve once more (${DATA.costs.evolveHybrid}).`),
        recipes());
    };

    const recipes = (): HTMLElement => {
      const rec = DATA.fusion.recipes as Record<string, string[]>;
      return h('div', { class: 'small', style: 'margin-top:.4em' }, h('b', {}, 'Fusion recipes: '),
        Object.entries(rec).map(([k, v]) => `${k.split('+').map(familyName).join(' + ')} = ${CARDS[v[0]].name} → ${CARDS[v[1]].name}`).join(' · '));
    };

    const fortTab = (): HTMLElement => {
      const f = s.fort, gate = GATES[f.gate], ng = GATES[f.gate + 1];
      const ex = DATA.fort.expand, rp = DATA.fort.repair;
      const slots = f.slots.map((card, i) => {
        if (!card) return h('div', { class: 'unit slot' }, h('div', { class: 'empty' }, `Empty plot ${i + 1}`),
          ...DATA.fort.build.options.map(o => btn(`Build ${CARDS[o].name} (${DATA.fort.build.cost})`, () => act(build(s, i, o)), { off: s.gold < DATA.fort.build.cost })));
        return h('div', { class: 'unit slot' }, face(card),
          ...structureUpgrades(card).map(u => btn(`→ ${CARDS[u.to].name} (${u.cost})`, () => act(upgradeStructure(s, i, u.to)), { off: s.gold < u.cost })));
      });
      return h('div', { class: 'panel' },
        h('h2', {}, `Your wagon-fort · ${f.hp}/${f.maxHp}`),
        h('div', { class: 'hp' }, h('i', { style: `width:${Math.round(100 * f.hp / f.maxHp)}%` })),
        h('div', { class: 'row' },
          btn(`Repair +${rp.hp} (${rp.cost})`, () => act(repair(s)), { off: s.gold < rp.cost || f.hp >= f.maxHp || s.repairedAt === s.stop }),
          btn(`Widen ring +${ex.hp} max (${ex.cost})`, () => act(expand(s)), { off: s.gold < ex.cost || f.expansions >= ex.max }),
          ng ? btn(`${ng.name}: strikes back ${ng.thorns} (${ng.cost})`, () => act(upgradeGate(s)), { off: s.gold < ng.cost }) : h('span', { class: 'chip' }, 'Royal Gate hung')),
        h('div', { class: 'small', style: 'margin:.5em 0' }, `${gate.name}: ${gate.text} Walls (Guard) must fall before your Fort can be struck; towers shoot at the Front Line. Structures stand behind your Support Line in every duel without taking one of its four places.`),
        h('div', { class: 'row' }, ...slots));
    };

    const deckTab = (): HTMLElement => {
      const deck = deckOf(s);
      const counts = new Map<string, number>(); deck.forEach(id => counts.set(id, (counts.get(id) ?? 0) + 1));
      return h('div', { class: 'panel' }, h('h2', {}, `Battle deck · ${deck.length} cards`),
        h('div', { class: 'grid' }, ...[...counts].map(([id, n]) => h('div', {}, face(id), h('div', { class: 'small center' }, `×${n}`)))));
    };

    const draw = (): void => {
      const n = currentNode(s)!;
      const r = RIVALS[n.rival];
      const rv = rivalArmy(s, n);
      root.replaceChildren(
        topBar(s),
        h('h1', {}, 'Camp'),
        h('div', { class: 'panel row', style: 'align-items:center' },
          h('div', { style: 'width:clamp(60px,12vh,110px)' }, portrait(n.rival, r.hero)),
          h('div', { style: 'flex:1;min-width:14em' }, h('h2', {}, `Next: ${r.name} at ${n.name}`),
            h('div', { class: 'small' }, WEATHER[n.weather]),
            h('div', { class: 'small' }, `Their army (same budget as yours): ${armyLine(rv)}`)),
          btn('March to battle ⚔', march, { big: true })),
        h('div', { class: `toast ${msg && !msg.ok ? 'bad' : ''}` }, msg ? (msg.ok ? msg.note : msg.reason) : ''),
        h('div', { class: 'row', style: 'margin-bottom:.6em' },
          btn('Army', () => { tab = 'army'; draw(); }, { alt: tab !== 'army' }),
          btn('Fort', () => { tab = 'fort'; draw(); }, { alt: tab !== 'fort' }),
          btn('Deck', () => { tab = 'deck'; draw(); }, { alt: tab !== 'deck' }),
          btn('Title screen', quit, { alt: true })),
        tab === 'army' ? armyTab() : tab === 'fort' ? fortTab() : deckTab());
    };
    draw();
  });
}

/* ---------------- 4. reward ---------------- */
export function rewardScreen(stage: Stage, s: RunState, done: () => void): Scene {
  return domScene(stage, 'first_ford', 'music_camp', root => {
    const n = ROUTE[s.stop].find(x => x.id === s.node) ?? currentNode(s);
    const art = (id: string): string => (id.startsWith('card:') ? id.slice(5) : id === 'train' ? 'sword2@2' : id === 'repair' ? 't_stitch' : id === 'recruit' ? 'levy' : 't_courier');
    root.replaceChildren(
      topBar(s),
      h('div', { class: 'center' },
        h('h1', {}, 'Victory'),
        h('div', { class: 'story' }, `${n ? RIVALS[n.rival].name : 'The rival'} lowers the colours. Gold is counted into the war chest. Choose one spoil of war.`),
        h('div', { class: 'pick' }, ...s.rewards.map(id => {
          const rw = rewardById(id)!;
          return h('div', { class: 'unit' }, face(art(id)), h('h2', {}, rw.label), h('div', { class: 'small' }, rw.text), btn('Take', () => { takeReward(s, id); done(); }));
        }))));
  });
}

/* ---------------- 5. defeat, and the end of a march ---------------- */
export function lostScreen(stage: Stage, s: RunState, again: () => void, end: () => void): Scene {
  return domScene(stage, 'first_ford', 'music_defeat', root => {
    const n = currentNode(s)!;
    root.replaceChildren(h('div', { class: 'center' },
      h('h1', {}, 'Defeat'),
      h('div', { class: 'story' }, `${RIVALS[n.rival].name} holds ${n.name}. ${s.retries > 0 ? 'Your march can regroup once and fight this duel again from the same starting point, with a fresh deal.' : 'There are no second chances left.'}`),
      h('div', { class: 'row', style: 'margin-top:1em' },
        s.retries > 0 ? btn('Regroup and fight again', again, { big: true }) : null,
        btn('End the march', end, { alt: s.retries > 0, big: s.retries <= 0 }))));
  });
}

export function summaryScreen(stage: Stage, s: RunState, again: () => void, title: () => void): Scene {
  const won = s.phase === 'won';
  return domScene(stage, 'first_ford', won ? 'music_victory' : 'music_defeat', root => {
    const m = loadMeta();
    root.replaceChildren(
      h('div', { class: 'center' },
        h('h1', {}, won ? 'The Fifth Bell rings' : 'The march is over'),
        h('div', { class: 'story' }, won ? `You rang the bell at Fifth Bell with your Fort at ${s.fort.hp}/${s.fort.maxHp}.` : `Your march won ${s.wins} of ${ROUTE.length} duels.`),
        h('div', { class: 'row', style: 'justify-content:center;margin:1em 0' }, ...s.regiments.map(r => h('div', { class: 'unit' }, face(playId(r)))))),
      h('div', { class: 'panel' }, h('h2', {}, 'Chronicle of the march'), ...s.chronicle.map(t => h('div', { class: 'small' }, '• ' + t))),
      h('div', { class: 'panel small' }, `Marches: ${m.marches} · Victories: ${m.victories} · Best: ${m.bestStop} duels won · Cards discovered: ${m.discovered.length}`),
      h('div', { class: 'row', style: 'justify-content:center' }, btn('New march', again, { big: true }), btn('Title screen', title, { alt: true })));
  });
}

/* ---------------- the Codex: every card, the undiscovered dimmed ---------------- */
export function codexScreen(stage: Stage, back: () => void): Scene {
  return domScene(stage, 'first_ford', 'music_camp', root => {
    const seen = new Set(loadMeta().discovered);
    const groups: [string, string[]][] = [
      ['Sword · Spear · Cavalry · Bow', FAMILIES.flatMap(f => (DATA.forms as Record<string, string[]>)[f])],
      ['Hybrids (fuse two families)', Object.values(DATA.fusion.recipes as Record<string, string[]>).flat()],
      ['Fort structures', ['f_palisade', 'f_stone_wall', 'f_bastion', 'f_thorn_rampart', 'f_watchtower', 'f_bow_tower', 'f_beacon_tower']],
      ['Levy and tactics', Object.values(CARDS).filter(c => !c.id.includes('@') && (c.family === 'levy' || c.sub === 'Tactic')).map(c => c.id)]
    ];
    root.replaceChildren(
      h('div', { class: 'bar' }, h('h1', {}, 'Codex'), btn('Back', back, { alt: true })),
      h('div', { class: 'story' }, 'Every regiment, hybrid and structure of the Bell Marches. Cards you have not fielded yet are dimmed. Tap a card to read it.'),
      ...groups.map(([name, ids]) => h('div', { class: 'panel' }, h('h2', {}, name),
        h('div', { class: 'grid' }, ...ids.map(id => {
          const known = seen.has(baseId(id)) || CARDS[id].form === 1 || CARDS[id].sub === 'Tactic' || id === 'levy';
          const el = face(id); if (!known) el.classList.add('lock');
          return h('div', {}, el, h('div', { class: 'small center' }, `${CARDS[id].name}${hasArt(id) ? '' : ' · art to come'}`));
        })))));
  });
}

export { cardOf };
