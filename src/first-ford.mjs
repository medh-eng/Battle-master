// A single guided order decision from page 4 of The Bell Marches.
import {newBattle, unit} from './engine.mjs';

export function firstFordLesson() {
  const state = newBattle(0);
  const [player, rival] = state.players;
  player.hp = 8;
  player.lanes = [[unit('sword2'), unit('bow1')], [null, null]];
  rival.lanes = [[unit('spear1'), null], [unit('rider1'), null]];
  state.phase = 'order';
  return state;
}
