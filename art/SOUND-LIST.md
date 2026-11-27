# Sound and music

Music is rendered by `python3 scripts/compose.py` (then `npm run assets`). To replace a piece with a better recording, drop an MP3 with the same name into `art/source/sfx/` (it overrides the generated one) and record its source in CREDITS.md.

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
