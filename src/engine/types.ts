/* ============================================================
   YUDDH — core types for the rules engine.
   The engine has no DOM code: it runs in the browser, in a web
   worker for the AI, and in node for tests and balance runs.
   ============================================================ */

export type EmpireId = 'maurya' | 'gupta' | 'chalukya' | 'chola' | 'rajput' | 'neutral';
export type PlayerIndex = 0 | 1;
/** veg = Swift, raksha = Guard, dhuan = Smoke, fort = a fixed structure (never advances; a melee structure never attacks) */
export type Keyword = 'veg' | 'raksha' | 'dhuan' | 'fort';
export type CardType = 'unit' | 'order' | 'yantra';
export type Range = 'melee' | 'ranged';
export type AiLevel = 'easy' | 'normal' | 'hard' | 'search';
export type Line = 'support' | 'front';
export type DeployEffect = 'draw1' | 'drawKosha' | 'kosha1' | 'buffLine' | 'buffAll' | 'kosha2' | 'setYantra' | 'hillVolley' | 'elephantBuff' | 'drawHeal';
export type YantraTrigger = 'onEnemyDeploy' | 'onHQAttack' | 'onUnitAttack';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Empire {
  id: EmpireId;
  name: string;
  capital: string;
  color: string;
  glyph: string;
  passive: string;
}

export interface CardDef {
  id: string;
  name: string;
  sub: string;
  empire: EmpireId;
  type: CardType;
  /** 'shakti' marks power orders; 'yantra' marks face-down traps */
  kind?: 'shakti' | 'yantra';
  cost: number;
  op?: number;
  atk?: number;
  hp?: number;
  range?: Range;
  kw?: Keyword[];
  glyph: string;
  text: string;
  deploy?: DeployEffect;
  target?: 'enemyUnit';
  trigger?: YantraTrigger;
  power?: number;
  /** data-driven order effects (cards.json): damage to the enemy Fort, cards drawn, Dharma steps */
  hqDamage?: number;
  draw?: number;
  heal?: number;
  kosha?: number;
  /** damage to every enemy unit (orders) */
  damageAll?: number;
  /** damage to every enemy unit on the Front Line */
  damageFront?: number;
  /** +attack for all your units */
  buffAtk?: number;
  /** heal every friendly unit by this much (orders) */
  healUnits?: number;
  dharma?: number;
  /** Pikes: a melee unit that advanced this turn and strikes this unit takes this much damage (Yuddh rules) */
  reprisal?: number;
  /** Elephant-slayers: extra damage when this unit strikes a War Elephant (Yuddh rules) */
  vsElephant?: number;
  rarity?: Rarity;
  /** Battle Master: the regiment family (sword, spear, rider, bow, levy, hybrid:a+b, fort), its form or tier, and training stars (1-3) */
  family?: string;
  form?: number;
  stars?: number;
}

export interface Unit {
  uid: number;
  cardId: string;
  name: string;
  sub: string;
  glyph: string;
  empire: EmpireId;
  atk: number;
  hp: number;
  maxHp: number;
  op: number;
  range: Range;
  kw: Keyword[];
  owner: PlayerIndex;
  canAct: boolean;
  moved: boolean;
  attacked: boolean;
  smokeBroken: boolean;
  upgraded?: number;
  /** Yuddh rules: the turn a Garuda Vyuha let this unit charge */
  surge?: number;
  /** Yuddh rules: battle honours won by destroying enemy units (0–2): Veteran +1 health, Champion also +1 attack */
  rank?: number;
  /** Yuddh rules, morale: 1 = just broke and fled (loses its next turn), 2 = resting this turn, rallies at the start of the next */
  routed?: 1 | 2;
}

export interface SetYantra { cardId: string; uid: number }

export interface Player {
  side: 'p0' | 'p1';
  empire: EmpireId;
  ally: EmpireId;
  faction: string;
  /** thorns: damage the Fort's gate deals back to every unit that strikes it */
  hq: { name: string; hp: number; maxHp: number; thorns?: number };
  kosha: number;
  maxKosha: number;
  deck: string[];
  hand: string[];
  discard: string[];
  support: Unit[];
  yantras: SetYantra[];
  fatigue: number;
  upgrades: Record<string, number>;
  drawBonus: number;
  counters: { ordersPlayed: number; unitsThisTurn: number; mantraThisTurn?: boolean };
  /** Yuddh rules: the Dharma–Kuta meter, −3 (Kuta, cunning) to +3 (Dharma, honour); 0 if unset */
  dharma?: number;
}

export type Objective =
  | { type: 'destroy'; turns?: number }
  | { type: 'survive'; turns: number }
  | { type: 'deadline'; turns: number };

export type WinReason = 'destroy' | 'both' | 'survive' | 'deadline' | null;

export interface LogEntry { turn: number; msg: string; side: number }

export type GameEvent =
  | { t: 'deploy'; owner: PlayerIndex; uid: number; cardId: string }
  | { t: 'move'; owner: PlayerIndex; uid: number }
  | { t: 'attack'; owner: PlayerIndex; uid: number; target: { owner: PlayerIndex; uid: number }; dmg: number }
  | { t: 'death'; owner: PlayerIndex; uid: number }
  | { t: 'hq'; owner: PlayerIndex; dmg: number; attacker: PlayerIndex; uid: number }
  | { t: 'order'; owner: PlayerIndex; cardId: string }
  | { t: 'yantra'; owner: PlayerIndex; cardId: string }
  | { t: 'yantraSet'; owner: PlayerIndex }
  | { t: 'promote'; owner: PlayerIndex; uid: number; rank: number }
  | { t: 'trample'; owner: PlayerIndex; uid: number; dmg: number }
  | { t: 'heal'; owner: PlayerIndex; uid: number; amount: number; by: number }
  | { t: 'rout'; owner: PlayerIndex; uid: number; fled: boolean }
  | { t: 'rally'; owner: PlayerIndex; uid: number }
  | { t: 'dharma'; owner: PlayerIndex; value: number; delta: number; why: string }
  | { t: 'attrition'; owner: PlayerIndex; dmg: number; fatigue: number };

export interface GameState {
  seed: number;
  turn: number;
  active: PlayerIndex;
  over: boolean;
  winner: PlayerIndex | null;
  winReason: WinReason;
  log: LogEntry[];
  nextUid: number;
  events: GameEvent[];
  front: { owner: PlayerIndex | null; units: Unit[] };
  players: [Player, Player];
  aiLevel: AiLevel;
  objective: Objective;
  scenarioId: string | null;
  scenarioName: string | null;
  rules?: Ruleset;
  season?: Season;
  /** Battle Master: no Dharma–Kuta meter */
  noDharma?: boolean;
  rng: () => number;
}

export type Target =
  | { kind: 'hq'; owner: PlayerIndex }
  | { kind: 'unit'; owner: PlayerIndex; uid: number };

export type Action =
  | { type: 'play'; handIndex: number; target?: Target | null }
  | { type: 'move'; uid: number }
  | { type: 'attack'; uid: number; target: Target }
  | { type: 'end' };

export type Check = { ok: true } | { ok: false; reason: string };

export interface SideConfig {
  empire: EmpireId;
  ally?: EmpireId;
  deck?: string[];
  hq?: number;
  /** current Fort health when it differs from its maximum (a roguelike run carries damage between battles) */
  hqHp?: number;
  /** gate counter-damage to each unit that strikes this Fort */
  hqThorns?: number;
  faction?: string;
  capital?: string;
  startKosha?: number;
  drawBonus?: number;
  upgrades?: Record<string, number>;
  handSize?: number;
  openingHand?: string[];
}

export interface Preset {
  enemyFront?: string[];
  playerFront?: string[];
  enemySupport?: string[];
  playerSupport?: string[];
}

export interface NewGameOptions {
  seed?: number;
  player: SideConfig;
  enemy: SideConfig;
  preset?: Preset;
  aiLevel?: AiLevel;
  objective?: Objective;
  scenarioId?: string | null;
  scenarioName?: string | null;
  /** 'classic' = the prototype's rules (golden traces); 'yuddh' = Guard guards the Fort,
      and a unit either moves or attacks in a turn unless it is mounted (see canCharge) */
  rules?: Ruleset;
  season?: Season;
  /** false = no Dharma–Kuta meter (Battle Master) */
  dharma?: boolean;
}
export type Ruleset = 'classic' | 'yuddh';
/** Ritu, the season a battle is fought in (Yuddh rules) */
export type Season = 'sharad' | 'varsha' | 'grishma' | 'hemanta';
