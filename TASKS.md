# Tasks

## Done (27 Nov 2026)
- [x] Yuddh engine and renderer ported; ChatGPT JS prototype and Unity plan retired (art masters kept)
- [x] English KARDS terms everywhere (Fort, Supply, Front Line, Support Line, Guard, Swift, Smoke, Trap, Tactic)
- [x] 46 cards: 16 family forms, Levy, 12 hybrids, 7 fort structures, 10 tactics; star variants generated
- [x] March: muster, 7-stop forking route, camp (recruit, train, evolve, fuse, dismiss, repair, widen, gate, walls, towers), rewards, second chance, final victory, summary, meta, Codex, Quick duel
- [x] Equal-budget rivals with ten commanders; fort health share matched
- [x] Save and resume after every action (with backup)
- [x] Original music (scripts/compose.py) and bell call; Pixabay sound effects
- [x] Tests: engine additions, march economy, rivals, save; equal-budget balance sweep; scripted browser playtest at 1280×720 and 844×390

## UI source delivery (28 Nov 2026)
- [x] Generate and name six raw UI PNGs from the supplied art brief; add prompts, manifest and review gallery
- [ ] Pon: approve the six UI paintings (`art/UI-ART-REVIEW.md`)
- [ ] After approval: prepare production-size exports, add conversion/loading and UI animations, and install icon derivatives

## Next
- [ ] Pon: play two or three marches on a phone; note anything confusing or any card that feels useless or too strong
- [x] Art batch 03 painted (PR #5) and wired: commander portraits on rival Forts, the road and camp (`r_<rival>`); `fort_wagon` on your Fort; camp backdrop is the next battlefield
- [ ] Optional art: a portrait card face for each commander's briefing/end screen (they still show their signature card there)
- [ ] Coached first battle (Yuddh's coach layer exists in battle.ts; needs English steps and a fixed First Ford deal)
- [ ] Camp: show a before/after card when evolving or fusing (animation), and the deck count change
- [ ] Rival preview: show the rival's regiment cards as faces, not only text
- [ ] Daily march: one seed per day for everyone, local best score
- [ ] More rival archetypes and tactics; maybe component tokens (Armour, Spikes, Bowcraft) as rewards that unlock extra structure branches
- [ ] Veteran (search AI) tuning for elite stops; measure win rates with a scripted human-like policy
- [ ] Android build (copy Yuddh's `android/`, `capacitor.config.ts` with a new app id, and `android.yml`)
- [ ] Pon: Settings → Pages → Deploy from a branch → `gh-pages` (the deploy workflow publishes on every push to main)
