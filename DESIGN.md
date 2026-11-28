# Battle Master: The Bell Marches — design

Owner: Pon. Built by Claude on the YUDDH engine, 27 Nov 2026. This document is the source of truth for rules and decisions; update it whenever they change.

## The pitch

A KARDS-style card duel (one contested Front Line, a Support Line on each side, a Fort to break) wrapped in a roguelike march. You start with two regiments and two Levies, win seven duels on a forking road, and between duels you shape the army: train stars, evolve forms, fuse families into hybrids, and fortify your wagon-fort. Every rival has exactly the gold you have had, so a win means you spent it better.

Design pillars:
1. **Feels like Yuddh in battle** (same engine, same drag-and-strike board, same feedback), so the battle is already proven fun.
2. **Every camp is a real choice**: an army upgrade, a fort upgrade or saving up, with the next rival's army visible before you spend.
3. **Equal rivals**: no stat cheating; difficulty comes from composition, fort, ground and the AI level.
4. **Replay**: forks, seeded rewards, ten commanders, six hybrids, two fort branches and a Codex to fill.

## The battle (Yuddh rules, ruleset `'yuddh'`, Dharma off)

- Board: your Support Line (4 places), the shared Front Line (4 places, held by one side at a time), the enemy Support Line. Each side has a Fort.
- Supply: starts at 1, grows by 1 each turn (to 12). Playing a card costs its gold coin; advancing or attacking costs the bronze coin (usually 1).
- Units advance or attack in a turn; Cavalry (`chargeClasses` in rules.json: Cavalry, Heavy Cavalry, Horse Archers) may advance and strike. Swift units act on the turn they arrive. Ranged units take no counter-blow and can shoot the Front Line from the Support Line. Guard must be struck first, and a Guard on your Support Line shields your Fort. Pikes punish a melee unit that charged into them.
- Morale: a blow that leaves a unit at a third of its health breaks it (flees, loses a turn). Guard, walls, Champions, and everyone while a Banner Pike stands, never break.
- Battle promotion (Yuddh): destroy an enemy and survive → Veteran (+1 health) → Champion (+1 attack). This is separate from camp stars.
- Weather per stop: Clear, Rain (no advance-and-attack), Heat (ranged −1), Harvest (+1 Supply).
- Deck-out: each draw from an empty deck costs the Fort 1, 2, 3… health.
- **Battle Master additions** (engine): keyword `fort` (fixed structures: never advance; melee structures never attack; they stand behind the Support Line and take none of its four places; never break), Fort `thorns` (the gate strikes back at each unit that hits it), `hqHp` (a Fort can enter damaged), order field `healUnits`, `dharma: false`.

## The march (src/run/run.ts, numbers in src/data/run.json)

**Start:** pick 2 of 4 families (Sword, Spear, Cavalry, Bow). Army = those two regiments + 2 Levy regiments; each regiment is 3 cards in the deck; plus 8 tactics (2× Quick Courier, Field Stitcher, Wicker Screens, Change the Watch). Fort 20/20, Timber Gate, two empty plots. 0 gold.

**Route:** 7 stops. 1 First Ford (Nera) → fork (Stone Orchard/Sella or Rivet Yard/Brann) → fork (River Toll/Tamsin or Copper Crossing/Odo) → The Anvil Court (elite, Anvil Warden) → fork (High Road/Kestrel or Amber Pass/Amber Regent) → Crown Approach (elite, Silas Crane) → Fifth Bell (final, Keeper Orra). The rival's whole army is shown before you choose a road and again at camp.

**After a win:** +6 gold (+3 at elite stops), then choose 1 of 3 seeded rewards (War Chest +4, Drill Sergeant free star, Carpenters +8 Fort, Volunteers free recruit, or a tactic card: Arrow Volley, War Horn, Fire Pots, Caltrops, Mend the Walls, Ring the Bell). Fort damage carries over.

**Camp purchases:**
| Purchase | Cost | Effect |
| --- | --- | --- |
| Recruit | 3 | a family you lack at form I, 1★; replaces a Levy (max 6 regiments) |
| Train | 2 → ★★, 4 → ★★★ | +1 attack, +1 health per star, for all 3 cards; stars survive evolution |
| Evolve | 3 / 5 / 7 | next form: Swordsman → Long Swordsman → Royal Guard → Elite Guard; Spearman → Long Spearman → Pike Warden → Banner Pike; Light Rider → Ford Lancer → Pennant Rider → Storm Lancer; Archer → Yew Bowman → Ridge Marksman → Beacon Longbow |
| Fuse | 4 | two regiments of different families, both form II+, become one hybrid regiment at the lower star count; Levies fill the freed place (deck size is kept: a smaller deck runs dry sooner) |
| Evolve hybrid | 6 | tier 1 → tier 2 |
| Dismiss | 0 | send a regiment home (min 3) |
| Repair | 2 | +6 Fort health, once per camp |
| Widen ring | 5 | +4 max and current health, twice per march |
| Gate | 3 / 5 / 7 | Iron (strikes back 1), Bastion (2), Royal (3); each +2 max health |
| Build | 2 | Palisade (Guard wall 0/4) or Watchtower (ranged 1/3) on an empty plot |
| Wall line | 3, 5 | Palisade → Stone Wall (0/7) → Bastion (1/10); or Palisade → Thorn Rampart (1/5, Pikes 2) |
| Tower line | 3, 5 | Watchtower → Bow Tower (2/4) → Beacon Tower (3/5) |

**Hybrids** (tier 1 → tier 2): Bow + Cavalry = Horse Archer → Royal Horse Archer; Spear + Cavalry = Lancer → Crown Lancer; Sword + Cavalry = Knight → Paladin; Sword + Spear = Halberdier → Bell Warden; Sword + Bow = Ranger → Shadow Ranger (Smoke); Spear + Bow = Pavise Crossbow → Arbalest (ranged Guard).

**Defeat:** one second chance per march (fight again from the same entry Fort health, fresh deal). A second defeat ends the march. Final victory: summary and chronicle; meta (marches, victories, best stop, discovered cards) is kept.

**Equal rivals** (`rivalArmy`): the rival starts from the same kit and spends `budget` (all gold the player has received, rewards counted at their value) with the same prices, guided by its commander's families, fort appetite (`fort` 0–1) and favourite hybrid. Its Fort enters with the same *share* of health the player's Fort has left. Standard AI at duels, the stronger heuristic (`hard`) at elite and final stops; the briefing's Foe button switches to Veteran (search AI).

**Save:** localStorage `bm.run.v1` (+ backup), written after every action; resume from the title. Meta in `bm.meta.v1`.

## Balance (27 Nov 2026, `tests/balance.test.ts`, AI vs AI, equal budgets)

- First seat wins ~49% over 1500 games across all commanders and stops.
- Family pairs without hybrids: 45–55%; with hybrids: 45–57%.
- Commanders against the whole field: 43% (Anvil, Orra) to 60% (Kestrel). Knights are the strongest line; the later stops are where they appear.
- Lessons: (1) shrinking the deck is deadly because of deck-out, so fusion refills with Levies; (2) hybrids must be clearly stronger than either parent to justify the gold and the lost regiment; (3) a sweep must pair every commander against every other (an early version paired each with one opponent and gave nonsense).

## World, art and sound

- UI art proposal (28 Nov 2026): copper-bell crest, battle-start banner, victory/defeat wagon-fort scenes, Fifth Bell finale and app icon are supplied as raw masters in `art/source/ui/`. They follow the existing woodcut style and contain no lettering. Owner approval, production exports and runtime integration are pending; see `art/UI-ART-REVIEW.md`.

- Original world, the Bell Marches: woodcut paintings on dyed paper, indigo cloth, copper, warm ivory (Pon's approved batch 02). Every name is invented. English only.
- All 57 paintings delivered (families, Levy, hybrids, structures, tactics, the wagon-fort, 10 commanders) and all 10 battlefields. Cards show the painting full width with no arch. Commander portraits (`r_<rival>`) appear on the rival Fort plaque, the road and the camp; the camp backdrop is the next battlefield. Any future card without art still falls back to a placeholder (hybrids: parents split on a diagonal; others: a woodcut emblem).
- Music: original, rendered by `scripts/compose.py` from the bell motif D4–F4–E4–A4 (a question that resolves to D only at the final victory): title, camp, briefing, battle calm, battle intense, victory, defeat, and the battle-start bell. Pon may replace any piece by dropping a file of the same name into `art/source/sfx/`.
- Sound effects: Pixabay set from Yuddh (no Indian conch: the bell call replaces it).

## Decisions taken over the two ChatGPT plans (26 Nov)

- Kept: the Bell Marches world and art, 4 families × 4 forms, stars, Marks-style currency (called gold), equal rivals, fort HP carry-over, repairs/expansion/gate, terrain, one fallback, the Fusion Forge hybrids and fort evolution, Codex and chronicle, seeded rewards.
- Changed: the battle is Yuddh's KARDS-style engine, not a new two-lane secret-order game (Pon asked for Yuddh's engine and pattern); web stack (TypeScript/Pixi/Vite, Capacitor later), not Unity; one repository (`Battle-master`), not a separate `battle-master-2`; seven stops (PDF 2) rather than five; hybrids built from two regiments with Levy refill rather than component tokens (simpler to read; tokens may return as rewards later); structures are battle units on the Support Line (Guard walls, ranged towers) instead of abstract charge counters, so the defence is visible and fought over.
