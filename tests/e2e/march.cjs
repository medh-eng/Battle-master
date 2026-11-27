/* Scripted playtest of a march: title → muster → camp (army, fort, deck) → battle briefing → a few turns
   of real drags → victory → reward → the fork in the road → camp purchases (train, evolve, build) → second battle.
   Screenshots go to <outdir>. TURNS=n sets how many turns of the first battle are played before the bot
   calls the end screen (window.__yuddh.showEnd) so the march can continue; FULL=1 plays the battle out.
   Usage: node tests/e2e/march.cjs <url> <outdir> [width height]
   In the cloud sandbox: PW=/opt/npm-tools/node_modules/playwright CHROME=/usr/bin/google-chrome */
const { chromium } = require(process.env.PW || 'playwright');
const [url = 'http://localhost:4173/', out = '.', W = '1280', H = '720'] = process.argv.slice(2);
const TURNS = +(process.env.TURNS || 3);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: +W, height: +H } });
  await p.addInitScript(() => { window.__yuddhLongPressMs = 4000; try { localStorage.setItem('bm.notice.v1', '1'); localStorage.setItem('yuddh.knowcard.v1', '1'); } catch (e) { /* private */ } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const shot = n => p.screenshot({ path: `${out}/${n}.png` });
  const press = async (label) => {
    let bs = [];
    for (let i = 0; i < 60; i++) { bs = (await p.evaluate(() => window.__yuddhButtons ? window.__yuddhButtons() : [])).filter(x => x.label === label); if (bs[0]) break; await p.waitForTimeout(250); }
    if (!bs[0]) throw new Error(`no button "${label}" (have: ${(await p.evaluate(() => window.__yuddhButtons())).map(x => x.label).join(', ')})`);
    await p.mouse.click(bs[0].x, bs[0].y);
  };
  const dom = async (text, nth = 0) => { const l = p.locator('#bm-ui button', { hasText: text }).nth(nth); await l.waitFor({ timeout: 20000 }); await l.click(); await p.waitForTimeout(500); };
  const info = () => p.evaluate(() => { const y = window.__yuddh; const st = y.state(); return { active: st.active, over: st.over, winner: st.winner, turn: st.turn, busy: y.busy(), hq: st.players.map(q => q.hq.hp), kosha: st.players[0].kosha, units: st.players[0].support.length + st.front.units.length, hand: st.players[0].hand.length }; });
  const idle = async () => { for (let i = 0; i < 240; i++) { const y = await info(); if (!y.busy && (y.active === 0 || y.over)) return y; await p.waitForTimeout(250); } return info(); };
  const drag = async (f, t) => {
    if (f.y > +H * 0.7) { await p.mouse.move(f.x, +H * 0.45); await p.waitForTimeout(400); }
    await p.mouse.move(f.x, f.y); await p.waitForTimeout(300); await p.mouse.down();
    for (let i = 1; i <= 10; i++) await p.mouse.move(f.x + (t.x - f.x) * i / 10, f.y + (t.y - f.y) * i / 10);
    await p.waitForTimeout(80); await p.mouse.up();
  };
  const battle = async (tag, turns) => {
    await p.waitForFunction(() => !!window.__yuddh && window.__yuddhButtons().some(b => b.label === 'To battle'), null, { timeout: 90000 });
    await p.waitForTimeout(1500); await shot(`${tag}-briefing`);
    await press('To battle'); await p.waitForTimeout(3000);
    const log = []; let failed = 0;
    for (let turn = 0; turn < turns; turn++) {
      let y = await idle(); if (y.over) break;
      for (let k = 0; k < 10; k++) {
        const moves = await p.evaluate(() => window.__yuddh.moves());
        if (!moves.length) break;
        const rank = m => /Fort/.test(m.what) ? 0 : /attacks/.test(m.what) ? 1 : /advances/.test(m.what) ? 2 : /deploy/.test(m.what) ? 3 : 4;
        moves.sort((a, c) => rank(a) - rank(c));
        const m = moves[0], before = JSON.stringify(await info());
        await drag(m.from, m.to);
        y = await idle();
        if (JSON.stringify(y) === before) { failed++; log.push(`no effect: ${m.what}`); if (failed <= 3) await shot(`${tag}-fail-${failed}`); break; }
        log.push(`t${y.turn}: ${m.what}`);
        if (y.over) break;
      }
      if (turn === 1) await shot(`${tag}-turn2`);
      y = await info(); if (y.over) break;
      const end = await p.evaluate(() => window.__yuddh.endTurn());
      await p.mouse.click(end.x, end.y); await p.waitForTimeout(1200);
    }
    await idle(); await shot(`${tag}-board`);
    const fin = await info();
    if (!fin.over) await p.evaluate(() => window.__yuddh.showEnd(true));
    await p.waitForTimeout(2500); await shot(`${tag}-end`);
    await press('Continue');
    return { fin, log: log.slice(-6), failed };
  };

  await p.goto(url); await p.waitForTimeout(3000); await shot('01-title');
  await press('New march'); await p.waitForTimeout(2500); await shot('02-muster');
  await dom('Choose', 0); await dom('Choose', 1); await shot('03-muster-picked');
  await dom('Begin the march'); await p.waitForTimeout(1500); await shot('04-camp');
  await dom('Fort'); await shot('05-camp-fort');
  await dom('Deck'); await shot('06-camp-deck');
  await dom('Army');
  await dom('March to battle');
  const b1 = await battle('07-b1', process.env.FULL ? 60 : TURNS);
  await p.waitForTimeout(2000); await shot('08-reward');
  await dom('Take', 0); await p.waitForTimeout(1500); await shot('09-route');
  await dom('Take this road', 0); await p.waitForTimeout(1500); await shot('10-camp2');
  // spend: train, then evolve if affordable, then a wall
  const tryDom = async (text) => { const l = p.locator('#bm-ui button:not([disabled])', { hasText: text }).first(); if (await l.count()) { await l.click(); await p.waitForTimeout(600); return true; } return false; };
  await tryDom('Evolve'); await tryDom('Train'); await shot('11-camp2-spent');
  await dom('Fort'); await tryDom('Build Palisade'); await shot('12-camp2-fort');
  await dom('March to battle');
  const b2 = await battle('13-b2', 1);
  await p.waitForTimeout(2500); await shot('14-after-b2');
  console.log(JSON.stringify({ b1, b2, errors: errs }, null, 1));
  await b.close();
})().catch(e => { console.error('PLAYTEST FAILED', e); process.exit(1); });
