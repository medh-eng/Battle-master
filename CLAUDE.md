# Battle Master: The Bell Marches — working notes for Claude

Roguelike KARDS-style card game for Pon (owner, non-programmer; directs the work, makes art with AI image tools from prompts Claude writes). Built on the YUDDH engine (github.com/medh-eng/Yuddh): read Yuddh's CLAUDE.md "Hard-won lessons" before touching `src/game/scenes/battle.ts`, they all apply here. English only, original world. Web first, Android later.

## Ground rules
- The engine (`src/engine/`) and the march (`src/run/`) have **no DOM code**. Screens live in `src/game/`.
- **All numbers live in JSON**: cards in `src/data/cards.json`, the campaign in `src/data/run.json`, battle constants in `src/data/rules.json`. Balance changes are JSON edits.
- After any card or price change run `BM_SIM=1500 npx vitest run tests/balance.test.ts` (Vitest hides console output of passing tests: to see the table, write it to a file as tests/balance.test.ts's `sweep` returns it). Keep the first seat within 45–55% and every commander within roughly 40–62%. Change one card at a time.
- Before pushing: `npm test`, `npx tsc --noEmit`, `npm run build`, then `npm run preview` (start it with `setsid`) and `node tests/e2e/march.cjs http://localhost:4173/ <out> 1280 720` and again at `844 390` with `PW=/opt/npm-tools/node_modules/playwright CHROME=/usr/bin/google-chrome`; look at the screenshots. The bot counts a drag as failed only if nothing in `info()` changed.
- Keep `DESIGN.md`, `TASKS.md`, `ROADMAP.md` and the README file map current at the end of every session.
- Work on a branch and open a pull request; Pon merges.

## How the pieces fit
- A march is a plain `RunState` (run.ts); `main.ts` `go()` shows the screen for `s.phase` and saves after every step.
- `runScenario(s, finish)` (run/battle.ts) builds a Yuddh `Scenario`: decks from `deckOf`, Forts with `hqHp`/`hqThorns`, structures via `preset.playerSupport`/`enemySupport`, `dharma: false`, a fixed seed, `extraArt` (hybrid placeholders borrow their parents' paintings). The battle's end screen shows one Continue button when `sc.run` is set.
- Training stars are real cards: `sword2@3` (built in engine/cards.ts from `starBonus`). Paintings are keyed by the base id (`manifest.ts` strips `@n`).
- Fort structures: keyword `fort`; `lineCount()` ignores them for the 4-place limit.
- Screens between battles are HTML (`#bm-ui`) over the Pixi backdrop (`domScene` in scenes/march.ts); card faces come from `cardFaceUrl` (canvas → data URL). All paintings are loaded at boot (`loadArt(CARD_ART)`) so faces are never placeholders by mistake.
- Battlefields not yet painted fall back to `first_ford` (`battlefieldName` in manifest.ts, list written by `npm run assets` to `src/assets/battlefields.json`).

## Lessons
- Deck-out decides long games: anything that shrinks a deck (fusion) must refill it.
- A balance sweep must pair everyone with everyone; fixed pairings produce convincing nonsense.
- Yuddh leftovers still in the tree but unused by the menus: `src/engine/duel.ts`, `src/game/net/link.ts`, the coach code in battle.ts, `Scenario.duel/online`. They compile; leave them until the coached battle or a duel mode needs them.
