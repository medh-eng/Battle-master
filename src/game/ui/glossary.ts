/* ============================================================
   What a card's words mean, for the reading panel beside a card
   held up for inspection (the way KARDS explains its keywords).
   Each entry is a bold heading, a short plain-language line, and
   an icon. Wording follows the Yuddh rules (src/engine/rules.ts).
   ============================================================ */
import { CARDS, EMPIRES, RANK_NAMES, isSteadfast, routLine, type GameState, type Season, type Unit } from '../../engine';

export type GlossIcon = 'charge' | 'foot' | 'ranged' | 'melee' | 'raksha' | 'veg' | 'rank' | 'deploy' | 'yantra'
  | 'shakti' | 'mantra' | 'kosha' | 'op' | 'empire' | 'wound';
export interface Gloss { icon: GlossIcon; title: string; body: string }

const CHARGES = new Set(['Cavalry', 'Heavy Cavalry', 'Horse Archers']);
const ROMAN = ['', 'I', 'II', 'III', 'IV'];

/** everything worth explaining about a card, most important first; `unit` adds its state on the board */
export function glossFor(cardId: string, unit?: Unit, cost?: number, season?: Season, turn?: number, state?: GameState): Gloss[] {
  const c = CARDS[cardId];
  if (!c) return [];
  const out: Gloss[] = [];
  if (c.type === 'unit') {
    if (unit && unit.hp < unit.maxHp) out.push({ icon: 'wound', title: `WOUNDED ${unit.hp} / ${unit.maxHp}`, body: 'Lost health does not come back.' });
    if (unit?.routed) out.push({ icon: 'wound', title: 'ROUTED', body: 'Broken and fleeing: it takes no action this turn, strikes no counter-blow, and rallies afterwards. ' });
    else if (unit && state && state.rules === 'yuddh') out.push(isSteadfast(state, unit)
      ? { icon: 'raksha', title: 'STEADFAST', body: 'It will not break: a Guard unit, a wall, a Champion, or any unit while its Banner Pike stands.' }
      : { icon: 'wound', title: `MORALE: BREAKS AT ${routLine(unit)}`, body: `A blow that leaves it with ${routLine(unit)} health or less breaks it: it flees to the Support Line and loses its next turn.` });
    if (unit?.rank) out.push({ icon: 'rank', title: RANK_NAMES[unit.rank].toUpperCase(), body: unit.rank >= 2 ? 'Honoured twice for valour: +1 attack and +2 health.' : 'Honoured for valour: +1 health. One more kill makes it Champion (+1 attack).' });
    out.push(CHARGES.has(c.sub)
      ? { icon: 'charge', title: c.sub.toUpperCase(), body: season === 'varsha' ? 'Charges in dry weather; in rain and mud it must advance or attack, not both.' : 'Charges: can advance to the Front Line and attack in the same turn.' }
      : { icon: 'foot', title: c.sub.toUpperCase(), body: 'Each turn it advances or attacks, not both.' });
    out.push(c.range === 'ranged'
      ? { icon: 'ranged', title: 'RANGED', body: season === 'grishma' ? 'Shoots from either line and takes no counter-blow. Heat haze: deals 1 less damage.' : 'Shoots from either line and takes no counter-blow.' }
      : { icon: 'melee', title: 'MELEE', body: 'Trades blows with other melee units: both deal damage.' });
    if (/Elephant/.test(c.sub)) out.push({ icon: 'charge', title: 'TRAMPLE', body: 'When it crushes a unit, the damage it did not need falls on the enemy Fort.' });
    if (unit?.surge !== undefined && unit.surge === turn) out.push({ icon: 'charge', title: 'GARUDA VYUHA', body: 'The eagle formation: this turn it may advance and attack.' });
    if (c.id === 'm_raja_dhwaja') out.push({ icon: 'rank', title: 'MORALE', body: 'While he stands, your other units on the Front Line deal +1 damage, and none of your units will break.' });
    if (c.vsElephant) out.push({ icon: 'ranged', title: 'ELEPHANT-SHOOTERS', body: `Trained against the great beasts: deals ${c.vsElephant} extra damage to a War Elephant.` });
    if (c.kw?.includes('fort')) out.push({ icon: 'raksha', title: 'FIXED STRUCTURE', body: c.range === 'ranged' ? 'Stands behind your Support Line for the whole duel: it never advances, but it shoots at the Front Line. It takes none of the four places on the line.' : 'Stands behind your Support Line for the whole duel: it never moves or attacks, takes none of the four places, and never breaks.' });
    if (c.stars) out.push({ icon: 'rank', title: `TRAINED ${'★'.repeat(c.stars)}${'☆'.repeat(3 - c.stars)}`, body: c.stars > 1 ? `Camp training: +${c.stars - 1} attack and +${c.stars - 1} health. Stars stay through evolution.` : 'Untrained. Each star bought at camp adds +1 attack and +1 health.' });
    if (c.form && c.family && c.family !== 'levy' && c.family !== 'fort') out.push({ icon: 'deploy', title: c.family.startsWith('hybrid:') ? `HYBRID TIER ${ROMAN[c.form]}` : `FORM ${ROMAN[c.form]} OF IV`, body: c.family.startsWith('hybrid:') ? `Fused at camp from ${c.family.slice(7).split('+').join(' and ')} regiments.` : 'Evolve it at camp into the next form of its line.' });
    if (c.reprisal) out.push({ icon: 'raksha', title: 'PIKES', body: `A melee unit that advanced this turn and strikes it takes ${c.reprisal} damage.` });
    if (c.id === 'm_shalya_vaidya') out.push({ icon: 'wound', title: 'SURGEON', body: 'At the start of your turn he heals 2 health on your most wounded unit.' });
    if (c.kw?.includes('raksha')) out.push({ icon: 'raksha', title: 'GUARD', body: 'Guard: must be struck first in its line, and on the Support Line it shields the Fort.' });
    if (c.kw?.includes('veg')) out.push({ icon: 'veg', title: 'SWIFT', body: 'Swift: can move or attack on the turn it is deployed.' });
    if (/^Deploy/i.test(c.text) || /Deploy —/.test(c.text)) out.push({ icon: 'deploy', title: 'DEPLOY', body: 'The effect happens once, when the card is played.' });
    if (!unit?.rank) out.push({ icon: 'rank', title: 'PROMOTION', body: 'Destroy an enemy and survive: Veteran (+1 health), then Champion (+1 attack, +1 health more).' });
    out.push({ icon: 'op', title: `ORDERS COST ${c.op ?? 1}`, body: `Advancing or attacking spends ${c.op ?? 1} Supply (the bronze coin).` });
  } else if (c.type === 'yantra') {
    out.push({ icon: 'yantra', title: 'TRAP', body: 'A hidden trap. It is set face-down and springs by itself when its moment comes.' });
  } else if (c.kind === 'shakti') {
    out.push({ icon: 'shakti', title: 'POWER TACTIC', body: 'A costly tactic that can turn a whole battle.' });
  } else {
    out.push({ icon: 'mantra', title: 'TACTIC', body: 'It takes effect at once and is then spent.' });
  }
  const printed = c.cost;
  if (cost !== undefined && cost < printed) out.push({ icon: 'kosha', title: `SUPPLY ${cost}, NOT ${printed}`, body: 'Cheaper this turn.' });
  if (c.empire !== 'neutral') out.push({ icon: 'empire', title: EMPIRES[c.empire].name.toUpperCase(), body: EMPIRES[c.empire].passive });
  return out;
}
