# Battle Master — Music, SFX & Art Prompts

Nov 28, 2026 · @Pon

## How to use this

Make 9 music files in Gemini, download about 20 sounds from Pixabay, and paint 6 pictures in ChatGPT. Every file name below is exact: a file with the right name replaces what the game has now, with no code change for the items marked **drop-in**.

- **Music:** Gemini → tools → **Create music**. Free accounts get 30-second clips; Google AI Plus/Pro/Ultra get Lyria 3 Pro, up to 3 minutes. Make 2–3 takes of each and keep the best. Download as MP3.
- **Sound effects:** Pixabay is a library, not a generator, so each row gives search words and what to listen for. Download the MP3 and rename it.
- **Art:** ChatGPT image generation, as for batch 02. Attach one batch 02 card (e.g. `sword1.png`) to every prompt as the style reference.
- **Don't edit anything.** Upload the raw files; I trim the silence, fade, level the volume and convert.
- **Where to upload:** audio → `art/source/sfx/` · art → `art/source/ui/` (new folder) in medh-eng/Battle-master.
- **Before release:** check Google's terms for commercial use of Gemini music; Pixabay's licence already covers the game. I'll add each source to `art/CREDITS.md`.

## Sound identity: copper bells and river roads

The Bell Marches should sound like a travelling army in an invented river kingdom: wood, gut strings, copper bells and drums, played by people, never synthesisers. Yuddh owns Indian instruments; Battle Master owns bells.

- **The bell motif D – F – E – A** is in every piece. It ends on A, a question. Only a victory lets it land on D. The defeat piece stops on the third note.
- **Three signature sounds:** a copper hand-bell (small moments), the great bell (battle start, Ring the Bell, Fifth Bell), and a hurdy-gurdy drone under everything.
- **Supporting cast:** cello and viola, nyckelharpa or fiddle, shawm and recorder, lute or cittern, hammered dulcimer, frame drum and field drums.
- **Never:** vocals or lyrics, choirs, Hollywood brass, electronic beats, sitar or tabla.
- **Battle music sits under the effects.** It loops for 10–15 minutes, so it stays steady, mid-volume and leaves room for clashes and bells.

## Music prompts for Gemini (9 files)

Paste each prompt as it stands. The first seven replace the current pieces the moment they are uploaded; the last two are new and I wire them in. If Gemini adds singing, regenerate and start the prompt with "Instrumental only."

| File | Plays | Length |
| --- | --- | --- |
| `music_title.mp3` | title screen | 2:00, loops |
| `music_camp.mp3` | muster, road, camp, rewards, Codex | 2:30, loops |
| `music_briefing.mp3` | battle briefing | 1:30, loops |
| `music_battle_calm.mp3` | battle | 2:30, loops |
| `music_battle_intense.mp3` | battle, once a Fort is at half | 2:00, loops |
| `music_victory.mp3` | battle won | 20 s, once |
| `music_defeat.mp3` | battle lost | 15 s, once |
| `music_fifth_bell.mp3` (new) | final battle at Fifth Bell | 2:30, loops |
| `music_march_won.mp3` (new) | whole march won | 45 s, once |

### music\_title

Instrumental only, no vocals. Medieval folk-fantasy title theme for a strategy card game set in an invented river kingdom of bells. D minor, 72 BPM, about 2 minutes. It opens with a single copper bell playing a four-note motif, D, F, E, A, that ends like an unanswered question. A hurdy-gurdy drone and low cello enter underneath, with a soft frame-drum heartbeat. At 0:40 a wooden shawm answers the motif and the strings swell. At 1:20 the full ensemble plays with a deep church bell on the downbeat, then thins back to the lone bell. The mood is dawn over a wagon train: hopeful, ancient, a long road ahead. Warm acoustic sound; no choir, no electronic sounds, no epic brass. End on the same quiet drone it began with so it loops cleanly.

### music\_camp

Instrumental only, no vocals. Warm medieval camp music for resting between battles, D Dorian, 76 BPM, about 2.5 minutes. Plucked lute and cittern play a gentle rolling pattern, a hammered dulcimer carries the four-note motif D, F, E, A, and a soft hand drum keeps a walking pulse. A light anvil tap now and then, as if a smith works nearby, and a faint campfire crackle. The mood is calm planning: counting gold, mending walls, choosing the next road. Unhurried, cosy, never sleepy. No vocals, no synths. Starts and ends on the same plucked chord so it loops.

### music\_briefing

Instrumental only, no vocals. Tense medieval briefing music, D minor, 66 BPM, about 1.5 minutes. A low cello ostinato repeats under slow bowed viola, a single low drum hits every two bars, and a distant bell tolls every four bars. A nyckelharpa plays the four-note motif D, F, E, A slowly, never resolving. The mood is the calm before crossing a ford: studying the enemy army across the river. Sparse, focused, suspenseful, no melody that grabs attention. Acoustic instruments only. Ends where it starts so it loops.

### music\_battle\_calm

Instrumental only, no vocals. Medieval battle background music for a turn-based card strategy game, D minor, 88 BPM, about 2.5 minutes. A driving string ostinato in steady eighth notes, a bodhrán and frame drum groove, and a hurdy-gurdy drone. A fiddle states the four-note motif D, F, E, A every 16 bars, then steps back. Purposeful and steady, built for thinking: it must stay in the background under sword clashes and bells, with no loud lead melody and no big climaxes. Acoustic only, no choir, no brass. Seamless loop: the last bar leads straight back into the first.

### music\_battle\_intense

Instrumental only, no vocals. Intense medieval battle music, same key (D minor) and instruments as a calm battle theme but pushed harder, 100 BPM, about 2 minutes. Heavy field drums and low toms, string tremolo, a hurdy-gurdy grinding underneath, copper bells clanging on the off-beats like an alarm, and a high shawm playing the four-note motif D, F, E, A urgently. The mood is a fort wall cracking and one decisive turn left. Driving and urgent but still under the sound effects; no choir, no electronic drums. Seamless loop.

### music\_victory

Instrumental only, no vocals. A 20-second medieval victory fanfare. Bells peal, the shawm and strings play the four-note motif D, F, E, A, and for the first time it resolves upward onto a bright D major chord held by the full ensemble. A great bell rings once at the end and decays to silence. Joyful, proud, earned. Acoustic instruments only, no brass section, no choir.

### music\_defeat

Instrumental only, no vocals. A 15-second medieval defeat lament in D minor. A lone recorder plays the four-note motif slowly, D, F, E, and stops before the last note, leaving it unfinished. A low cello drone underneath and one muffled, dull bell. Quiet, heavy, not melodramatic. Fades to silence.

### music\_fifth\_bell (new)

Instrumental only, no vocals. Final-battle music at a great festival fair turned battlefield, D minor, 104 BPM in a fierce 6/8 dance rhythm, about 2.5 minutes. A great bell tower tolls on the first beat of every four bars, fiddles and hurdy-gurdy play a fast reel built on the four-note motif D, F, E, A, field drums and tambour drive it, and the strings rise in waves. The mood is the last stand of a long march: celebratory and dangerous at once. Must still sit under sword and arrow sound effects. Acoustic only, no choir, no electronic sounds. Seamless loop.

### music\_march\_won (new)

Instrumental only, no vocals. A 45-second triumphant finale for winning a whole campaign. It starts with one copper hand-bell playing the four-note motif D, F, E, A, then every bell in a great tower joins in a joyful peal. The full folk ensemble (fiddles, hurdy-gurdy, shawm, lute, drums) plays the motif and resolves it to D major, grand and warm. The last ten seconds are bells alone ringing out and fading. Feels like the end of a long journey, home at last. Acoustic only, no choir, no brass.

## Sound effects from Pixabay (21 files)

The game already has 13 good Pixabay sounds from Yuddh (sword clash, bow, arrow hit, march, gallop, drum, coins, card sounds, click, death, fire, deploy); they stay. Replace 5 that don't fit the Bell Marches, then add 16 new ones that give the camp, fort and tactics their own voice. Search on pixabay.com → Sound Effects.

### Drop-in replacements (work the moment they are uploaded)

| Priority | File | Plays when | Search Pixabay for | Pick one that |
| --- | --- | --- | --- | --- |
| 1 | `conch.mp3` | a battle starts | "church bell", "big bell ring" | rings 2 strokes with a long tail, 3–5 s |
| 1 | `fortHit.mp3` | a Fort takes damage | "wood crash", "door bash", "wooden impact heavy" | sounds like timber wagons splintering, under 1.5 s |
| 2 | `yantra.mp3` | a blow is fully absorbed, a tactic is set | "shield block wood", "wooden thud" | is a dull, solid knock, under 0.5 s |
| 3 | `victory.mp3` | win, only if music is off | "bell chime success", "medieval fanfare short" | is bright bells, 2–3 s |
| 3 | `defeat.mp3` | loss, only if music is off | "low bell toll", "sad gong" | is one dark, fading toll, 2–3 s |

### New sounds (I add the hooks)

| Priority | File | Plays when | Search Pixabay for | Pick one that |
| --- | --- | --- | --- | --- |
| 1 | `turnBell.mp3` | your turn begins | "small bell", "hand bell ding" | is one clean brass ding, under 1 s |
| 1 | `evolve.mp3` | a regiment evolves to its next form | "anvil hit", "blacksmith anvil" | rings like metal with a long shimmer, 1–2 s |
| 1 | `starUp.mp3` | a regiment gains a star | "level up chime", "magic sparkle short" | rises upward, not cartoonish, under 1.5 s |
| 1 | `fuse.mp3` | two regiments fuse into a hybrid | "forge fire whoosh", "metal quench hiss" | whooshes or hisses like hot iron in water, 1.5–2.5 s |
| 1 | `build.mp3` | a wall or tower is built, a Repair | "hammering wood", "carpentry hammer" | is 3–4 quick hammer blows, under 2 s |
| 1 | `wallBreak.mp3` | a wall or tower is destroyed | "wood breaking", "wooden structure collapse" | cracks and crumbles, 1.5–2.5 s |
| 1 | `gateStrike.mp3` | the gate strikes back at an attacker | "metal spike", "iron gate clang" | is a sharp metal stab, under 0.7 s |
| 2 | `greatBell.mp3` | the Ring the Bell tactic | "big bell toll", "cathedral bell" | is one deep toll, 3–4 s (different from `conch`) |
| 2 | `horn.mp3` | the War Horn tactic | "war horn", "medieval horn" | is one long horn call, 2–3 s, no voices |
| 2 | `volley.mp3` | the Arrow Volley tactic | "arrows whoosh many", "arrow volley" | is a rush of many arrows, 1.5–2.5 s |
| 2 | `firePots.mp3` | the Fire Pots tactic | "pottery break", "fire ignite whoosh" | smashes clay then flares up, 1–2 s |
| 2 | `caltrops.mp3` | the Caltrops tactic | "metal scatter", "nails dropping" | is a spill of small iron pieces, under 1.5 s |
| 2 | `crossbow.mp3` | Pavise Crossbow and Arbalest shoot | "crossbow shot" | has a mechanical click and thunk, under 1 s |
| 3 | `neigh.mp3` | Knight, Lancer or Paladin charges | "horse neigh", "horse whinny" | is one short whinny, under 1.5 s |
| 3 | `rout.mp3` | a unit breaks and flees | "armor clatter", "chainmail running" | is rattling metal moving away, under 1.5 s |
| 3 | `mapPick.mp3` | you choose a road on the march map | "paper map unfold", "parchment" | is a soft paper rustle, under 1 s |

If time is short, the priority 1 rows alone change how the game feels.

## Art: yes, 6 pieces

The title already has its painting and the BATTLE MASTER wordmark, but the moments that matter most (start, win, loss, the end of the march) show only text or a reused card. Six paintings fix that. The game writes every word in its own fonts, so **no picture contains any text** (AI lettering comes out misspelt).

| File | Where it shows | Shape |
| --- | --- | --- |
| `ui_crest.png` | title screen, above the wordmark; also loading screen | square 1024×1024, transparent background |
| `ui_battle_start.png` | sweeps across the board as a battle begins, with "TO BATTLE" written over it | wide 3:1, 2400×800, transparent background |
| `ui_victory.png` | battle won screen | 16:9, 2560×1440, empty sky in the top third |
| `ui_defeat.png` | battle lost screen | 16:9, 2560×1440, empty sky in the top third |
| `ui_march_won.png` | the whole march won at Fifth Bell | 16:9, 2560×1440, empty sky in the top third |
| `icon.png` | Android app icon and browser tab | square 1024×1024, solid indigo background |

Style line to paste after every prompt (attach a batch 02 card as the reference):

> Woodcut print style on aged dyed paper, bold black outlines, hand-carved hatching, limited palette of indigo, rust red, warm ivory, amber and slate, consistent with the attached card. No text, no letters, no frame, no border.

### ui\_crest

A heraldic crest emblem: a copper bell in the centre, a sword and a spear crossed behind it, a ribbon of indigo cloth wrapped around the crossing, small sprigs of river reeds at the base. Symmetrical, bold silhouette that reads clearly when small. Transparent background, nothing behind the emblem.

### ui\_battle\_start

A wide horizontal banner image: two war banners on long poles crossing in the centre, one indigo, one rust red, both torn at the edges, with a copper bell hanging where they cross, mid-swing, carved lines of sound rippling outward. Dust and smoke drift along the bottom edge. Keep the centre of the image calm and lighter so white words can sit over it. Transparent background beyond the banners and smoke.

### ui\_victory

A ring of painted wagons forming a fort on a river meadow at sunrise; on the tallest wagon a soldier raises the indigo bell banner; below, the swordsman with the striped shield, the bow-woman with braided hair and the blue-capped spearman lift their weapons; a copper bell rings on a pole, sound lines carved around it. Amber morning light, long shadows, the river glinting. The top third of the picture is open, calm sky.

### ui\_defeat

The same wagon-fort at dusk, broken: a wagon wheel cracked and lying on its side, the indigo bell banner fallen into the shallow river, its copper bell half sunk in mud, smoke rising, crows on a broken stake. No people, no bodies. Slate and indigo tones with one last streak of amber on the horizon. The top third is open, darkening sky.

### ui\_march\_won

The fair at Fifth Bell: a great stone bell tower with a huge copper bell ringing, festival tents and pennants in indigo, rust and ivory below, crowds cheering, petals in the air; the player's wagon train arriving along the road in the foreground, banners high. Golden late-afternoon light. Grand and joyful. The top third is open, bright sky around the tower's top.

### icon

A bold app icon: a single copper bell with a sword and a spear crossed behind it, centred, filling about 70% of the square, on a solid deep indigo background. Thick black outlines, very simple shapes, readable at 48 pixels.

## Checklist

Tick each item as you upload it; tell me when a batch is in and I'll do the rest in one go.

- [ ] Music: the 7 core pieces (drop-in)
- [ ] Music: `music_fifth_bell` and `music_march_won`
- [ ] Sound effects: the 5 drop-in replacements
- [ ] Sound effects: the 7 priority 1 new sounds
- [ ] Sound effects: the 9 priority 2–3 new sounds
- [ ] Art: the 6 paintings

After upload I will: trim and level every sound, convert everything, hook up the 16 new sounds and the two new pieces of music, put the crest, battle banner and end screens into the game with their animations, set the app icon, and update `art/SOUND-LIST.md` and `art/CREDITS.md`.
