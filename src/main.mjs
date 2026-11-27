import {defs, tactics, unit, newBattle, legal, apply, clash, resolve, next, aiAction, aiOrder} from './engine.mjs';
import {firstFordLesson} from './first-ford.mjs';

import {cardArt, battlefieldArt, provisional, missingArt} from './art-status.mjs';
const root = document.querySelector('#app');
const artPreview = new URLSearchParams(location.search).get('art') !== '0';
const batchOne = new Set(Object.keys(cardArt));
function addArt(el, id) {
  if (!artPreview || !batchOne.has(id)) return;
  const img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  img.className = 'preview-art';
  img.addEventListener('error', () => { img.remove(); el.classList.remove('has-art'); });
  img.addEventListener('load', () => el.classList.add('has-art'));
  img.src = cardArt[id];
  el.prepend(img);
}
if (artPreview) {
  document.body.classList.add('art-preview');
  if (battlefieldArt) document.body.style.setProperty('--battlefield-art', 'url("' + battlefieldArt + '")');
}
const lanes = ['Road', 'Ridge'];
const orders = lanes.flatMap((_, lane) => ['press', 'hold'].map(kind => ({lane, kind})));
const familyNames = {sword: 'Sword', spear: 'Spear', rider: 'Cavalry', bow: 'Bow'};
const rules = {
  levy: 'A low-cost regiment. Deploy behind a lead to replace it if it falls.',
  sword1: 'A steady lead with 4 HP. Press adds 1 strike or breach. Hold grants 2 Guard.',
  sword2: 'Press adds a further 1 strike against a regiment.',
  spear1: 'Gains 1 strike against a cavalry lead.',
  rider1: 'Reposition its formation for zero Supply, once per round.',
  bow1: 'In the rear, adds 1 strike against an enemy lead.',
  watch: 'Swap a friendly lead and rear. The swap grants no reposition bonus.',
  stitch: 'Restore up to 2 HP to a damaged friendly regiment.',
  screen: 'Give a friendly lead 1 extra Guard for this clash.',
  courier: 'Draw up to two cards, then return one card to the bottom of the deck.'
};
const phaseTitles = {muster: 'Muster', choice: 'Choose a card', order: 'Secret command',
  reveal: 'Orders revealed', result: 'Duel complete'};
let families = ['sword', 'bow'];
let seed = 20261126;
let state, selected, order, rivalOrder, report, lesson, notice;
let inspected = '';
const label = id => defs[id]?.[0] || tactics[id];
const orderName = o => (o.kind === 'press' ? '▲ Press ' : '■ Hold ') + lanes[o.lane];
const stats = u => 'ATK ' + u.atk + ' · DEF ' + u.def + ' · HP ' + u.hp;
function element(tag, text, cls) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text !== undefined) el.textContent = text;
  return el;
}
function button(text, click, cls) {
  const el = element('button', text, cls);
  el.onclick = click;
  return el;
}
function title() {
  root.innerHTML = '<section class="shell"><div class="titlepanel"><div class="eyebrow">The Bell Marches</div><h1>Battle Master</h1><p>At First Ford, a rider on an open ridge can reach your wagons. Choose two regiments to hold the crossing.</p><h2 class="family-heading">Your regiments</h2><div class="choices"></div><label class="seed">Road seed <input type="number" min="0" max="4294967295"></label><div class="start"></div></div></section>';
  const status = element('p', missingArt.length || provisional.length
    ? 'Playable preview · artwork ' + (missingArt.length ? missingArt.length + ' pending' : 'complete') +
      (provisional.length ? ' · ' + provisional.length + ' provisional sources' : '')
    : 'First Ford · illustrated edition', 'release-note');
  root.querySelector('.titlepanel').append(status);
  const seedInput = root.querySelector('input');
  seedInput.value = seed;
  seedInput.oninput = () => { seed = Number(seedInput.value) >>> 0; };
  for (const [id, name] of Object.entries(familyNames)) {
    const b = button(name, () => {
      if (families.includes(id)) families = families.filter(f => f !== id);
      else families = [...families.slice(-1), id];
      title();
    });
    addArt(b, id + '1');
    b.setAttribute('aria-pressed', families.includes(id));
    root.querySelector('.choices').append(b);
  }
  const enter = button('Enter First Ford', () => start(false), 'primary');
  enter.disabled = families.length !== 2;
  root.querySelector('.start').append(enter, button('Learn one clash', () => start(true)));
  if (loadDuel()) root.querySelector('.start').append(button('Resume duel', resumeDuel));
}
const SAVE_KEY = 'battle-master:first-ford:v1';
function loadDuel() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    return saved?.version === 1 && saved.state?.players?.length === 2 &&
      ['muster','choice','order','reveal'].includes(saved.state.phase) ? saved : null;
  } catch { return null; }
}
function saveDuel() {
  if (lesson || !state) return;
  try {
    if (state.phase === 'result') localStorage.removeItem(SAVE_KEY);
    else localStorage.setItem(SAVE_KEY, JSON.stringify({version:1,state,order,rivalOrder,report,families,seed}));
  } catch { /* Storage may be disabled; play remains available. */ }
}
function resumeDuel() {
  const saved = loadDuel();
  if (!saved) return;
  ({state,order,rivalOrder,report,families,seed} = saved);
  order = order ? orders.find(o => o.kind === order.kind && o.lane === order.lane) : null;
  lesson = false; selected = null; notice = inspected = '';
  pump(); render();
}
function start(practice) {
  lesson = practice;
  state = lesson ? firstFordLesson() : newBattle(seed, families);
  selected = order = report = null;
  rivalOrder = lesson ? {kind: 'press', lane: 1} : null;
  notice = inspected = '';
  pump();
  render();
}
function pump() {
  while ((state.phase === 'muster' && state.turn === 1) ||
         (state.phase === 'choice' && state.pending.side === 1)) {
    apply(state, 1, aiAction(state));
  }
  if (state.phase === 'order' && !rivalOrder) rivalOrder = aiOrder(state);
}
function act(a) {
  apply(state, 0, a);
  selected = null;
  notice = inspected = '';
  pump();
  render();
}
function reveal() {
  report = resolve(state, [order, rivalOrder]);
  notice = inspected = '';
  render();
}
function nextRound() {
  next(state);
  order = rivalOrder = report = selected = null;
  notice = inspected = '';
  pump();
  render();
}
function fort(side) {
  const p = state.players[side];
  const box = element('div', undefined, side ? 'rival' : '');
  box.append(element('div', side ? 'Rival wagon-fort' : 'Your wagon-fort', 'eyebrow'),
    element('div', p.hp + ' / ' + p.maxHp + ' HP', 'fort'));
  const meter = element('meter');
  meter.min = 0;
  meter.max = p.maxHp;
  meter.value = p.hp;
  meter.setAttribute('aria-label', side ? 'Rival fort health' : 'Your fort health');
  box.append(meter);
  if (!lesson) box.append(element('small', 'Supply ' + p.supply + ' · ' + p.hand.length + ' cards'));
  return box;
}
function slot(side, lane, rank, actions) {
  const u = state.players[side].lanes[lane][rank];
  const target = !side && actions.find(a => a.h === selected && a.lane === lane &&
    (a.slot === rank || (rank === 0 && ['watch', 'screen'].includes(a.type))));
  const b = button('', () => {
    if (target) return act(target);
    inspected = u ? u.name + ' · ' + rules[u.id] : 'Empty ' + (rank ? 'rear' : 'lead') + ' on ' + lanes[lane] + '.';
    render();
  }, ['slot', side && 'enemy', u && 'filled', target && 'legal'].filter(Boolean).join(' '));
  b.append(element('span', (side ? 'Rival ' : 'Your ') + (rank ? 'rear' : 'lead'), 'label'));
  if (u) b.append(element('strong', u.name), element('span', stats(u) + (u.guard ? ' · G ' + u.guard : ''), 'stats'));
  else b.append(element('small', target ? 'Deploy here' : 'Empty'));
  if (u) addArt(b, u.id);
  return b;
}
function renderOrders(panel) {
  const group = element('div', undefined, 'ordergrid');
  for (const candidate of orders) {
    const b = button(orderName(candidate), () => {
      order = candidate;
      inspected = '';
      render();
    });
    b.setAttribute('aria-pressed', order === candidate);
    group.append(b);
  }
  panel.append(group);
  if (!order) return;
  // Enumerate public possibilities. The sealed rival order never enters the forecast.
  const possibilities = orders.map(other => clash(state, [order, other]));
  const range = values => {
    const lo = Math.min(...values), hi = Math.max(...values);
    return lo === hi ? String(lo) : lo + '–' + hi;
  };
  const box = element('div', undefined, 'forecast');
  box.append(element('strong', 'Across possible rival orders'));
  for (const side of [0, 1]) {
    const who = side ? 'Rival' : 'Your';
    const p = state.players[side];
    box.append(element('div', who + ' fort after clash · ' +
      range(possibilities.map(c => Math.max(0, p.hp - c.fortDamage[side]))) + ' HP'));
    p.lanes.forEach(([lead], lane) => {
      if (lead && state.players[1 - side].lanes[lane][0]) {
        box.append(element('div', who + ' ' + lead.name + ' · ' +
          range(possibilities.map(c => c.hit[side][lane])) + ' incoming damage'));
      }
    });
  }
  panel.append(box);
}
function renderReport(panel) {
  const summary = element('div', undefined, 'clash-report');
  summary.append(element('strong', 'You · ' + orderName(state.orders[0])),
    element('strong', 'Rival · ' + orderName(state.orders[1])));
  for (const [lane, name] of lanes.entries()) {
    summary.append(element('h4', name));
    let strikes = 0;
    for (const side of [1, 0]) {
      const row = report.reports[side][lane];
      if (!row) continue;
      strikes++;
      const owner = side ? 'Rival' : 'Your';
      if (row.kind === 'breach') {
        summary.append(element('p', owner + ' lane takes ' + row.incoming + ' breach. ' +
          (row.held ? 'Hold absorbs ' + row.held + '. ' : '') +
          (row.cover ? 'Elite Guard covers ' + row.cover + '. ' : '') +
          report.breach[side][lane] + ' reaches the gate.'));
      } else {
        summary.append(element('p', owner + ' ' + row.target + ' takes ' + row.damage + '. ' +
          row.attack + ' strike vs ' + row.armour + ' armour and ' + row.guard + ' Guard.' +
          (row.falls ? ' Regiment falls.' : '')));
      }
    }
    if (!strikes) summary.append(element('p', 'No regiments.'));
  }
  for (const side of [0, 1]) {
    if (report.plateAbsorbed[side]) summary.append(element('p',
      (side ? 'Rival' : 'Your') + ' gate plate absorbs ' + report.plateAbsorbed[side] + '.'));
  }
  panel.append(summary);
}
function renderHand(hand, actions) {
  state.players[0].hand.forEach((id, h) => {
    const u = defs[id] ? unit(id) : null;
    const b = button('', () => {
      if (state.phase === 'choice') return act({type: state.pending.kind, h});
      selected = h;
      inspected = '';
      notice = label(id) + ' · ' + rules[id];
      if (state.phase === 'muster' && !actions.some(a => a.h === h)) notice += ' No legal play now.';
      if (state.phase !== 'muster') inspected = notice;
      render();
    }, 'card' + (selected === h ? ' picked' : ''));
    b.append(element('span', (u?.cost ?? 1) + ' SUPPLY · ' + (u?.family ?? 'tactic').toUpperCase(), 'cost'),
      element('span', label(id), 'name'), element('span', u ? stats(u) : 'Tactic', 'stats'));
    addArt(b, id);
    b.setAttribute('aria-pressed', selected === h);
    hand.append(b);
  });
}
function render() {
  saveDuel();
  // Keep the strip anchored while a tap redraws the board.
  const scroll = root.querySelector('.hand')?.scrollLeft || 0;
  const actions = legal(state, 0);
  const phase = state.phase;
  root.innerHTML = '<section class="game"><header class="top"></header><div class="arena"><div class="lanes"></div><aside class="panel"></aside></div><footer class="handbar"><div class="hand"></div><div class="handinfo"></div></footer></section>';
  const heading = element('div', undefined, 'round');
  heading.append(element('div', 'First Ford', 'eyebrow'),
    element('strong', lesson ? 'Practice clash' : 'Round ' + state.round + ' / 8'),
    element('div', phaseTitles[phase], 'status'));
  root.querySelector('.top').append(fort(0), heading, fort(1));
  lanes.forEach((name, l) => {
    const lane = element('section', undefined, 'lane');
    lane.append(element('h2', name));
    for (const side of [1, 0]) {
      if (side === 0) lane.append(element('div', 'Clash line', 'divider'));
      const rank = element('div', undefined, 'rank');
      rank.append(slot(side, l, 0, actions), slot(side, l, 1, actions));
      lane.append(rank);
    }
    root.querySelector('.lanes').append(lane);
  });

  const panel = root.querySelector('.panel'), hand = root.querySelector('.hand'), info = root.querySelector('.handinfo');
  panel.append(element('h3', phaseTitles[phase]));
  if (inspected) panel.append(element('p', inspected));
  if (phase === 'muster') {
    panel.append(element('p', notice || 'Tap a card, then a highlighted slot. Pass when your formation is ready.'));
    for (const a of actions.filter(a => a.type === 'move' || (a.type === 'courier' && a.h === selected))) {
      panel.append(button(a.type === 'move' ? 'Move to ' + lanes[1 - a.lane] : 'Use Quick Courier', () => act(a)));
    }
    info.append(button('Pass muster', () => act({type: 'pass'}), 'primary'));
  } else if (phase === 'choice') {
    panel.append(element('p', state.pending.kind === 'bottom' ? 'Tap a hand card to return it to the deck bottom.' : 'Tap a card to discard down to seven.'));
  } else if (phase === 'order') {
    panel.append(element('p', lesson ? 'Your sword and archer face a spear. A rider has the Ridge. Which order protects your 8 HP?' :
      'Press strengthens your strike or breach. Hold guards a lead or an empty lane.'));
    renderOrders(panel);
    const b = button('Reveal both', reveal, 'primary');
    b.disabled = !order;
    info.append(b);
  } else {
    if (phase === 'result') panel.append(element('strong', {win: 'Victory — passage granted.', loss: 'Defeat at First Ford.', draw: 'The duel ends in a draw.'}[state.result]));
    renderReport(panel);
    if (lesson) info.append(button('Try another order', () => start(true)), button('Choose regiments', title, 'primary'));
    else if (phase === 'result') info.append(button('New duel', title, 'primary'));
    else info.append(button('Next round', nextRound, 'primary'));
  }
  if (lesson) {
    hand.classList.add('lesson-note');
    hand.append(element('strong', phase === 'order' ? 'Read both lanes' : 'At the ford'),
      element('span', phase === 'order' ? 'Try Press Road or Hold Ridge, then reveal both standards.' :
        'The spear falls either way. Hold Ridge preserves two more fort HP than Press Road.'));
  } else {
    renderHand(hand, actions);
    info.prepend(element('div', 'Supply ' + state.players[0].supply + ' / 6 · Deck ' + state.players[0].deck.length, 'supply'));
    hand.scrollLeft = scroll;
    if (state.log.length) {
      const log = element('details', undefined, 'history');
      log.append(element('summary', 'Battle log'));
      state.log.forEach(line => log.append(element('p', line)));
      panel.append(log);
    }
  }
}
title();
