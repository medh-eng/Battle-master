import test from 'node:test';
import assert from 'node:assert/strict';
import {firstFordLesson} from '../src/first-ford.mjs';
import {unit, apply, clash, resolve, newBattle} from '../src/engine.mjs';

const pressRoad = {kind: 'press', lane: 0};
const pressRidge = {kind: 'press', lane: 1};
const holdRidge = {kind: 'hold', lane: 1};

test('lesson forecasts leave the board intact and report the units that actually fought', () => {
  for (const [order, hp, strike] of [[pressRoad, 5, 6], [holdRidge, 7, 4]]) {
    const state = firstFordLesson();
    const before = structuredClone(state);
    const forecast = clash(state, [order, pressRidge]);
    assert.deepEqual(state, before);
    assert.deepEqual(resolve(state, [order, pressRidge]), forecast);
    assert.equal(state.players[0].hp, hp);
    assert.equal(forecast.reports[1][0].target, 'Spearman');
    assert.equal(forecast.reports[1][0].attack, strike);
    assert.equal(forecast.reports[1][0].falls, true);
    assert.equal(forecast.reports[0][1].held, hp === 7 ? 2 : 0);
  }
});

test('gate absorbs after empty-lane Hold and spends at most the remaining breach', () => {
  const state = firstFordLesson();
  state.players[0].plate = 1;
  const report = resolve(state, [holdRidge, pressRidge]);
  assert.equal(report.breach[0][1], 1);
  assert.equal(report.plateAbsorbed[0], 1);
  assert.equal(state.players[0].hp, 8);
  assert.equal(state.players[0].plateReady, false);
});

test('Change the Watch preserves move history and does not grant it to the new lead', () => {
  const state = newBattle(0);
  const [player] = state.players;
  player.hand = ['watch', 'watch'];
  player.lanes[0] = [unit('rider2'), unit('rider2')];
  apply(state, 0, {type: 'move', lane: 0});
  apply(state, 1, {type: 'pass'});
  apply(state, 0, {type: 'watch', lane: 1, h: 0});
  assert.equal(player.lanes[1][0].moved, false);
  assert.equal(player.lanes[1][1].moved, true);
  apply(state, 0, {type: 'watch', lane: 1, h: 0});
  assert.equal(player.lanes[1][0].moved, true);
});
