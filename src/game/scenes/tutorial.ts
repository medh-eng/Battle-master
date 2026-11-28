/* ============================================================
   Battle Master — the Field Manual: an illustrated, hands-on
   introduction. Eleven short lessons, each with something to tap:
   what the numbers on a card mean, Supply, how a duel runs, how gold
   is earned and spent, training stars, evolving, fusing and fortifying.
   Every lesson uses the real cards, prices and rules from the game's
   data files, so the manual cannot drift from the game.
   It is shown once before the first march, and is reachable from the
   title screen and the camp.
   ============================================================ */
import { CARDS } from '../../engine/cards';
import { DATA, FAMILIES, GATES, familyName } from '../../run/run';
import { audio } from '../audio';
import type { Scene, Stage } from '../stage';
import { btn, domScene, face, h } from './march';

const CSS = `
#bm-ui .tut{max-width:74em;margin:0 auto}
#bm-ui .tut .top{display:flex;align-items:center;gap:1em;flex-wrap:wrap;margin-bottom:.6em}
#bm-ui .tut .dots{display:flex;gap:.35em;flex-wrap:wrap;flex:1;min-width:8em}
#bm-ui .tut .dot{width:.9em;height:.9em;border-radius:50%;border:2px solid #c98a4a;background:rgba(16,24,38,.85);cursor:pointer}
#bm-ui .tut .dot.done{background:#c98a4a}
#bm-ui .tut .dot.now{background:#ffe9b0;box-shadow:0 0 10px #ffd76a}
#bm-ui .tut .lesson{font:700 .8em Cinzel,serif;letter-spacing:.14em;color:#e7c46e}
#bm-ui .tut .nav{display:flex;gap:.8em;justify-content:space-between;align-items:center;margin-top:.4em}
#bm-ui .tut .lead{font:500 clamp(14px,2.7vh,21px)/1.45 Alegreya,serif;color:#fbf1d8;margin:.2em 0 .8em;text-shadow:0 1px 3px #000}
#bm-ui .tut .try{border-top:1px dashed rgba(231,196,110,.5);margin-top:.8em;padding-top:.7em}
#bm-ui .tut .try>b{font:700 .8em Cinzel,serif;letter-spacing:.12em;color:#9cff8a}
#bm-ui .tut .remember{background:rgba(231,196,110,.14);border-left:4px solid #e7c46e;padding:.5em .8em;margin-top:.8em;border-radius:0 8px 8px 0;font-weight:700}
#bm-ui .tut .cardbox{position:relative;width:clamp(120px,30vh,250px);flex:none}
#bm-ui .tut .cardbox img{width:100%;aspect-ratio:480/672;border-radius:9px;display:block;box-shadow:0 5px 16px rgba(0,0,0,.65)}
#bm-ui .tut .pin{position:absolute;width:3.1em;height:3.1em;margin:-1.55em 0 0 -1.55em;border-radius:50%;background:rgba(127,212,255,.12);
  border:3px solid #7fd4ff;cursor:pointer;animation:pinpulse 1.6s infinite;z-index:2}
#bm-ui .tut .pin b{position:absolute;right:-.7em;top:-.7em;width:1.7em;height:1.7em;border-radius:50%;display:grid;place-items:center;background:#7fd4ff;color:#06202e;font:800 .85em 'Alegreya Sans',sans-serif;border:2px solid #fff}
#bm-ui .tut .pin.on{border-color:#ffe9b0;background:rgba(255,233,176,.18);animation:none;box-shadow:0 0 0 3px rgba(255,233,176,.45),0 0 14px #ffd76a}
#bm-ui .tut .pin.on b{background:#ffe9b0}
#bm-ui .tut .chip{display:inline-block}
@keyframes pinpulse{0%{box-shadow:0 0 0 0 rgba(127,212,255,.8)}70%{box-shadow:0 0 0 .9em rgba(127,212,255,0)}100%{box-shadow:0 0 0 0 rgba(127,212,255,0)}}
#bm-ui .tut .legend{flex:1;min-width:15em;display:flex;flex-direction:column;gap:.45em}
#bm-ui .tut .leg{display:flex;gap:.6em;align-items:flex-start;padding:.45em .6em;border-radius:8px;border:1px solid rgba(201,138,74,.45);background:rgba(10,14,22,.55);cursor:pointer}
#bm-ui .tut .leg.on{border-color:#ffe9b0;background:rgba(231,196,110,.18)}
#bm-ui .tut .leg i{font:800 .9em 'Alegreya Sans',sans-serif;font-style:normal;background:#7fd4ff;color:#06202e;border-radius:50%;width:1.7em;height:1.7em;display:grid;place-items:center;flex:none}
#bm-ui .tut .leg.on i{background:#ffe9b0}
#bm-ui .tut .meter{display:inline-flex;gap:.25em;align-items:center;font:700 1em Cinzel,serif}
#bm-ui .tut .gem{width:1.5em;height:1.5em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff2c4,#e2b14e 50%,#8a5a17);border:2px solid #4a2c08;display:inline-block}
#bm-ui .tut .gem.off{filter:grayscale(1) brightness(.45)}
#bm-ui .tut .hand .unit{width:clamp(78px,17vh,150px);position:relative}
#bm-ui .tut .hand .unit img{transition:transform .15s,filter .2s}
#bm-ui .tut .hand .unit.ok img{outline:3px solid #9cff8a;outline-offset:2px}
#bm-ui .tut .hand .unit.no img{filter:grayscale(.7) brightness(.65)}
#bm-ui .tut .hand .unit.played img{filter:grayscale(1) brightness(.4)}
#bm-ui .tut .hand .unit.shake img{animation:shk .3s}
@keyframes shk{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
#bm-ui .tut .board{display:flex;flex-direction:column;gap:.35em;max-width:34em;margin:.4em 0}
#bm-ui .tut .lane{display:flex;align-items:center;gap:.6em;border-radius:9px;padding:.4em .7em;min-height:3.2em;border:2px solid rgba(201,138,74,.45);background:rgba(10,14,22,.62);transition:all .3s}
#bm-ui .tut .lane label{width:7.6em;flex:none;font:700 .72em Cinzel,serif;letter-spacing:.06em;color:#e7c46e}
#bm-ui .tut .lane.lit{border-color:#ffe9b0;background:rgba(231,196,110,.2);box-shadow:0 0 14px rgba(255,215,106,.4)}
#bm-ui .tut .lane.front{background:rgba(120,60,30,.35)}
#bm-ui .tut .tok{display:inline-grid;place-items:center;min-width:3.2em;height:2.5em;border-radius:7px;font:800 .95em 'Alegreya Sans',sans-serif;border:2px solid #000;padding:0 .4em;transition:all .4s}
#bm-ui .tut .tok.me{background:#3f6ea8;color:#fff}
#bm-ui .tut .tok.foe{background:#a8452f;color:#fff}
#bm-ui .tut .fort{background:linear-gradient(90deg,#5a3a14,#7a5420);color:#ffe9b0;font:700 .9em Cinzel,serif;border-radius:7px;padding:.2em .8em;border:2px solid #000}
#bm-ui .tut .bars{display:flex;gap:.35em;align-items:flex-end;height:11em;margin:.6em 0}
#bm-ui .tut .bar2{flex:1;max-width:9em;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:.25em;font:700 .85em Cinzel,serif}
#bm-ui .tut .bar2 i{display:block;width:100%;border-radius:6px 6px 0 0;background:linear-gradient(180deg,#ffd76a,#a8741f);border:1px solid #4a2c08;transition:height .5s}
#bm-ui .tut .bar2.elite i{background:linear-gradient(180deg,#9cff8a,#2f7a2a)}
#bm-ui .tut .bar2.off i{opacity:.18}
#bm-ui .tut .shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(12.5em,1fr));gap:.5em}
#bm-ui .tut .shop button{display:flex;justify-content:space-between;gap:.5em;text-align:left;font:700 .85em 'Alegreya Sans',sans-serif;letter-spacing:0}
#bm-ui .tut .shop button span{font-family:Cinzel,serif}
#bm-ui .tut .arrow{font:700 1.8em Cinzel,serif;color:#e7c46e;align-self:center}
#bm-ui .tut .tabs{display:flex;gap:.4em;flex-wrap:wrap;margin-bottom:.6em}
#bm-ui .tut .toast2{min-height:1.5em;font-weight:700;color:#9cff8a;text-shadow:0 1px 3px #000}
#bm-ui .tut .toast2.bad{color:#ffb09a}
#bm-ui .tut .cols2{display:grid;grid-template-columns:repeat(auto-fit,minmax(15em,1fr));gap:.7em}
#bm-ui .tut .tip{padding:.55em .8em;border-radius:9px;background:rgba(10,14,22,.6);border:1px solid rgba(201,138,74,.45)}
#bm-ui .tut .tip b{display:block;font:700 .8em Cinzel,serif;letter-spacing:.1em;color:#e7c46e;margin-bottom:.15em}
`;
let styled = false;
function ensureStyle(): void {
  if (styled) return; styled = true;
  const el = document.createElement('style'); el.textContent = CSS; document.head.appendChild(el);
}

type Kid = Node | string | null | false;
const row = (...kids: Kid[]) => h('div', { class: 'row', style: 'align-items:center' }, ...kids);
const remember = (t: string) => h('div', { class: 'remember' }, t);
const tryIt = (...kids: Kid[]) => h('div', { class: 'try' }, h('b', {}, 'TRY IT'), h('div', { style: 'margin-top:.4em' }, ...kids));
const price = (n: number) => `${n} gold`;
const cardName = (id: string) => CARDS[id].name;
const stat = (id: string) => `${CARDS[id].atk}/${CARDS[id].hp}`;

/** a card with numbered pins on its numbers; tapping a pin or its legend row lights both */
function annotated(id: string, pins: { x: number; y: number; title: string; text: string }[]): HTMLElement {
  let on = 0;
  const box = h('div', { class: 'cardbox' }, h('img', { src: face(id).getAttribute('src') ?? '', alt: cardName(id), draggable: 'false' }));
  const legend = h('div', { class: 'legend' });
  const els: { pin: HTMLElement; leg: HTMLElement }[] = [];
  const light = (i: number): void => { on = i; audio.play('click'); els.forEach((e, k) => { e.pin.classList.toggle('on', k === i); e.leg.classList.toggle('on', k === i); }); };
  pins.forEach((p, i) => {
    const pin = h('div', { class: 'pin', style: `left:${p.x}%;top:${p.y}%` }, h('b', {}, String(i + 1)));
    const leg = h('div', { class: 'leg' }, h('i', {}, String(i + 1)), h('div', {}, h('b', {}, p.title), h('div', { class: 'small' }, p.text)));
    pin.addEventListener('click', () => light(i)); leg.addEventListener('click', () => light(i));
    box.append(pin); legend.append(leg); els.push({ pin, leg });
  });
  els[on].pin.classList.add('on'); els[on].leg.classList.add('on');
  return h('div', { class: 'row', style: 'align-items:flex-start;gap:1.4em' }, box, legend);
}

/* ---------------- the lessons ---------------- */
interface Page { title: string; render: () => HTMLElement }

const pages: Page[] = [
  {
    title: 'Welcome to the Bell Marches',
    render: () => {
      const flow = h('div', { class: 'row', style: 'align-items:center;gap:.6em;margin:.6em 0' },
        ...[['⚔', 'Win a duel'], ['⛃', 'Earn gold'], ['⚒', 'Spend it at camp'], ['➜', 'Take the next road']].flatMap(([i, t], k) =>
          [k ? h('span', { class: 'arrow' }, '›') : null, h('div', { class: 'tip center', style: 'min-width:8em;align-items:center' }, h('div', { style: 'font-size:2em' }, i), h('b', {}, t))]));
      return h('div', {},
        h('div', { class: 'lead' }, 'You lead a wagon-fort army along the Bell Road. Seven duels stand between you and the great bell at Fifth Bell.'),
        flow,
        h('div', { class: 'cols2' },
          h('div', { class: 'tip' }, h('b', {}, 'A DUEL'), 'A turn-by-turn card battle. You play soldiers from your hand and break the rival\'s Fort before yours breaks.'),
          h('div', { class: 'tip' }, h('b', {}, 'THE CAMP'), 'Between duels you spend gold to make your army stronger: more stars, new forms, hybrids, a tougher Fort.'),
          h('div', { class: 'tip' }, h('b', {}, 'EQUAL RIVALS'), 'Every rival has earned exactly the same gold you have and follows the same prices. You win by spending better.')),
        remember('The whole game is one loop: fight, earn gold, upgrade, repeat. The next ten lessons teach each part.'));
    }
  },
  {
    title: 'Reading a card',
    render: () => h('div', {},
      h('div', { class: 'lead' }, 'Every soldier is a card. Four numbers matter. Tap a number on the card, or tap a line on the right.'),
      annotated('sword1', [
        { x: 13, y: 9, title: 'Gold coin: the Supply cost to play it', text: 'The Swordsman costs 2. You pay this once, from your hand, to put him on the field.' },
        { x: 88, y: 9, title: 'Bronze coin: the Supply cost to act', text: 'Each time he advances to the Front Line or attacks he pays 1. Most soldiers pay 1.' },
        { x: 14, y: 90.5, title: 'Attack (the blade): damage he deals', text: 'He hits for 2. Training and evolving raise this number.' },
        { x: 86, y: 90.5, title: 'Health (the shield): damage he can take', text: 'He survives 3 damage. At 0 he is destroyed. Damage stays until the duel ends.' }
      ]),
      remember('Gold coin = to play. Bronze coin = to move or strike. Blade = hurts. Shield = lasts.'))
  },
  {
    title: 'Supply and your hand',
    render: () => {
      let turn = 1, supply = 1;
      const ids = ['levy', 'sword1', 'bow1', 'sword2', 'sword3'];
      const played = new Set<string>();
      const toast = h('div', { class: 'toast2' }, 'Tap a card to play it.');
      const meter = h('div', { class: 'meter' });
      const hand = h('div', { class: 'row hand' });
      const draw = (): void => {
        meter.replaceChildren(`Turn ${turn} · Supply `, ...Array.from({ length: Math.min(turn, 12) }, (_, i) => h('span', { class: `gem ${i < supply ? '' : 'off'}` })), ` ${supply}/${Math.min(turn, 12)}`);
        hand.replaceChildren(...ids.map(id => {
          const cost = CARDS[id].cost, isPlayed = played.has(id);
          const u = h('div', { class: `unit ${isPlayed ? 'played' : cost <= supply ? 'ok' : 'no'}` }, face(id), h('div', { class: 'small center' }, `${cardName(id)} · costs ${cost}`));
          u.querySelector('img')!.addEventListener('click', e => {
            e.stopImmediatePropagation();
            if (isPlayed) return;
            if (cost > supply) { toast.className = 'toast2 bad'; toast.textContent = `${cardName(id)} costs ${cost}, but you only have ${supply} Supply left.`; u.classList.add('shake'); audio.play('yantra'); setTimeout(() => u.classList.remove('shake'), 350); return; }
            supply -= cost; played.add(id); audio.play('cardPlay');
            toast.className = 'toast2'; toast.textContent = `You play ${cardName(id)} for ${cost} Supply. ${supply} left this turn.`; draw();
          }, { capture: true });
          return u;
        }));
      };
      draw();
      return h('div', {},
        h('div', { class: 'lead' }, 'Supply is the energy you spend each turn. It starts at 1 and grows by 1 every turn, up to 12, and it refills completely at the start of your turn.'),
        tryIt(meter, toast, hand, h('div', { class: 'row', style: 'margin-top:.6em' },
          btn('End turn ⏭', () => { turn += 1; supply = Math.min(turn, 12); played.clear(); audio.play('turnBell'); toast.className = 'toast2'; toast.textContent = `A new turn: Supply refills to ${supply}.`; draw(); }),
          btn('Start over', () => { turn = 1; supply = 1; played.clear(); toast.className = 'toast2'; toast.textContent = 'Tap a card to play it.'; draw(); }, { alt: true }))),
        remember('Cheap cards early, heavy cards later. Moving and attacking also spend Supply, so never spend it all on the hand.'));
    }
  },
  {
    title: 'A duel in one minute',
    render: () => {
      const steps = [
        { on: ['mine'], title: '1 · Play a soldier', text: 'Drag a card from your hand onto your Support Line (your back row). It costs its gold coin and rests one turn.' },
        { on: ['front'], title: '2 · Advance to the Front Line', text: 'The Front Line is the ground between the armies. A soldier steps up for his bronze coin. Only one side can hold it at a time.' },
        { on: ['front', 'foes'], title: '3 · Attack', text: 'Drag your soldier onto an enemy to strike. Melee units trade blows; ranged units strike without a counter-blow. Guard units must be struck first.' },
        { on: ['front', 'foefort'], title: '4 · Strike the Fort', text: 'Once the enemy is cleared, your soldiers hit the Fort itself. Bring its health to 0 and you win the duel.' },
        { on: ['myfort'], title: '5 · Protect your own Fort', text: 'The enemy does the same to you. Fort damage is not healed after the duel: it carries to the next one, until you repair it at camp.' }
      ];
      let i = 0;
      const lane = (key: string, label: string, kids: Kid[], cls = '') => h('div', { class: `lane ${cls}`, 'data-k': key }, h('label', {}, label), ...kids);
      const tok = (side: 'me' | 'foe', t: string) => h('span', { class: `tok ${side}` }, t);
      const board = h('div', { class: 'board' },
        lane('foefort', 'RIVAL FORT', [h('span', { class: 'fort' }, '♜ 20')]),
        lane('foes', 'RIVAL SUPPORT', [tok('foe', '2/3'), tok('foe', '3/2')]),
        lane('front', 'FRONT LINE', [tok('me', '2/3'), tok('foe', '1/2')], 'front'),
        lane('mine', 'YOUR SUPPORT', [tok('me', '3/3'), tok('me', '2/2')]),
        lane('myfort', 'YOUR FORT', [h('span', { class: 'fort' }, '♜ 20')]));
      const info = h('div', { class: 'tip' });
      const show = (): void => {
        const s = steps[i];
        board.querySelectorAll('.lane').forEach(l => l.classList.toggle('lit', s.on.includes((l as HTMLElement).dataset.k!)));
        info.replaceChildren(h('b', {}, s.title), s.text);
      };
      show();
      return h('div', {},
        h('div', { class: 'lead' }, 'A duel is a tug of war over one shared strip of ground. Step through a turn:'),
        h('div', { class: 'row', style: 'align-items:flex-start;gap:1.2em' }, board,
          h('div', { style: 'flex:1;min-width:15em' }, info, h('div', { class: 'row', style: 'margin-top:.6em' },
            btn('◀ Step back', () => { i = Math.max(0, i - 1); audio.play('click'); show(); }, { alt: true }),
            btn('Next step ▶', () => { i = (i + 1) % steps.length; show(); })))),
        remember('Win by breaking the rival Fort. Tap End Turn when you are done; the rival then plays its turn.'));
    }
  },
  {
    title: 'Earning gold',
    render: () => {
      const inc = DATA.income as { win: number; elite: number };
      const stops = [
        { n: 'First Ford', elite: false }, { n: 'Fork 1', elite: false }, { n: 'Fork 2', elite: false },
        { n: 'Anvil Court', elite: true }, { n: 'Fork 3', elite: false }, { n: 'Crown Approach', elite: true }
      ];
      let won = 0;
      const chart = h('div', { class: 'bars' });
      const total = h('div', { class: 'chip gold' });
      const note = h('div', { class: 'toast2' });
      const draw = (): void => {
        let run = 0;
        chart.replaceChildren(...stops.map((s, k) => {
          const g = inc.win + (s.elite ? inc.elite : 0);
          if (k < won) run += g;
          const sum = stops.slice(0, k + 1).reduce((a, x) => a + inc.win + (x.elite ? inc.elite : 0), 0);
          return h('div', { class: `bar2 ${s.elite ? 'elite' : ''} ${k < won ? '' : 'off'}` }, h('span', {}, `+${g}`), h('i', { style: `height:${g * 9}px` }), h('span', { class: 'small' }, `${k + 1}`), h('span', { class: 'small', style: 'opacity:.7' }, k < won ? `${sum}` : ''));
        }));
        total.textContent = `⛃ ${run} gold earned so far`;
      };
      draw();
      return h('div', {},
        h('div', { class: 'lead' }, `Gold comes from three places: every duel you win pays ${inc.win}; elite commanders pay ${inc.elite} more; and after each win you choose one of three spoils, such as the War Chest (+4 gold).`),
        h('div', { class: 'cols2' },
          h('div', { class: 'tip' }, h('b', {}, `+${inc.win} A WIN`), 'Paid the moment a duel ends in victory. A loss pays nothing.'),
          h('div', { class: 'tip' }, h('b', {}, `+${inc.win + inc.elite} AN ELITE`), 'Stops 4 and 6 (green) have tougher commanders and a bigger purse.'),
          h('div', { class: 'tip' }, h('b', {}, 'SPOILS OF WAR'), 'After a win pick 1 of 3: gold, a free star, Fort repairs, a free recruit or a tactic card.')),
        tryIt(chart, h('div', { class: 'row', style: 'align-items:center' }, btn('Win the next duel ⚔', () => {
          if (won >= stops.length) { won = 0; } else { won += 1; audio.play('coin'); }
          note.textContent = won ? `Duel ${won} won.` : 'Back at the start.'; draw();
        }), total, note)),
        remember('A full march of six wins pays 42 gold, plus your spoils. Spend it wisely: your rival gets the same amount.'));
    }
  },
  {
    title: 'Spending gold at camp',
    render: () => {
      const C = DATA.costs as { recruit: number; train: number[]; evolve: number[]; fuse: number; evolveHybrid: number };
      const fort = DATA.fort as { repair: { cost: number; hp: number }; expand: { cost: number; hp: number }; build: { cost: number } };
      let gold = 12; const bought: string[] = [];
      const items: [string, string, number, string][] = [
        ['Train ★★', 'a regiment gets +1 attack and +1 health', C.train[0], 'starUp'],
        ['Evolve to form II', 'a stronger kind of soldier', C.evolve[0], 'evolve'],
        ['Recruit a family', 'a new regiment joins (3 cards)', C.recruit, 'cardPlay'],
        ['Fuse two regiments', 'make a hybrid', C.fuse, 'fuse'],
        ['Repair the Fort', `+${fort.repair.hp} Fort health`, fort.repair.cost, 'build'],
        ['Build a Palisade', 'a wall that shields your Fort', fort.build.cost, 'build'],
        ['Iron Gate', 'strikes back at attackers', GATES[1].cost, 'gateStrike'],
        ['Widen the ring', `+${fort.expand.hp} max Fort health`, fort.expand.cost, 'build']
      ];
      const wallet = h('div', { class: 'chip gold' }), log = h('div', { class: 'toast2' }), shop = h('div', { class: 'shop' });
      const draw = (): void => {
        wallet.textContent = `⛃ ${gold} gold`;
        shop.replaceChildren(...items.map(([n, d, c, snd]) => {
          const b = h('button', { disabled: gold < c, title: d }, h('div', {}, n, h('div', { class: 'small', style: 'font-weight:500' }, d)), h('span', {}, String(c)));
          b.addEventListener('click', () => { gold -= c; bought.push(n); audio.play(snd as 'coin'); log.textContent = `Bought: ${bought.join(' · ')}`; draw(); });
          return b;
        }));
      };
      draw();
      return h('div', {},
        h('div', { class: 'lead' }, 'At camp every purchase has a price, and you never have enough for everything. Here is a pretend camp with 12 gold. Buy what you would buy.'),
        tryIt(row(wallet, btn('Reset', () => { gold = 12; bought.length = 0; log.textContent = ''; draw(); }, { alt: true })), shop, log),
        h('div', { class: 'cols2', style: 'margin-top:.8em' },
          h('div', { class: 'tip' }, h('b', {}, 'SAVING IS ALLOWED'), 'Gold you do not spend stays with you. A big upgrade later can beat three small ones now.'),
          h('div', { class: 'tip' }, h('b', {}, 'LOOK BEFORE YOU BUY'), 'Camp shows the next rival\'s whole army. Spend on whatever beats it.'),
          h('div', { class: 'tip' }, h('b', {}, 'ARMY OR FORT?'), 'A stronger army wins duels. A stronger Fort survives the ones you nearly lose.')),
        remember('Everything is bought at camp, between duels. In a duel you cannot spend gold.'));
    }
  },
  {
    title: 'Upgrades: training stars',
    render: () => {
      const C = DATA.costs as { train: number[] };
      let stars = 1, gold = 6;
      const base = 'sword1';
      const idOf = (n: number) => (n === 1 ? base : `${base}@${n}`);
      const cardHost = h('div', {}), info = h('div', { class: 'toast2' }), wallet = h('div', { class: 'chip gold' });
      const strip = h('div', { class: 'row', style: 'align-items:center;gap:1em' });
      const draw = (): void => {
        strip.replaceChildren(...[1, 2, 3].flatMap(n => [...(n > 1 ? [h('span', { class: 'arrow' }, '›')] : []),
          h('div', { class: `unit ${n === stars ? 'sel' : n > stars ? 'dim' : ''}`, style: 'width:clamp(90px,19vh,170px)' }, face(idOf(n)), h('div', { class: 'small center' }, `${'★'.repeat(n)} · ${CARDS[idOf(n)]?.atk}/${CARDS[idOf(n)]?.hp}`))]));
        wallet.textContent = `⛃ ${gold} gold`;
      };
      cardHost.append(strip);
      draw();
      const trainBtn = btn('Train', () => {
        if (stars >= 3) { info.className = 'toast2 bad'; info.textContent = 'Three stars is the top.'; return; }
        const c = C.train[stars - 1];
        if (gold < c) { info.className = 'toast2 bad'; info.textContent = `Training to ${'★'.repeat(stars + 1)} costs ${c} gold.`; audio.play('yantra'); return; }
        gold -= c; stars += 1; audio.play('starUp'); info.className = 'toast2'; info.textContent = `Trained! Attack and health each rose by 1.`; draw(); trainBtn.textContent = label();
      });
      const label = () => (stars >= 3 ? 'Fully trained ★★★' : `Train to ${'★'.repeat(stars + 1)} (${C.train[stars - 1]} gold)`);
      trainBtn.textContent = label();
      return h('div', {},
        h('div', { class: 'lead' }, `Training adds a star. Each star gives +1 attack and +1 health to all three cards of the regiment in your deck. The first star is free; the second costs ${C.train[0]} gold and the third ${C.train[1]}.`),
        tryIt(cardHost, h('div', { class: 'row', style: 'margin-top:.6em;align-items:center' }, trainBtn, btn('Reset', () => { stars = 1; gold = 6; info.textContent = ''; trainBtn.textContent = label(); draw(); }, { alt: true }), wallet), info),
        remember('Stars are never lost: they stay on the regiment even when it evolves or fuses.'));
    }
  },
  {
    title: 'Upgrades: evolve',
    render: () => {
      const C = DATA.costs as { evolve: number[] };
      let fam = FAMILIES[0] as string;
      const host = h('div', {}), text = h('div', { class: 'tip', style: 'margin-top:.5em' });
      const draw = (): void => {
        const forms = (DATA.forms as Record<string, string[]>)[fam];
        host.replaceChildren(
          h('div', { class: 'tabs' }, ...FAMILIES.map(f => btn(familyName(f), () => { fam = f; draw(); }, { alt: f !== fam }))),
          h('div', { class: 'row', style: 'align-items:center;gap:.6em' }, ...forms.flatMap((id, k) => [
            k ? h('div', { class: 'center' }, h('span', { class: 'arrow' }, '›'), h('div', { class: 'chip gold small' }, price(C.evolve[k - 1]))) : null,
            h('div', { class: 'unit', style: 'width:clamp(80px,17vh,160px)' }, face(id), h('div', { class: 'small center' }, `${['I', 'II', 'III', 'IV'][k]} · ${cardName(id)} ${stat(id)}`))])));
        const t = (DATA.forms as Record<string, string[]>)[fam].map(id => CARDS[id]);
        text.replaceChildren(h('b', {}, `${familyName(fam as 'sword').toUpperCase()} LINE`), t.map(c => `${c.name}: ${c.text}`).join('  '));
      };
      draw();
      return h('div', {},
        h('div', { class: 'lead' }, 'Evolving turns a regiment into the next form of its family: a better soldier, often with a new power. Each of the four families has four forms.'),
        tryIt(host, text),
        h('div', { class: 'cols2', style: 'margin-top:.8em' },
          h('div', { class: 'tip' }, h('b', {}, `${C.evolve.join(' / ')} GOLD`), `Form I to II costs ${C.evolve[0]}, II to III costs ${C.evolve[1]}, III to IV costs ${C.evolve[2]}.`),
          h('div', { class: 'tip' }, h('b', {}, 'WHOLE REGIMENT'), 'All three cards of the regiment evolve together, and keep their stars.'),
          h('div', { class: 'tip' }, h('b', {}, 'TRAIN OR EVOLVE?'), 'Training is cheap and raises one number; evolving costs more and changes what the soldier can do.')),
        remember('Evolve to change what a regiment is. Train to make it hit harder and last longer.'));
    }
  },
  {
    title: 'Upgrades: fuse into hybrids',
    render: () => {
      const rec = DATA.fusion.recipes as Record<string, string[]>;
      const parent = (f: string) => (DATA.forms as Record<string, string[]>)[f][DATA.fusion.minForm - 1];
      const rows = Object.entries(rec).map(([k, v]) => {
        const [a, b] = k.split('+');
        return h('div', { class: 'row', style: 'align-items:center;gap:.5em;margin:.3em 0' },
          h('div', { class: 'unit', style: 'width:clamp(64px,12vh,110px)' }, face(parent(a))),
          h('span', { class: 'arrow' }, '+'),
          h('div', { class: 'unit', style: 'width:clamp(64px,12vh,110px)' }, face(parent(b))),
          h('span', { class: 'arrow' }, '='),
          h('div', { class: 'unit', style: 'width:clamp(64px,12vh,110px)' }, face(v[0])),
          h('div', { class: 'small' }, h('b', {}, `${cardName(v[0])} ${stat(v[0])}`), h('div', {}, `later: ${cardName(v[1])} ${stat(v[1])}`)));
      });
      return h('div', {},
        h('div', { class: 'lead' }, `Fusing joins two regiments of different families into one hybrid regiment, for ${DATA.costs.fuse} gold. Both need to be form II or higher. Tap any card to read it.`),
        h('div', { class: 'panel', style: 'display:grid;grid-template-columns:repeat(auto-fit,minmax(24em,1fr));gap:.4em 1.4em' }, ...rows),
        h('div', { class: 'cols2' },
          h('div', { class: 'tip' }, h('b', {}, 'LOWER STARS COUNT'), 'The hybrid keeps the lower star count of its two parents.'),
          h('div', { class: 'tip' }, h('b', {}, 'LEVIES FILL THE GAP'), 'Two regiments become one, so Levy cards fill the freed place and your deck stays the same size.'),
          h('div', { class: 'tip' }, h('b', {}, `EVOLVE AGAIN (${DATA.costs.evolveHybrid})`), 'A hybrid has one more form, usually a stronger version of the same idea.')),
        remember('Fusing costs you a regiment but gives a soldier stronger than either parent. Use it when you have two good regiments to spare.'));
    }
  },
  {
    title: 'Defence: your Fort',
    render: () => {
      const f = DATA.fort as { baseHp: number; repair: { cost: number; hp: number }; expand: { cost: number; hp: number; max: number } };
      let hp = f.baseHp, max = f.baseHp, gate = 0, widen = 0, gold = 10, plot = false;
      const hpBar = h('div', { class: 'hp' }, h('i', {})), hpTxt = h('b', {}), wallet = h('div', { class: 'chip gold' }), log = h('div', { class: 'toast2' });
      const controls = h('div', { class: 'row' });
      const draw = (): void => {
        (hpBar.firstChild as HTMLElement).style.width = `${Math.round(100 * hp / max)}%`;
        hpTxt.textContent = `♜ Fort ${hp}/${max} · ${GATES[gate].name}${GATES[gate].thorns ? ` (strikes back ${GATES[gate].thorns})` : ''}${plot ? ' · Palisade standing' : ''}`;
        wallet.textContent = `⛃ ${gold} gold`;
        const ng = GATES[gate + 1];
        controls.replaceChildren(
          btn('Enemy strikes the Fort (−6)', () => { hp = Math.max(1, hp - 6); audio.play('fortHit'); log.className = 'toast2 bad'; log.textContent = 'Fort damage stays with you into the next duel.'; draw(); }, { alt: true }),
          btn(`Repair +${f.repair.hp} (${f.repair.cost})`, () => { gold -= f.repair.cost; hp = Math.min(max, hp + f.repair.hp); audio.play('build'); log.className = 'toast2'; log.textContent = 'Repaired (once per camp).'; draw(); }, { off: gold < f.repair.cost || hp >= max }),
          btn(`Widen ring +${f.expand.hp} max (${f.expand.cost})`, () => { gold -= f.expand.cost; max += f.expand.hp; hp += f.expand.hp; widen += 1; audio.play('build'); draw(); }, { off: gold < f.expand.cost || widen >= f.expand.max }),
          ...(ng ? [btn(`${ng.name} (${ng.cost})`, () => { gold -= ng.cost; gate += 1; max += ng.hp; hp += ng.hp; audio.play('gateStrike'); log.className = 'toast2'; log.textContent = `Attackers now take ${GATES[gate].thorns} damage every time they strike your Fort.`; draw(); }, { off: gold < ng.cost })] : []),
          btn(plot ? 'Palisade built ✓' : `Build Palisade (${DATA.fort.build.cost})`, () => { gold -= DATA.fort.build.cost; plot = true; audio.play('build'); draw(); }, { off: plot || gold < DATA.fort.build.cost }),
          btn('Reset', () => { hp = max = f.baseHp; gate = 0; widen = 0; gold = 10; plot = false; log.textContent = ''; draw(); }, { alt: true }));
      };
      draw();
      const line = (name: string, ids: string[], costs: string) => h('div', { class: 'panel' }, h('h2', {}, name), h('div', { class: 'small' }, costs),
        h('div', { class: 'row' }, ...ids.map(id => h('div', { class: 'unit', style: 'width:clamp(70px,13vh,120px)' }, face(id), h('div', { class: 'small center' }, `${cardName(id)} ${stat(id)}`)))));
      return h('div', {},
        h('div', { class: 'lead' }, `Your Fort starts with ${f.baseHp} health. If it reaches 0 you lose the duel. Damage does not heal on its own, so a Fort that survives with 3 health starts the next duel with 3.`),
        tryIt(wallet, hpBar, hpTxt, controls, log),
        h('div', { class: 'cols2', style: 'margin-top:.8em' },
          line('Walls: Guard units', ['f_palisade', 'f_stone_wall', 'f_bastion'], 'Build 2, then upgrade 3 and 5. A wall must be destroyed before your Fort can be hit.'),
          line('Towers: shoot the Front Line', ['f_watchtower', 'f_bow_tower', 'f_beacon_tower'], 'Build 2, then upgrade 3 and 5. Towers shoot enemies on the Front Line every turn.')),
        remember('Gates hurt attackers, walls block them, towers shoot them, repairs and a wider ring give you more health to lose.'));
    }
  },
  {
    title: 'In the field',
    render: () => h('div', {},
      h('div', { class: 'lead' }, 'A few things to know when the first duel begins.'),
      h('div', { class: 'cols2' },
        h('div', { class: 'tip' }, h('b', {}, 'DRAG TO ACT'), 'Drag a card from your hand onto the board to play it. Drag one of your soldiers onto an enemy or the rival Fort to attack. Tap a card to read it.'),
        h('div', { class: 'tip' }, h('b', {}, 'GUARD (SHIELD BADGE)'), 'Enemies must hit a Guard first. A Guard on your Support Line also shields your Fort.'),
        h('div', { class: 'tip' }, h('b', {}, 'SWIFT (BOLT BADGE)'), 'Acts the turn it arrives. Cavalry may advance and strike in one turn; foot soldiers do one or the other.'),
        h('div', { class: 'tip' }, h('b', {}, 'RANGED (BOW BADGE)'), 'Strikes from the Support Line and takes no counter-blow.'),
        h('div', { class: 'tip' }, h('b', {}, 'TACTICS'), 'Tactic cards take effect at once: a volley of arrows, the war horn, fire pots, caltrops, mending walls, ringing the bell.'),
        h('div', { class: 'tip' }, h('b', {}, 'MORALE'), 'A soldier hurt down to a third of his health breaks and loses a turn. Guards, walls and Champions never break.'),
        h('div', { class: 'tip' }, h('b', {}, 'WEATHER'), 'Rain: no advance and attack in one turn. Heat: ranged units hit 1 less. Harvest: +1 Supply each turn for both sides.'),
        h('div', { class: 'tip' }, h('b', {}, 'DECK RUNS OUT'), 'Each draw from an empty deck costs your Fort health: 1, then 2, then 3. Win before your cards do.')),
      h('div', { class: 'row', style: 'margin-top:.8em;align-items:center' }, ...['rider1', 'sword3', 'bow1'].map(id => h('div', { class: 'unit', style: 'width:clamp(70px,13vh,120px)' }, face(id), h('div', { class: 'small center' }, cardName(id))))),
      remember('If you lose a duel, you may regroup once per march and fight it again from the same start. A second defeat ends the march.'))
  },
  {
    title: 'Ready to march',
    render: () => h('div', {},
      h('div', { class: 'lead' }, 'That is everything. You can open the Field Manual again from the title screen or from camp, at any time.'),
      h('div', { class: 'cols2' },
        h('div', { class: 'tip' }, h('b', {}, '1 · CHOOSE TWO FAMILIES'), 'Sword, Spear, Cavalry or Bow. Two Levy regiments and eight tactic cards fill out your deck.'),
        h('div', { class: 'tip' }, h('b', {}, '2 · WIN DUELS'), 'Break the rival Fort. Earn 6 gold per win, 9 from elites, plus one spoil.'),
        h('div', { class: 'tip' }, h('b', {}, '3 · UPGRADE AT CAMP'), 'Train stars, evolve, fuse hybrids, repair and fortify. Check the next rival first.'),
        h('div', { class: 'tip' }, h('b', {}, '4 · RING THE FIFTH BELL'), 'Win seven duels in a row (you get one second chance) and the march is won.')),
      remember('You will have no gold at the start. Win the first duel with what you have, then spend your first gold on the army.'))
  }
];

export interface TutorialOpts {
  /** label of the final button (for example "Muster my march") */
  finishLabel: string;
  onFinish(): void;
  /** leaves the manual without finishing (Close) */
  onExit(): void;
  startPage?: number;
}

export function tutorialScene(stage: Stage, o: TutorialOpts): Scene {
  ensureStyle();
  let at = Math.max(0, Math.min(pages.length - 1, o.startPage ?? 0));
  return domScene(stage, 'first_ford', 'music_camp', root => {
    const draw = (): void => {
      const pg = pages[at], last = at === pages.length - 1;
      const dots = h('div', { class: 'dots' }, ...pages.map((_, i) => {
        const d = h('i', { class: `dot ${i < at ? 'done' : i === at ? 'now' : ''}`, title: pages[i].title });
        d.addEventListener('click', () => { at = i; audio.play('click'); draw(); });
        return d;
      }));
      root.replaceChildren(h('div', { class: 'tut' },
        h('div', { class: 'top' }, h('span', { class: 'lesson' }, `FIELD MANUAL · LESSON ${at + 1} OF ${pages.length}`), dots, btn('Close ✕', o.onExit, { alt: true })),
        h('h1', {}, pg.title),
        h('div', { class: 'panel' }, pg.render()),
        h('div', { class: 'nav' },
          btn('◀ Previous', () => { at -= 1; draw(); }, { alt: true, off: at === 0 }),
          last ? btn(o.finishLabel, o.onFinish, { big: true }) : btn('Next lesson ▶', () => { at += 1; draw(); }, { big: true }))));
      root.scrollTop = 0;
    };
    draw();
  });
}

export const TUTORIAL_PAGES = pages.length;
