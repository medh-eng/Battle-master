/* The roguelike march: purchases, evolution, fusion, fort, rewards, the equal rival, save and resume. */
import { describe, expect, it } from 'vitest';
import {
  DATA, ROUTE, beginBattle, build, chooseRoad, deckOf, evolve, expand, finishBattle, fuse, loadRun, newRun, quickRun, recruit,
  repair, retry, rivalArmy, rollRewards, saveRun, takeReward, train, upgradeGate, upgradeStructure, type RunState
} from '../src/run/run';
import { runBattleGame } from '../src/run/battle';
import { CARDS } from '../src/engine/cards';

const rich = (s: RunState, g = 99): RunState => { s.gold = g; return s; };
const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); }, removeItem: (k: string) => { m.delete(k); } }; };

describe('a new march', () => {
  it('starts with two chosen families, two Levy regiments, eight tactics and a 20-health Fort', () => {
    const s = newRun(['sword', 'bow'], 1);
    expect(s.regiments.map(r => r.card)).toEqual(['sword1', 'bow1', 'levy', 'levy']);
    expect(deckOf(s)).toHaveLength(4 * 3 + 8);
    expect(s.fort).toMatchObject({ hp: 20, maxHp: 20, gate: 0 });
    expect(s.node).toBe('first_ford');
    expect(s.phase).toBe('camp');
  });
  it('refuses the same family twice', () => { expect(() => newRun(['sword', 'sword'])).toThrow(); });
});

describe('the camp', () => {
  it('trains stars 1→2→3 for 2 then 4 gold, and stars survive evolution', () => {
    const s = rich(newRun(['sword', 'bow'], 1), 20);
    const sw = s.regiments[0];
    expect(train(s, sw.uid).ok).toBe(true);
    expect(train(s, sw.uid).ok).toBe(true);
    expect(train(s, sw.uid).ok).toBe(false);
    expect(s.gold).toBe(14);
    expect(evolve(s, sw.uid).ok).toBe(true);
    expect(sw).toMatchObject({ card: 'sword2', stars: 3 });
    expect(deckOf(s).filter(id => id === 'sword2@3')).toHaveLength(3);
  });
  it('evolves the sword line Swordsman → Long Swordsman → Royal Guard → Elite Guard for 3, 5, 7', () => {
    const s = rich(newRun(['sword', 'bow'], 1), 15);
    const sw = s.regiments[0];
    ['sword2', 'sword3', 'sword4'].forEach(id => { expect(evolve(s, sw.uid).ok).toBe(true); expect(sw.card).toBe(id); });
    expect(s.gold).toBe(0);
    expect(evolve(s, sw.uid).ok).toBe(false);
  });
  it('recruiting replaces a Levy regiment', () => {
    const s = rich(newRun(['sword', 'bow'], 1));
    expect(recruit(s, 'rider').ok).toBe(true);
    expect(s.regiments.map(r => r.card)).toEqual(['sword1', 'bow1', 'rider1', 'levy']);
    expect(recruit(s, 'rider').ok).toBe(false);
  });
  it('fuses Archer + Rider into a Horse Archer only at form II, keeping the lower stars', () => {
    const s = rich(newRun(['bow', 'rider'], 1));
    const [bow, rider] = s.regiments;
    expect(fuse(s, bow.uid, rider.uid).ok).toBe(false);
    evolve(s, bow.uid); evolve(s, rider.uid); train(s, bow.uid); train(s, bow.uid); train(s, rider.uid);
    const before = s.regiments.length;
    const r = fuse(s, rider.uid, bow.uid);
    expect(r.ok).toBe(true);
    expect(s.regiments).toHaveLength(before);
    expect(s.regiments.at(-1)!.card).toBe('levy');
    const h = s.regiments.find(x => x.card === 'h_horse_archer')!;
    expect(h.stars).toBe(2);
    expect(evolve(s, h.uid).ok).toBe(true);
    expect(h.card).toBe('h_royal_horse_archer');
  });
  it('every fusion recipe produces a real card, both forms', () => {
    Object.values(DATA.fusion.recipes).flat().forEach(id => expect(CARDS[id], id).toBeTruthy());
  });
  it('fort: repair once per camp, widen twice, gates add thorns, walls build and evolve', () => {
    const s = rich(newRun(['sword', 'bow'], 1), 60);
    s.fort.hp = 10;
    expect(repair(s).ok).toBe(true); expect(s.fort.hp).toBe(16);
    expect(repair(s).ok).toBe(false);
    expect(expand(s).ok).toBe(true); expect(expand(s).ok).toBe(true); expect(expand(s).ok).toBe(false);
    expect(s.fort.maxHp).toBe(28);
    expect(upgradeGate(s).ok).toBe(true); expect(s.fort.gate).toBe(1); expect(s.fort.maxHp).toBe(30);
    expect(build(s, 0, 'f_palisade').ok).toBe(true);
    expect(upgradeStructure(s, 0, 'f_stone_wall').ok).toBe(true);
    expect(upgradeStructure(s, 0, 'f_bastion').ok).toBe(true);
    expect(s.fort.slots[0]).toBe('f_bastion');
  });
  it('a purchase without the gold is refused and costs nothing', () => {
    const s = newRun(['sword', 'bow'], 1);
    const r = evolve(s, s.regiments[0].uid);
    expect(r.ok).toBe(false);
    expect(s.regiments[0].card).toBe('sword1');
    expect(s.gold).toBe(0);
  });
});

describe('battles, rewards and the road', () => {
  it('a win pays gold, keeps Fort damage, offers three different rewards and moves on', () => {
    const s = newRun(['sword', 'bow'], 5);
    beginBattle(s);
    finishBattle(s, true, 13);
    expect(s).toMatchObject({ gold: 6, wins: 1, phase: 'reward' });
    expect(s.fort.hp).toBe(13);
    expect(new Set(s.rewards).size).toBe(3);
    takeReward(s, s.rewards[0]);
    expect(s.stop).toBe(1);
    expect(s.phase).toBe('route');
    expect(chooseRoad(s, ROUTE[1][1].id).ok).toBe(true);
    expect(s.phase).toBe('camp');
  });
  it('a loss can be retried once from the entry Fort health, then the march ends', () => {
    const s = newRun(['sword', 'bow'], 5);
    s.fort.hp = 14; beginBattle(s);
    finishBattle(s, false, 0);
    expect(s.phase).toBe('lost');
    expect(retry(s).ok).toBe(true);
    expect(s.fort.hp).toBe(14);
    expect(s.phase).toBe('battle');
    finishBattle(s, false, 0);
    expect(retry(s).ok).toBe(false);
  });
  it('rewards are seeded: the same march and stop offer the same three', () => {
    expect(rollRewards(newRun(['spear', 'rider'], 42))).toEqual(rollRewards(newRun(['spear', 'rider'], 42)));
  });
  it('winning the final duel ends the march in victory', () => {
    const s = newRun(['sword', 'bow'], 5);
    s.stop = ROUTE.length - 1; s.node = ROUTE[s.stop][0].id;
    finishBattle(s, true, 9);
    expect(s.phase).toBe('won');
  });
});

describe('the equal rival', () => {
  it('spends no more than the budget the player has been given', () => {
    const s = newRun(['sword', 'bow'], 3);
    for (let stop = 0; stop < ROUTE.length; stop++) {
      s.stop = stop; s.budget = stop * 9;
      for (const node of ROUTE[stop]) {
        const rv = rivalArmy(s, node);
        expect(rv.gold).toBeGreaterThanOrEqual(0);
        expect(rv.regiments.length).toBeGreaterThanOrEqual(DATA.minRegiments);
        expect(rv.regiments.length).toBeLessThanOrEqual(DATA.maxRegiments);
        deckOf(rv).forEach(id => expect(CARDS[id], id).toBeTruthy());
      }
    }
  });
  it('enters with the same share of Fort health as the player', () => {
    const s = newRun(['sword', 'bow'], 3);
    s.fort.hp = 10; s.budget = 30; s.stop = 4;
    const rv = rivalArmy(s, ROUTE[4][0]);
    expect(rv.fort.hp / rv.fort.maxHp).toBeCloseTo(0.5, 1);
  });
  it('with the budget at zero the first rival has the starting kit, like the player', () => {
    const s = newRun(['sword', 'bow'], 3);
    const rv = rivalArmy(s, ROUTE[0][0]);
    expect(deckOf(rv)).toHaveLength(deckOf(s).length);
  });
  it('builds a legal battle with structures on both Support Lines', () => {
    const s = rich(newRun(['sword', 'bow'], 3)); build(s, 0, 'f_palisade'); upgradeGate(s);
    s.budget = 40; s.stop = 3; s.node = ROUTE[3][0].id;
    const rv = rivalArmy(s, ROUTE[3][0]);
    const st = runBattleGame(s, rv, 11);
    expect(st.players[0].support.map(u => u.cardId)).toContain('f_palisade');
    expect(st.players[0].hq.thorns).toBe(1);
    expect(st.players[1].hq.maxHp).toBe(rv.fort.maxHp);
  });
});

describe('save and resume', () => {
  it('round-trips a march, and falls back to the backup if the save is corrupt', () => {
    const st = mem();
    const s = newRun(['spear', 'rider'], 9);
    saveRun(s, st);
    s.gold = 7; saveRun(s, st);
    expect(loadRun(st)?.gold).toBe(7);
    st.setItem('bm.run.v1', '{broken');
    expect(loadRun(st)?.gold).toBe(0);
  });
  it('quick duel builds two equal-budget armies', () => {
    const s = quickRun(77);
    expect(s.phase).toBe('battle');
    expect(s.budget).toBeGreaterThan(0);
  });
});
