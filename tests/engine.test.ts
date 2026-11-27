/* Engine additions for Battle Master: star variants, fort structures, gate thorns, unit healing, no Dharma. */
import { describe, expect, it } from 'vitest';
import { CARDS, starId, baseId } from '../src/engine/cards';
import { applyAction, canAttack, canMove, findUnit, newGame } from '../src/engine/rules';
import type { GameState } from '../src/engine/types';

const game = (over: Partial<Parameters<typeof newGame>[0]> = {}): GameState => newGame({
  seed: 7,
  player: { empire: 'neutral', deck: Array(20).fill('sword1'), hq: 20, faction: 'You' },
  enemy: { empire: 'neutral', deck: Array(20).fill('sword1'), hq: 20, faction: 'Rival' },
  rules: 'yuddh', dharma: false, ...over
});

describe('star variants', () => {
  it('exist for every regiment card at 2 and 3 stars with +1/+1 per star', () => {
    expect(CARDS[starId('sword2', 3)].atk).toBe(CARDS.sword2.atk! + 2);
    expect(CARDS['bow1@2'].hp).toBe(CARDS.bow1.hp! + 1);
    expect(CARDS['h_paladin@3'].stars).toBe(3);
    expect(baseId('h_paladin@3')).toBe('h_paladin');
  });
  it('never exist for fort structures or tactics', () => {
    expect(CARDS['f_palisade@2']).toBeUndefined();
    expect(CARDS['t_courier@2']).toBeUndefined();
  });
});

describe('fort structures', () => {
  it('start on the Support Line, never advance, and a wall never attacks', () => {
    const st = game({ preset: { playerSupport: ['f_palisade', 'f_watchtower'] } });
    const [wall, tower] = st.players[0].support;
    expect(wall.cardId).toBe('f_palisade');
    expect(canMove(st, 0, wall.uid).ok).toBe(false);
    expect(canMove(st, 0, tower.uid).ok).toBe(false);
    expect(canAttack(st, 0, wall.uid, { kind: 'hq', owner: 1 }).ok).toBe(false);
  });
  it('a Guard wall must fall before the Fort can be struck', () => {
    const st = game({ preset: { enemySupport: ['f_palisade'], playerFront: ['rider3'] } });
    const rider = st.front.units[0];
    expect(canAttack(st, 0, rider.uid, { kind: 'hq', owner: 1 }).ok).toBe(false);
  });
  it('a tower shoots at the Front Line from the Support Line', () => {
    const st = game({ preset: { enemyFront: ['sword1'], playerSupport: ['f_watchtower'] } });
    const tower = st.players[0].support[0], foe = st.front.units[0];
    expect(canAttack(st, 0, tower.uid, { kind: 'unit', owner: 1, uid: foe.uid }).ok).toBe(true);
  });
});

describe('gate and Fort', () => {
  it('carries damage in (hqHp) and the gate strikes back (hqThorns)', () => {
    const st = game({ enemy: { empire: 'neutral', deck: Array(20).fill('sword1'), hq: 24, hqHp: 15, hqThorns: 2, faction: 'Rival' }, preset: { playerFront: ['rider3'] } });
    expect(st.players[1].hq).toMatchObject({ hp: 15, maxHp: 24 });
    const rider = st.front.units[0];
    expect(applyAction(st, { type: 'attack', uid: rider.uid, target: { kind: 'hq', owner: 1 } }).ok).toBe(true);
    expect(st.players[1].hq.hp).toBe(15 - 3);
    // 4 health less 2 leaves it at its break line: it flees, wounded
    expect(findUnit(st, 0, rider.uid)?.unit.hp).toBe(4 - 2);
  });
});

describe('tactics', () => {
  it('Field Stitcher heals every friendly unit by 2', () => {
    const st = game({ player: { empire: 'neutral', deck: ['t_stitch', ...Array(20).fill('sword1')], hq: 20, faction: 'You', openingHand: ['t_stitch'] }, preset: { playerSupport: ['sword3', 'bow2'] } });
    st.players[0].support.forEach(u => { u.hp -= 2; });
    st.players[0].kosha = 5;
    expect(applyAction(st, { type: 'play', handIndex: 0 }).ok).toBe(true);
    st.players[0].support.forEach(u => expect(u.hp).toBe(u.maxHp));
  });
  it('no Dharma meter moves in Battle Master', () => {
    const st = game({ preset: { playerFront: ['rider4'], enemySupport: ['levy'] } });
    expect(st.noDharma).toBe(true);
    expect(st.players[0].dharma ?? 0).toBe(0);
  });
});
