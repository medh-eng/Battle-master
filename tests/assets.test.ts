/* The sounds and pictures the game asks for must exist in public/assets (npm run assets writes them). */
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync } from 'node:fs';
import sfxList from '../src/assets/sfx.json';

const root = new URL('..', import.meta.url).pathname;
const MUSIC = ['music_title', 'music_camp', 'music_briefing', 'music_battle_calm', 'music_battle_intense', 'music_fifth_bell', 'music_victory', 'music_defeat', 'music_march_won'];
const SFX = ['conch', 'drum', 'clash', 'bow', 'arrowHit', 'deploy', 'cardDraw', 'cardPlay', 'march', 'fortHit', 'death', 'coin', 'yantra', 'fire', 'victory', 'defeat', 'click', 'gallop',
  'turnBell', 'evolve', 'starUp', 'fuse', 'build', 'wallBreak', 'gateStrike', 'greatBell', 'horn', 'volley', 'firePots', 'caltrops', 'crossbow', 'neigh', 'rout', 'mapPick'];

describe('assets', () => {
  it('has every music piece and sound effect converted and registered', () => {
    for (const n of [...MUSIC, ...SFX]) {
      expect(sfxList, n).toContain(n);
      expect(existsSync(`${root}public/assets/sfx/${n}.mp3`), n).toBe(true);
    }
  });
  it('has the interface paintings', () => {
    for (const n of ['crest', 'battle_start', 'victory', 'defeat', 'march_won']) expect(existsSync(`${root}public/assets/ui/ui_${n}.webp`), n).toBe(true);
    expect(readdirSync(`${root}public/icons`)).toContain('icon-512.png');
  });
});
