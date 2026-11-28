# Sound and music

Music and sounds are recordings in `art/source/sfx/` (Gemini music, Pixabay effects; see CREDITS.md). Run `npm run assets` to cut, level and convert them for the game. One-shot pieces are cut from longer recordings (`MUSIC_CUT` in `scripts/convert-assets.mjs`); loops keep their full length. `scripts/compose.py` is the old synthesised score and no longer overwrites existing files.

| File | Plays | Brief |
| --- | --- | --- |
| `music_title` | title | 72 BPM; felt bell plays the motif D4 F4 E4 A4 over low strings, a reed answers |
| `music_camp` | muster, road, camp, reward, Codex | 76 BPM; plucked strings, wooden pulse, the motif on plucked strings |
| `music_briefing` | battle briefing | 66 BPM; slow strings, low drum, reed motif |
| `music_battle_calm` | battle | 88 BPM; string ostinato, frame drum, reed motif |
| `music_battle_intense` | battle once a Fort is at half | 100 BPM; heavier drums, bell, higher reed |
| `music_victory` | win | the motif resolves to D on the bell |
| `music_defeat` | loss | the reed fades on the third note |
| `conch` | battle start | two strokes of a great bell (name kept for the engine) |
| `music_fifth_bell` | the final duel at Fifth Bell | 104 BPM; fierce reel, great bell on the first beat of every four bars |
| `music_march_won` | the whole march won | one-shot, cut to about a minute |
| `turnBell` | your turn starts | one clean brass ding |
| `evolve`, `starUp`, `fuse`, `build` | camp: evolve, train, fuse, build/repair (also Palisade built in a duel) | anvil, sparkle, hot iron, hammer |
| `wallBreak`, `gateStrike` | a wall or tower falls; the gate strikes back | timber collapse; iron stab |
| `greatBell`, `horn`, `volley`, `firePots`, `caltrops` | the tactics Ring the Bell, War Horn, Arrow Volley, Fire Pots, Caltrops | one per tactic (Mend the Walls and Field Stitcher use `build`) |
| `crossbow`, `neigh`, `rout` | Pavise and Arbalest shoot; mounted units arrive; a unit breaks | |
| `mapPick` | choosing a road on the map | paper rustle |
