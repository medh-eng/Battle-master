/* ============================================================
   Battle Master — turns the current stop of a march into a
   Scenario the (Yuddh) battle screen can play: both armies' decks,
   Forts with their carried health, gates and wall structures.
   ============================================================ */
import { newGame } from '../engine/rules';
import { CARDS } from '../engine/cards';
import type { GameState, Season } from '../engine/types';
import type { Scenario } from '../campaign/scenario';
import { DATA, GATES, RIVALS, currentNode, deckOf, playId, rivalArmy, structuresOf, thornsOf, type RivalArmy, type RunState } from './run';

const WEATHER = DATA.weatherText as Record<string, string>;
export const PLAYER_FORT_ART = 't_screen';
export const STOP_LABEL = ['First stop', 'Second stop', 'Third stop', 'Fourth stop', 'Fifth stop', 'Sixth stop', 'The final stop'];

/** one line describing an army, strongest regiments first */
export function armyLine(a: RivalArmy | RunState): string {
  const regs = a.regiments.slice().sort((x, y) => CARDS[playId(y)].cost - CARDS[playId(x)].cost)
    .map(r => `${CARDS[r.card].name}${r.stars > 1 ? ' ' + '★'.repeat(r.stars) : ''}`);
  const walls = structuresOf(a).map(c => CARDS[c].name);
  const gate = GATES[a.fort.gate];
  return `${regs.join(', ')}. Fort ${a.fort.hp}/${a.fort.maxHp}, ${gate.name}${walls.length ? ', ' + walls.join(' and ') : ''}.`;
}

export function runBattleGame(s: RunState, rv: RivalArmy, seed: number): GameState {
  const node = currentNode(s)!;
  const r = RIVALS[node.rival];
  return newGame({
    seed,
    player: { empire: 'neutral', deck: deckOf(s), hq: s.fort.maxHp, hqHp: s.fort.hp, hqThorns: thornsOf(s), faction: 'Your march', capital: 'Your wagon-fort' },
    enemy: { empire: 'neutral', deck: deckOf(rv), hq: rv.fort.maxHp, hqHp: rv.fort.hp, hqThorns: thornsOf(rv), faction: r.name, capital: `${r.name}'s fort` },
    preset: { playerSupport: structuresOf(s), enemySupport: structuresOf(rv) },
    aiLevel: node.kind === 'duel' ? 'normal' : 'hard',
    objective: { type: 'destroy' },
    scenarioId: `bm_${node.id}`,
    scenarioName: node.name,
    rules: 'yuddh',
    season: node.weather as Season,
    dharma: false
  });
}

export function runScenario(s: RunState, finish: (won: boolean, st: GameState) => void): Scenario {
  const node = currentNode(s)!;
  const r = RIVALS[node.rival];
  const rv = rivalArmy(s, node);
  const kind = node.kind === 'final' ? 'The final duel.' : node.kind === 'elite' ? 'An elite commander: wins pay extra gold.' : '';
  return {
    id: `bm_${node.id}`,
    title: node.name,
    place: `${r.name}, ${r.title}`,
    year: STOP_LABEL[s.stop] ?? `Stop ${s.stop + 1}`,
    battlefield: node.battlefield,
    briefing: `${r.intro}\n\nRival army: ${armyLine(rv)}\nYour army: ${armyLine(s)}\nGround: ${WEATHER[node.weather] ?? ''} ${kind}`,
    objective: 'Break the rival Fort. Damage to your Fort carries on to the next battle.',
    heroCard: r.hero,
    defeatCard: r.hero,
    enemyName: r.name,
    durgArt: [PLAYER_FORT_ART, r.hero],
    winText: turn => `${r.name} lowers the colours in round ${turn}. The road ahead is open.`,
    loseText: `${r.name} holds the road. ${s.retries > 0 ? 'Your march can regroup once.' : 'The march ends here.'}`,
    goLabel: 'To battle',
    playerDeck: deckOf(s),
    enemyDeck: deckOf(rv),
    extraArt: ['sword1', 'spear1', 'rider1', 'bow1', ...structuresOf(s), ...structuresOf(rv)],
    fixedSeed: s.battleSeed,
    game: seed => runBattleGame(s, rv, seed),
    run: { finish }
  };
}
