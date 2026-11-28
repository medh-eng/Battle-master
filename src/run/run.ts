/* ============================================================
   Battle Master — the roguelike march.
   Pure functions over a plain RunState: no DOM, no Pixi, so tests
   and the rival generator use exactly the code the camp screen uses.
   Every number comes from src/data/run.json.
   ============================================================ */
import RUN from '../data/run.json';
import { CARDS, baseId, starId } from '../engine/cards';
import { rngFactory, shuffle } from '../engine/rules';

export type Family = 'sword' | 'spear' | 'rider' | 'bow';
export interface Regiment { uid: number; card: string; stars: number }
export interface FortState { hp: number; maxHp: number; gate: number; expansions: number; slots: (string | null)[] }
export interface Army { regiments: Regiment[]; tactics: string[]; fort: FortState; nextUid: number }
export type Phase = 'route' | 'camp' | 'battle' | 'reward' | 'lost' | 'won';
export interface RouteNode { id: string; name: string; rival: string; battlefield: string; weather: string; kind: 'duel' | 'elite' | 'final' }
export interface RunState extends Army {
  v: 1;
  seed: number;
  /** index of the next battle in RUN.route (0..6) */
  stop: number;
  /** the node chosen for the current stop, once the player has picked a road */
  node: string | null;
  path: string[];
  gold: number;
  /** what the player's army has had to spend so far: the rival's budget (see rivalArmy) */
  budget: number;
  wins: number;
  retries: number;
  phase: Phase;
  rewards: string[];
  repairedAt: number;
  chronicle: string[];
  /** the seed of the battle being fought (fixed so a resume replays the same deal) */
  battleSeed: number;
  /** Fort health when the current battle began (a retry restores it) */
  entryHp: number;
}

export const DATA = RUN;
export const FAMILIES = RUN.families as Family[];
export const FORMS = RUN.forms as Record<string, string[]>;
export const ROUTE = RUN.route as RouteNode[][];
export const RIVALS = RUN.rivals as Record<string, { name: string; title: string; hero: string; families: Family[]; fort: number; hybrid?: string; intro: string }>;
export const GATES = RUN.fort.gates;
type Upgrade = { to: string; cost: number };
const UPGRADES = RUN.fort.upgrades as Record<string, Upgrade[]>;
const RECIPES = RUN.fusion.recipes as unknown as Record<string, [string, string]>;

/* ---------------- reading a regiment ---------------- */
export const cardOf = (r: Regiment) => CARDS[r.card];
export const familyOf = (r: Regiment): string => cardOf(r).family ?? 'levy';
export const isHybrid = (r: Regiment): boolean => familyOf(r).startsWith('hybrid:');
export const isLevy = (r: Regiment): boolean => familyOf(r) === 'levy';
/** the id the battle uses: the card at its training level */
export const playId = (r: Regiment): string => starId(r.card, r.stars);
export const familyName = (f: string): string => (RUN.familyNames as Record<string, string>)[f] ?? f;
/** the base families a regiment belongs to (a hybrid belongs to both parents) */
export function familiesOf(r: Regiment): string[] {
  const f = familyOf(r);
  return f.startsWith('hybrid:') ? f.slice(7).split('+') : [f];
}

/** the next form of a regiment, or null at the top of its line */
export function nextForm(r: Regiment): string | null {
  const c = cardOf(r);
  if (!c.family || c.family === 'levy') return null;
  const line = c.family.startsWith('hybrid:') ? RECIPES[c.family.slice(7)] : FORMS[c.family];
  const i = line.indexOf(baseId(r.card));
  return i >= 0 && i < line.length - 1 ? line[i + 1] : null;
}

/* ---------------- prices ---------------- */
export const C = RUN.costs;
export const trainCost = (r: Regiment): number | null => (isLevy(r) || r.stars >= 3 ? null : C.train[r.stars - 1]);
export function evolveCost(r: Regiment): number | null {
  if (!nextForm(r)) return null;
  return isHybrid(r) ? C.evolveHybrid : C.evolve[(cardOf(r).form ?? 1) - 1];
}
/** the recipe two regiments make, if any (order does not matter) */
export function fusionOf(a: Regiment, b: Regiment): string | null {
  if (a.uid === b.uid || isHybrid(a) || isHybrid(b) || isLevy(a) || isLevy(b)) return null;
  const fa = familyOf(a), fb = familyOf(b);
  if (fa === fb) return null;
  const key = RECIPES[`${fa}+${fb}`] ? `${fa}+${fb}` : RECIPES[`${fb}+${fa}`] ? `${fb}+${fa}` : null;
  return key ? RECIPES[key][0] : null;
}
export const canFuseForm = (r: Regiment): boolean => (cardOf(r).form ?? 1) >= RUN.fusion.minForm;

export type Result = { ok: true; note: string } | { ok: false; reason: string };
const fail = (reason: string): Result => ({ ok: false, reason });
function pay(s: RunState, cost: number): Result | null {
  if (s.gold < cost) return fail(`Needs ${cost} gold (you have ${s.gold})`);
  s.gold -= cost;
  return null;
}
const findR = (s: Army, uid: number) => s.regiments.find(r => r.uid === uid);

/* ---------------- army purchases ---------------- */
export function recruit(s: RunState, fam: Family, free = false): Result {
  if (!FAMILIES.includes(fam)) return fail('Unknown family');
  if (s.regiments.some(r => familyOf(r) === fam)) return fail(`You already command a ${familyName(fam)} regiment`);
  const levy = s.regiments.find(isLevy);
  if (s.regiments.length >= RUN.maxRegiments && !levy) return fail('Your army is full: fuse or dismiss a regiment first');
  if (!free) { const p = pay(s, C.recruit); if (p) return p; }
  const r: Regiment = { uid: s.nextUid++, card: FORMS[fam][0], stars: 1 };
  if (s.regiments.length >= RUN.maxRegiments && levy) s.regiments.splice(s.regiments.indexOf(levy), 1, r);
  else if (levy) s.regiments.splice(s.regiments.indexOf(levy), 1, r);
  else s.regiments.push(r);
  return { ok: true, note: `${cardOf(r).name} regiment joins the march.` };
}

export function train(s: RunState, uid: number, free = false): Result {
  const r = findR(s, uid); if (!r) return fail('No such regiment');
  const cost = trainCost(r); if (cost === null) return fail(isLevy(r) ? 'Levies cannot be trained' : 'Already at three stars');
  if (!free) { const p = pay(s, cost); if (p) return p; }
  r.stars += 1;
  return { ok: true, note: `${cardOf(r).name} trained to ${'★'.repeat(r.stars)}.` };
}

export function evolve(s: RunState, uid: number): Result {
  const r = findR(s, uid); if (!r) return fail('No such regiment');
  const to = nextForm(r), cost = evolveCost(r);
  if (!to || cost === null) return fail('This regiment is at the top of its line');
  const p = pay(s, cost); if (p) return p;
  const from = cardOf(r).name;
  r.card = to;
  return { ok: true, note: `${from} evolves into ${CARDS[to].name}.` };
}

export function fuse(s: RunState, a: number, b: number): Result {
  const ra = findR(s, a), rb = findR(s, b);
  if (!ra || !rb) return fail('Choose two regiments');
  const out = fusionOf(ra, rb);
  if (!out) return fail('These two regiments have no fusion recipe');
  if (!canFuseForm(ra) || !canFuseForm(rb)) return fail(`Both regiments must be form ${'I'.repeat(RUN.fusion.minForm)} or higher`);
  const p = pay(s, C.fuse); if (p) return p;
  const r: Regiment = { uid: s.nextUid++, card: out, stars: Math.min(ra.stars, rb.stars) };
  const i = s.regiments.indexOf(ra);
  s.regiments = s.regiments.filter(x => x !== ra && x !== rb);
  s.regiments.splice(Math.min(i, s.regiments.length), 0, r);
  // the freed place is filled by fresh Levies, so the deck keeps its size (a smaller deck runs dry sooner)
  s.regiments.push({ uid: s.nextUid++, card: 'levy', stars: 1 });
  return { ok: true, note: `${cardOf(ra).name} and ${cardOf(rb).name} fuse into ${CARDS[out].name}! Levies fill the freed place.` };
}

export function dismiss(s: RunState, uid: number): Result {
  const r = findR(s, uid); if (!r) return fail('No such regiment');
  if (s.regiments.length - 1 < RUN.minRegiments) return fail(`Your army needs at least ${RUN.minRegiments} regiments`);
  s.regiments = s.regiments.filter(x => x !== r);
  return { ok: true, note: `${cardOf(r).name} regiment is sent home.` };
}

/* ---------------- fort services ---------------- */
export function repair(s: RunState, free = 0): Result {
  if (s.fort.hp >= s.fort.maxHp) return fail('Your Fort is at full health');
  if (!free) {
    if (s.repairedAt === s.stop) return fail('The carpenters have already worked this camp');
    const p = pay(s, RUN.fort.repair.cost); if (p) return p;
    s.repairedAt = s.stop;
  }
  const before = s.fort.hp;
  s.fort.hp = Math.min(s.fort.maxHp, s.fort.hp + (free || RUN.fort.repair.hp));
  return { ok: true, note: `Fort repaired: ${before} → ${s.fort.hp}.` };
}

export function expand(s: Army & { gold: number }): Result {
  const e = RUN.fort.expand;
  if (s.fort.expansions >= e.max) return fail('The wagon ring is as wide as it can go');
  const p = pay(s as RunState, e.cost); if (p) return p;
  s.fort.expansions += 1; s.fort.maxHp += e.hp; s.fort.hp += e.hp;
  return { ok: true, note: `Wagon ring expanded: +${e.hp} Fort health.` };
}

export function upgradeGate(s: Army & { gold: number }): Result {
  const next = GATES[s.fort.gate + 1];
  if (!next) return fail('Your gate is already the Royal Gate');
  const p = pay(s as RunState, next.cost); if (p) return p;
  s.fort.gate += 1; s.fort.maxHp += next.hp; s.fort.hp += next.hp;
  return { ok: true, note: `${next.name} hung. It strikes back for ${next.thorns}.` };
}

export function build(s: Army & { gold: number }, slot: number, card: string): Result {
  if (slot < 0 || slot >= s.fort.slots.length) return fail('No such slot');
  if (s.fort.slots[slot]) return fail('That slot is already built');
  if (!RUN.fort.build.options.includes(card)) return fail('Cannot build that');
  const p = pay(s as RunState, RUN.fort.build.cost); if (p) return p;
  s.fort.slots[slot] = card;
  return { ok: true, note: `${CARDS[card].name} raised.` };
}

export const structureUpgrades = (card: string | null): Upgrade[] => (card ? UPGRADES[card] ?? [] : []);
export function upgradeStructure(s: Army & { gold: number }, slot: number, to: string): Result {
  const cur = s.fort.slots[slot];
  const u = structureUpgrades(cur).find(x => x.to === to);
  if (!cur || !u) return fail('No such upgrade');
  const p = pay(s as RunState, u.cost); if (p) return p;
  s.fort.slots[slot] = to;
  return { ok: true, note: `${CARDS[cur].name} becomes ${CARDS[to].name}.` };
}

/* ---------------- deck ---------------- */
/** the battle deck: three copies of every regiment at its training level, then the tactics */
export function deckOf(a: Army): string[] {
  const out: string[] = [];
  a.regiments.forEach(r => { for (let i = 0; i < RUN.copies; i++) out.push(playId(r)); });
  return [...out, ...a.tactics];
}
export const structuresOf = (a: Army): string[] => a.fort.slots.filter((x): x is string => !!x);
export const thornsOf = (a: Army): number => GATES[a.fort.gate].thorns;

/* ---------------- a new march ---------------- */
function freshFort(): FortState {
  return { hp: RUN.fort.baseHp, maxHp: RUN.fort.baseHp, gate: 0, expansions: 0, slots: Array.from({ length: RUN.fort.slots }, () => null) };
}
function startArmy(fams: Family[]): Army {
  let uid = 1;
  const regiments: Regiment[] = fams.map(f => ({ uid: uid++, card: FORMS[f][0], stars: 1 }));
  for (let i = 0; i < RUN.start.levyRegiments; i++) regiments.push({ uid: uid++, card: 'levy', stars: 1 });
  return { regiments, tactics: RUN.start.tactics.slice(), fort: freshFort(), nextUid: uid };
}

export function newRun(fams: Family[], seed = Math.floor(Math.random() * 1e9)): RunState {
  if (fams.length !== RUN.start.pick || new Set(fams).size !== fams.length) throw new Error(`choose ${RUN.start.pick} different families`);
  return {
    v: 1, seed, stop: 0, node: ROUTE[0].length === 1 ? ROUTE[0][0].id : null, path: [],
    gold: RUN.start.gold, budget: 0, wins: 0, retries: RUN.retries,
    phase: ROUTE[0].length === 1 ? 'camp' : 'route', rewards: [], repairedAt: -1, chronicle: [`The march sets out with ${fams.map(familyName).join(' and ')} regiments.`],
    battleSeed: 0, entryHp: RUN.fort.baseHp,
    ...startArmy(fams)
  };
}

export const nodeById = (id: string | null): RouteNode | undefined => ROUTE.flat().find(n => n.id === id);
export const currentNode = (s: RunState): RouteNode | undefined => nodeById(s.node);
export const routeOptions = (s: RunState): RouteNode[] => ROUTE[s.stop] ?? [];

export function chooseRoad(s: RunState, id: string): Result {
  const n = routeOptions(s).find(x => x.id === id);
  if (!n) return fail('That road is not open');
  s.node = id;
  s.phase = 'camp';
  return { ok: true, note: `The march takes the road to ${n.name}.` };
}

/** fix the deal and remember the Fort's health: a resume or retry replays from here */
export function beginBattle(s: RunState): void {
  s.phase = 'battle';
  s.entryHp = s.fort.hp;
  s.battleSeed = rngFactory(s.seed * 31 + s.stop * 7919 + (RUN.retries - s.retries) * 104729)() * 1e9 | 0;
}

/* ---------------- after a battle ---------------- */
export const winIncome = (n: RouteNode): number => RUN.income.win + (n.kind === 'elite' ? RUN.income.elite : 0);

/** the battle is over: `fortHp` is what is left of the player's Fort */
export function finishBattle(s: RunState, won: boolean, fortHp: number): void {
  const n = currentNode(s)!;
  if (won) {
    s.fort.hp = Math.max(1, Math.min(s.fort.maxHp, fortHp));
    const g = winIncome(n);
    s.gold += g; s.budget += g; s.wins += 1;
    s.path.push(n.id);
    s.chronicle.push(`Won at ${n.name} against ${RIVALS[n.rival].name} (Fort ${s.fort.hp}/${s.fort.maxHp}). +${g} gold.`);
    if (n.kind === 'final') { s.phase = 'won'; return; }
    s.rewards = rollRewards(s);
    s.phase = 'reward';
  } else {
    s.chronicle.push(`Defeated at ${n.name} by ${RIVALS[n.rival].name}.`);
    s.phase = 'lost';
  }
}

/** a lost battle, fought again from the same entry state with a new deal */
export function retry(s: RunState): Result {
  if (s.retries <= 0) return fail('No second chance left');
  s.retries -= 1;
  s.fort.hp = s.entryHp;
  s.chronicle.push('The march regroups for a second attempt.');
  beginBattle(s);
  return { ok: true, note: 'Second chance taken.' };
}

/* ---------------- rewards ---------------- */
type Reward = (typeof RUN.rewards)[number];
export const REWARDS = RUN.rewards as Reward[];
export const rewardById = (id: string): Reward | undefined => REWARDS.find(r => r.id === id);

function rewardUseful(s: RunState, r: Reward): boolean {
  if (r.id === 'train') return s.regiments.some(x => trainCost(x) !== null);
  if (r.id === 'repair') return s.fort.hp < s.fort.maxHp;
  if (r.id === 'recruit') return FAMILIES.some(f => !s.regiments.some(x => familiesOf(x).includes(f))) && (s.regiments.length < RUN.maxRegiments || s.regiments.some(isLevy));
  if (r.id.startsWith('card:')) return s.tactics.length < RUN.maxTactics;
  return true;
}

/** three different rewards, seeded by the run and the stop */
export function rollRewards(s: RunState): string[] {
  const rng = rngFactory(s.seed + s.stop * 977 + 13);
  const pool = REWARDS.filter(r => rewardUseful(s, r));
  const out: string[] = [];
  while (out.length < RUN.rewardChoices && pool.length) {
    const total = pool.reduce((a, r) => a + r.weight, 0);
    let x = rng() * total, i = 0;
    while (x >= pool[i].weight) { x -= pool[i].weight; i++; }
    out.push(pool[i].id); pool.splice(i, 1);
  }
  return out;
}

export function takeReward(s: RunState, id: string): Result {
  if (!s.rewards.includes(id)) return fail('That reward is not on offer');
  const r = rewardById(id)!;
  let res: Result = { ok: true, note: r.label };
  if (r.gold) s.gold += r.gold;
  else if (id === 'train') {
    const best = s.regiments.filter(x => trainCost(x) !== null).sort((a, b) => (cardOf(b).cost - cardOf(a).cost) || (b.stars - a.stars))[0];
    res = best ? train(s, best.uid, true) : fail('Nobody to train');
  } else if (id === 'repair') res = repair(s, 8);
  else if (id === 'recruit') {
    const missing = FAMILIES.filter(f => !s.regiments.some(x => familiesOf(x).includes(f)));
    const rng = rngFactory(s.seed + s.stop * 31);
    res = missing.length ? recruit(s, missing[Math.floor(rng() * missing.length)], true) : fail('No family left to recruit');
  } else if (id.startsWith('card:')) { s.tactics.push(id.slice(5)); res = { ok: true, note: `${CARDS[id.slice(5)].name} added to your deck.` }; }
  s.budget += r.value;
  s.rewards = [];
  s.stop += 1;
  s.node = ROUTE[s.stop]?.length === 1 ? ROUTE[s.stop][0].id : null;
  s.phase = s.node ? 'camp' : 'route';
  if (res.ok) s.chronicle.push(`Reward: ${r.label}.`);
  return res;
}

/* ---------------- the equal rival ----------------
   The rival starts from the same kit and spends the same budget the player has
   been given, under the same prices and rules, guided by its commander's taste.
   Its Fort is built from its own purchases and enters with the same share of
   its health that the player's Fort has left (a battered march meets a
   battered rival: no one starts a duel fresher than the other). */
export interface RivalArmy extends Army { gold: number; spent: string[] }

export function rivalArmy(s: RunState, node: RouteNode): RivalArmy {
  const rv = RIVALS[node.rival];
  const a: RivalArmy = { ...startArmy(rv.families), gold: s.budget, spent: [] };
  const rng = rngFactory(s.seed + node.id.length * 101 + s.stop * 53);
  const act = (r: Result) => { if (r.ok) a.spent.push(r.note); return r.ok; };
  const st = a as unknown as RunState;
  // the rival's shopping list, cheapest sensible improvement first, repeated until the purse is empty
  for (let guard = 0; guard < 40 && a.gold > 0; guard++) {
    const fortTurn = rng() < rv.fort;
    let done = false;
    if (fortTurn) {
      const empty = a.fort.slots.indexOf(null);
      const towers = rv.families.includes('bow');
      if (empty >= 0) done = act(build(a, empty, towers && empty === 1 ? 'f_watchtower' : 'f_palisade'));
      if (!done) for (let i = 0; i < a.fort.slots.length && !done; i++) { const up = structureUpgrades(a.fort.slots[i])[0]; if (up) done = act(upgradeStructure(a, i, up.to)); }
      if (!done) done = act(upgradeGate(a));
      if (done) continue;
    }
    // a second family as soon as it can, then its hybrid, then forms, then stars
    const second = rv.families.find(f => !a.regiments.some(r => familiesOf(r).includes(f)));
    if (second) done = act(recruit(st, second));
    if (!done && rv.hybrid) {
      const [fa, fb] = rv.hybrid.split('+');
      const ra = a.regiments.find(r => familyOf(r) === fa), rb = a.regiments.find(r => familyOf(r) === fb);
      if (ra && rb && canFuseForm(ra) && canFuseForm(rb)) done = act(fuse(st, ra.uid, rb.uid));
      else for (const r of [ra, rb]) if (!done && r && !canFuseForm(r)) done = act(evolve(st, r.uid));
    }
    if (!done) {
      const order = a.regiments.filter(r => !isLevy(r)).sort((x, y) => (cardOf(x).form ?? 1) - (cardOf(y).form ?? 1));
      for (const r of order) { if (!done && (cardOf(r).form ?? 1) < 3) done = act(evolve(st, r.uid)); }
      for (const r of order) { if (!done) done = act(train(st, r.uid)); }
      for (const r of order) { if (!done) done = act(evolve(st, r.uid)); }
    }
    if (!done) { const third = FAMILIES.find(f => !a.regiments.some(r => familiesOf(r).includes(f))); if (third) done = act(recruit(st, third)); }
    if (!done) done = act(upgradeGate(a));
    if (!done) break;
  }
  a.fort.hp = Math.max(1, Math.round(a.fort.maxHp * s.fort.hp / s.fort.maxHp));
  // the rival's tactics: the starting kit plus one bonus card per win, like the player's rewards
  const extras = ['t_volley', 't_war_horn', 't_fire_pots', 't_caltrops', 't_mend', 't_bell'];
  shuffle(extras, rng);
  for (let i = 0; i < Math.min(s.stop, extras.length) && a.tactics.length < RUN.maxTactics; i++) a.tactics.push(extras[i]);
  return a;
}

/* ---------------- save and resume ---------------- */
export interface Store { getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem?(k: string): void }
const KEY = 'bm.run.v1', BACKUP = 'bm.run.v1.bak', META = 'bm.meta.v1';
function store(): Store | null { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } }

export function saveRun(s: RunState, st: Store | null = store()): void {
  if (!st) return;
  try { const prev = st.getItem(KEY); if (prev) st.setItem(BACKUP, prev); st.setItem(KEY, JSON.stringify(s)); } catch { /* full */ }
}
export function loadRun(st: Store | null = store()): RunState | null {
  if (!st) return null;
  for (const k of [KEY, BACKUP]) {
    try { const s = JSON.parse(st.getItem(k) || 'null') as RunState | null; if (s && s.v === 1 && Array.isArray(s.regiments)) return s; } catch { /* try the backup */ }
  }
  return null;
}
export function clearRun(st: Store | null = store()): void { try { st?.removeItem?.(KEY); st?.removeItem?.(BACKUP); } catch { /* blocked */ } }

export interface Meta { marches: number; victories: number; bestStop: number; discovered: string[]; /** the Field Manual has been shown once */ tutorial: boolean }
export function loadMeta(st: Store | null = store()): Meta {
  try { const m = JSON.parse(st?.getItem(META) || 'null'); if (m) return { marches: m.marches || 0, victories: m.victories || 0, bestStop: m.bestStop || 0, discovered: m.discovered || [], tutorial: !!m.tutorial }; } catch { /* fresh */ }
  return { marches: 0, victories: 0, bestStop: 0, discovered: [], tutorial: false };
}
export function saveMeta(m: Meta, st: Store | null = store()): void { try { st?.setItem(META, JSON.stringify(m)); } catch { /* blocked */ } }
/** remember every card the player has fielded (the Codex shows the rest as silhouettes) */
export function discover(s: RunState, st: Store | null = store()): Meta {
  const m = loadMeta(st);
  const seen = new Set(m.discovered);
  s.regiments.forEach(r => seen.add(baseId(r.card)));
  structuresOf(s).forEach(c => seen.add(c));
  m.discovered = [...seen];
  m.bestStop = Math.max(m.bestStop, s.wins);
  saveMeta(m, st);
  return m;
}

/* ---------------- a quick duel: two generated armies of equal budget ---------------- */
export function quickRun(seed = Math.floor(Math.random() * 1e9)): RunState {
  const rng = rngFactory(seed);
  const ids = Object.keys(RIVALS);
  const stop = 2 + Math.floor(rng() * 4);
  const mine = ids[Math.floor(rng() * ids.length)];
  const s = newRun(RIVALS[mine].families.slice(0, 2) as Family[], seed);
  s.stop = stop;
  for (let i = 0; i < stop; i++) s.budget += RUN.income.win + 3;
  const opts = ROUTE[stop];
  let node = opts[Math.floor(rng() * opts.length)];
  if (node.rival === mine) node = { ...node, rival: ids[(ids.indexOf(mine) + 1) % ids.length] };
  const me = rivalArmy(s, { ...node, rival: mine });
  s.regiments = me.regiments; s.tactics = me.tactics; s.fort = me.fort; s.nextUid = me.nextUid;
  s.fort.hp = s.fort.maxHp;
  s.node = node.id;
  s.retries = 0;
  s.chronicle = [`Quick duel: ${stop} battles' worth of gold for each side.`];
  beginBattle(s);
  return s;
}
