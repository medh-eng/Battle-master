import { YUDDH_CARDS, CLASSIC_CARDS, EMPIRE_DATA, EMPIRE_ORDER_DATA } from '../data';
import runJson from '../data/run.json';
/* ============================================================
   Card and faction lookups. The data itself lives in
   src/data/cards.json (edit numbers there).
   Battle Master: every regiment card also exists at 2 and 3 stars
   as `<id>@2` and `<id>@3`, with the bonus from run.json starBonus.
   A star variant shares its painting with the base card (artKey).
   ============================================================ */
import type { CardDef, Empire, EmpireId, Keyword } from "./types";

export const EMPIRES: Record<EmpireId, Empire> = EMPIRE_DATA;
export const EMPIRE_ORDER: EmpireId[] = EMPIRE_ORDER_DATA;

/** buildDeck's pool (empty in Battle Master: every deck is built by the run) */
export const CARD_LIST: CardDef[] = CLASSIC_CARDS;

const STAR_BONUS = runJson.starBonus as [number, number][];
/** a regiment card at a training level: `sword2` at 3 stars is `sword2@3` */
export const starId = (id: string, stars: number): string => (stars > 1 ? `${id}@${stars}` : id);
/** the base card of a star variant */
export const baseId = (id: string): string => id.split('@')[0];
/** the painting a card uses */
export const artKey = baseId;
/** the training stars written in a card id (1 if none) */
export const starsOf = (id: string): number => Number(id.split('@')[1] || 1);

function variants(c: CardDef): CardDef[] {
  if (c.type !== 'unit' || !c.family || c.family === 'fort') return [];
  return [2, 3].map(s => {
    const [a, h] = STAR_BONUS[s - 1];
    return { ...c, id: starId(c.id, s), atk: (c.atk ?? 0) + a, hp: (c.hp ?? 0) + h, stars: s };
  });
}

/** every card, star variants included */
export const CARDS: Record<string, CardDef> = Object.fromEntries(
  [...CARD_LIST, ...YUDDH_CARDS, ...YUDDH_CARDS.flatMap(variants)].map(c => [c.id, c]));

export const KW_LABEL: Record<Keyword, string> = { veg: "Swift", raksha: "Guard", dhuan: "Smoke", fort: "Fixed" };
