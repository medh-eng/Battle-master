/* The History panel: a painting on the left, and on the right what history
   says, what the game changes (each row tagged HISTORY / TRADITION / INVENTED),
   and a source line at the bottom. Also used for the epilogue after a victory
   and for the one-time "history and imagination" notice. */
import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { FONT_STORY, FONT_TITLE, INK } from '../theme';
import { makePan, panBar } from './pan';
import { view } from '../view';
import { cardFace } from '../cards/paint';
import { makeButton } from './button';
import { HISTORY_NOTICE, historyOf, type HistoryBasis } from '../../data';

const TAG: Record<HistoryBasis, number> = { HISTORY: 0xe6bd62, TRADITION: 0x8fc4ff, INVENTED: 0xff9a86 };

interface Block { head: string; text?: string; rows?: { basis: HistoryBasis; text: string }[] }
interface Spec { kicker: string; title: string; card?: string; blocks: Block[]; source: string; button: string; onClose: () => void }

function build(spec: Spec): Container {
  const W = view.w, H = view.h, ph = view.phone, k = view.ui;
  const c = new Container();
  const dim = new Graphics().rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.94 });
  dim.eventMode = 'static';
  c.addChild(dim);
  let tx = ph ? 60 : 120;
  if (spec.card) {
    const sc = ph ? (H * 0.62) / 672 : 0.62;
    const art = new Sprite(cardFace(spec.card)); art.anchor.set(0.5); art.rotation = -0.04; art.scale.set(sc);
    art.position.set((ph ? 40 : 90) + 240 * sc, ph ? H * 0.44 : H * 0.44);
    c.addChild(art);
    tx = (ph ? 40 : 90) + 480 * sc + (ph ? 40 : 60);
  }
  const wrap = W - tx - (ph ? 40 : 100);
  const kick = new Text({ text: spec.kicker, style: { fontFamily: FONT_TITLE, fontSize: Math.round(20 * k), fontWeight: '700', letterSpacing: 6, fill: INK.gold } });
  const title = new Text({ text: spec.title, style: { fontFamily: FONT_TITLE, fontSize: ph ? 54 : 64, fontWeight: '700', fill: INK.goldPale } });
  if (title.width > wrap) title.scale.set(wrap / title.width);
  const btn = makeButton(spec.button, spec.onClose, { primary: true, w: 300 });
  const btnY = H - (ph ? 54 : 78);
  btn.position.set(W - (ph ? 190 : 270), btnY);
  const src = new Text({ text: spec.source, style: { fontFamily: FONT_STORY, fontWeight: '500', fontSize: Math.round(21 * k), fontStyle: 'italic', fill: INK.creamBright, wordWrap: true, wordWrapWidth: wrap - (ph ? 330 : 360), lineHeight: Math.round(27 * k) } });
  // the source line gets at most three short lines beside the button: shrink the type until it does
  for (let f = Math.round(21 * k); f >= 17 && src.height > 3 * f * 1.25; f--) { src.style.fontSize = f; src.style.lineHeight = Math.round(f * 1.25); }
  src.anchor.set(0, 0.5); src.position.set(tx, btnY);
  kick.position.set(tx, ph ? 22 : 70); title.position.set(tx, kick.y + kick.height + 4);
  c.addChild(kick, title, src, btn);

  // body: the type never goes below MIN; if the text still does not fit it scrolls instead of shrinking
  const MIN = 21;
  const body = new Container();
  const top = title.y + title.height * title.scale.y + (ph ? 12 : 26);
  const limit = btnY - Math.max(ph ? 50 : 62, src.height / 2 + 16);
  const avail = limit - top;
  let contentH = 0;
  for (let f = ph ? 24 : 30; f >= MIN; f -= 1) {
    body.removeChildren().forEach(o => o.destroy({ children: true }));
    let y = 0;
    for (const b of spec.blocks) {
      const h = new Text({ text: b.head, style: { fontFamily: FONT_TITLE, fontSize: Math.round(f * 0.7 * k), fontWeight: '700', letterSpacing: 4, fill: INK.gold } });
      h.position.set(0, y); body.addChild(h); y += h.height + 4;
      if (b.text) {
        const t = new Text({ text: b.text, style: { fontFamily: FONT_STORY, fontWeight: '500', fontSize: Math.round(f * k), fill: INK.creamBright, wordWrap: true, wordWrapWidth: wrap, lineHeight: Math.round(f * k * 1.4) } });
        t.position.set(0, y); body.addChild(t); y += t.height + (ph ? 8 : 14);
      }
      for (const r of b.rows ?? []) {
        const tg = new Text({ text: r.basis, style: { fontFamily: FONT_TITLE, fontSize: Math.round(f * 0.62 * k), fontWeight: '700', letterSpacing: 2, fill: 0x22150d } });
        const tw = tg.width + 18, th = tg.height + 6;
        const pill = new Graphics().roundRect(0, 0, tw, th, 5).fill(TAG[r.basis]);
        pill.position.set(0, y + 2); tg.position.set(9, y + 5);
        const t = new Text({ text: r.text, style: { fontFamily: FONT_STORY, fontWeight: '500', fontSize: Math.round(f * 0.92 * k), fill: INK.creamBright, wordWrap: true, wordWrapWidth: wrap - 150 * k, lineHeight: Math.round(f * 0.92 * k * 1.4) } });
        t.position.set(Math.max(tw, 112 * k) + 14, y);
        body.addChild(pill, tg, t); y += Math.max(t.height, th) + (ph ? 6 : 10);
      }
      y += ph ? 4 : 10;
    }
    contentH = y;
    if (y <= avail) break;
  }
  const pan = makePan({ x: tx, y: top, w: wrap + 12, h: avail }, { axis: 'y', keys: true });
  pan.content.addChild(body);
  pan.setWidth(contentH);
  c.addChild(pan.view);
  c.addChild(panBar(pan, tx + wrap + 16));
  return c;
}

/** the History note of a battle; null when it has none */
export function historyPanel(scenarioId: string, title: string, card: string, onClose: () => void, button = 'Back'): Container | null {
  const h = historyOf(scenarioId); if (!h) return null;
  return build({ kicker: 'HISTORY · ' + h.kicker, title, card, button, onClose, source: h.source,
    blocks: [{ head: 'WHAT HISTORY SAYS', text: h.happened }, { head: 'WHAT THE GAME CHANGES', rows: h.changed }] });
}

/** after a victory: a short epilogue with the same source line */
export function epiloguePanel(scenarioId: string, title: string, card: string, onClose: () => void, button = 'Continue'): Container | null {
  const h = historyOf(scenarioId); if (!h) return null;
  return build({ kicker: 'AFTER THE BATTLE', title, card, button, onClose, source: h.source, blocks: [{ head: 'WHAT CAME NEXT', text: h.epilogue }] });
}

/** the "history and imagination" notice shown on first launch and from the title screen */
export function noticePanel(onClose: () => void, button = 'Understood'): Container {
  return build({ kicker: 'ABOUT THE GAME', title: HISTORY_NOTICE.title, button, onClose, source: HISTORY_NOTICE.source, blocks: [{ head: 'A NOTE BEFORE YOU BEGIN', text: HISTORY_NOTICE.text }] });
}

/** a rank reward: the war-council chronicle of an empire */
export function chroniclePanel(title: string, text: string, source: string, card: string, onClose: () => void): Container {
  return build({ kicker: 'WAR COUNCIL · CHRONICLE', title, card, button: 'Close', onClose, source, blocks: [{ head: 'FROM THE RECORD', text }] });
}

/** a plain guide page (How to play, Know your card): same layout, text blocks only, scrolls when long */
export function guidePanel(kicker: string, title: string, blocks: { head: string; text: string }[], card: string | undefined, onClose: () => void, button = 'Back', source = 'Rules are the same in every battle.'): Container {
  return build({ kicker, title, card, button, onClose, source, blocks });
}

const KNOW_KEY = 'yuddh.knowcard.v1';
export const knowCardSeen = (): boolean => { try { return localStorage.getItem(KNOW_KEY) === '1'; } catch { return true; } };
export const markKnowCard = (): void => { try { localStorage.setItem(KNOW_KEY, '1'); } catch { /* private mode */ } };

/** the first-run "Know your card" screen: a real card and what each mark on it means */
export function knowCardPanel(onClose: () => void, button = 'Understood'): Container {
  return guidePanel('BEFORE YOUR FIRST BATTLE', 'Know your card', [
    { head: 'THE TWO COINS', text: 'Gold coin, top left: the Supply you pay to play the card. Bronze coin, top right: the Supply it costs each time the unit advances or attacks.' },
    { head: 'THE TWO BADGES', text: 'Red badge, bottom left: Attack, the damage it deals. Blue badge, bottom right: Health. A unit with no health left is destroyed.' },
    { head: 'FORM AND STARS', text: 'The numeral before the class (I, II, III, IV) is the regiment\'s form: evolve it at camp into a stronger unit with a new ability. The three stars at the bottom show its training: each star adds +1 attack and +1 health, and stars carry through evolution.' },
    { head: 'THE MARKS BESIDE THE COIN', text: 'Silver shield = Guard: it must be struck first, and on your Support Line it shields your Fort. Gold lightning bolt = Swift: it can act the turn it is played. Green bow = Ranged: it shoots without taking a counter-blow.' },
    { head: 'READING MORE', text: 'Press and hold any card, in your hand or on the board, to read what every word on it means.' }
  ], 'sword3@2', onClose, button, 'You can read this again any time from How to play on the title screen.');
}

/** How to play: one scrolling page that gathers the rules */
export function howToPlayPanel(onClose: () => void, button = 'Back'): Container {
  return guidePanel('HOW TO PLAY', 'Command the march', [
    { head: 'THE MARCH', text: 'Lead a wagon-fort through seven duels on the road to Fifth Bell. Every rival is equal: they have earned exactly the same gold you have, and spent it under the same rules. Their choices differ; yours decide the war.' },
    { head: 'THE AIM OF A DUEL', text: 'Break the rival Fort: bring its health to zero before yours falls. Your units can strike the Fort once they stand on the Front Line, the ground between the armies. Damage to your Fort stays with you into the next duel.' },
    { head: 'YOUR TURN', text: 'You gain one more Supply each turn. Drag cards from your hand to play them. Advance a unit to the Front Line, or attack with it: each costs its bronze coin. Only one side can hold the Front Line. Tap End Turn when you are done.' },
    { head: 'FIGHTING', text: 'Drag a unit onto an enemy to attack. Melee units trade blows; ranged units shoot without a counter-blow. Guard units must be struck first. Cavalry may advance and strike in one turn; foot soldiers do one or the other. Pikes punish a melee unit that charged into them.' },
    { head: 'CAMP', text: 'After each victory you win gold and pick one of three rewards. At camp, spend gold to recruit a new family, train stars (+1/+1 each), evolve a regiment to its next form (Swordsman, Long Swordsman, Royal Guard, Elite Guard), or fuse two regiments into a hybrid (Archer + Rider = Horse Archer).' },
    { head: 'YOUR FORT', text: 'Repair it, widen the wagon ring for more health, hang a stronger gate that strikes back at attackers, and raise walls or towers. Walls (Guard) stand on your Support Line in every duel and must fall before your Fort can be hit; towers shoot at the Front Line.' },
    { head: 'TACTICS AND TRAPS', text: 'Tactics take effect at once. A Trap is set face-down and springs by itself when its moment comes.' },
    { head: 'MORALE', text: 'A unit hurt down to a third of its health breaks, flees and loses its next turn. Guard units, walls and Champions never break, and neither does anyone while your Banner Pike stands.' },
    { head: 'WEATHER', text: 'Rain: nothing advances and attacks in one turn. Heat: ranged units deal 1 less. Harvest fair: +1 Supply each turn for both sides.' },
    { head: 'WHEN THE DECK RUNS OUT', text: 'Each draw from an empty deck costs your Fort health, more every time (1, 2, 3...). Win before the cards run out.' },
    { head: 'LOSING', text: 'Once per march you may regroup and fight a lost duel again from the same starting point. A second defeat ends the march; start a new one and try a different army.' }
  ], undefined, onClose, button);
}
