/* Equal budgets should mean an even fight. Two generated armies of the same budget play AI against AI;
   across commanders, stops and both seats, the first seat should win roughly half the time.
   BM_SIM=400 npx vitest run tests/balance.test.ts prints a fuller table. */
import { describe, expect, it } from 'vitest';
import { aiTurn } from '../src/engine/ai';
import { newGame } from '../src/engine/rules';
import { RIVALS, ROUTE, deckOf, newRun, rivalArmy, structuresOf, thornsOf, type Family, type RivalArmy } from '../src/run/run';

function duel(a: RivalArmy, b: RivalArmy, seed: number): 0 | 1 | null {
  const side = (x: RivalArmy, name: string) => ({ empire: 'neutral' as const, deck: deckOf(x), hq: x.fort.maxHp, hqHp: x.fort.hp, hqThorns: thornsOf(x), faction: name });
  const st = newGame({ seed, player: side(a, 'A'), enemy: side(b, 'B'), preset: { playerSupport: structuresOf(a), enemySupport: structuresOf(b) }, rules: 'yuddh', dharma: false, season: 'sharad' });
  let guard = 0;
  while (!st.over && guard++ < 400) aiTurn(st, st.active, 'normal');
  return st.winner;
}

export function sweep(n: number): { rate: number; byRival: Record<string, number>; draws: number } {
  const ids = Object.keys(RIVALS);
  let wins = 0, games = 0, draws = 0;
  const per: Record<string, [number, number]> = {};
  for (let g = 0; g < n; g++) {
    const stop = Math.floor(g / (ids.length * ids.length)) % ROUTE.length;
    const ra = ids[g % ids.length], rb = ids[Math.floor(g / ids.length) % ids.length];
    if (ra === rb) continue;
    const s = newRun(RIVALS[ra].families.slice(0, 2) as Family[], 1000 + g);
    s.stop = stop; s.budget = stop * 9;
    const node = ROUTE[stop][0];
    const A = rivalArmy(s, { ...node, rival: ra }), B = rivalArmy(s, { ...node, rival: rb });
    const w = duel(A, B, 5000 + g);
    games++;
    if (w === 0) wins++; if (w === null) draws++;
    for (const [id, won] of [[ra, w === 0], [rb, w === 1]] as [string, boolean][]) { per[id] = per[id] ?? [0, 0]; per[id][1]++; if (won) per[id][0]++; }
  }
  return { rate: wins / games, draws, byRival: Object.fromEntries(Object.entries(per).map(([k, [w, t]]) => [k, Math.round(100 * w / t)])) };
}

describe('equal-budget balance', () => {
  it('the first seat wins between 35% and 65% across commanders and stops', () => {
    const n = Number(process.env.BM_SIM || 120);
    const r = sweep(n);
    if (process.env.BM_SIM) console.log(JSON.stringify(r, null, 1));
    expect(r.rate).toBeGreaterThan(0.35);
    expect(r.rate).toBeLessThan(0.65);
  }, 120000);
});
