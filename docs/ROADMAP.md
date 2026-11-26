# Phase roadmap

- [x] Initialize independent repository; inspect Yuddh read-only.
- [x] Author deterministic clash resolver and 20-card deck; verify page 4 arithmetic in code-mode smoke check.
- [x] First landscape HTML/CSS interface, seeded duel and card selection.
- [x] Re-fetch committed engine: 100 seeded simulations terminated; worked clash, deck count, seed determinism, illegal rear, simultaneous draw, AI order isolation checked. UI JS parsed.
- [ ] Execute Node test suite in CI and perform browser/physical-phone first duel gate.
- [ ] Phase 2: two fights and camp (Marks, recruit/train/evolve, repairs, exact equal matching, save/resume).
- [ ] Phase 3: five-stop march, terrain, fallback, chronicle, Veteran AI.
- [ ] Phase 4: original art, animation, audio, accessibility and Android packaging.
- [ ] Phase 5: seeded balance, device QA and release.

Architecture: web-first per Yuddh reference (deviation from PDF Unity proposal); independent engine, semantic DOM initial renderer, later evaluate PixiJS. No copying Yuddh assets or modifying Yuddh.

Known prototype limits: fixed rival families, no campaign, terrain, save/resume, full UI polish or Android wrapper. Advanced cards have definitions and clash effects but are not obtainable until camp. Reposition after a swap resets moved flags for prototype; review against the design. AI muster is baseline heuristic, not full Standard spec. Node tests are authored, not yet verified by CI. The sandbox could not resolve github.com for a local checkout; source-level checks executed via GitHub connector. No browser/device run yet.
