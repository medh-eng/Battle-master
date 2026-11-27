# The Bell Marches production plan

The attached *Battle Master Game Design & Production Plan* (26 November 2026) governs this prototype. Build the first five-stop march for landscape mobile browsers. Use Yuddh's separation of rules and rendering, its coached opening encounter and its seeded regression tests as design references. The Fusion Forge proposal describes a separate seven-stop game.

| Stage | In the prototype | Next acceptance check |
| --- | --- | --- |
| First duel · PDF pp. 3–7, 11 | First Ford, four starting families, four tactics, 20-card decks, simultaneous orders, a repeatable practice clash and lane damage reports | On a physical phone, have a new player predict both lanes, reveal them, and finish a duel. Check small landscape screens and tap targets. |
| Two fights and a camp · pp. 7–10, 13 | The duel engine defines unit forms, stars and Gate Plate absorption | Win 6 Marks, preview the next rival and buy up to one army improvement and one fort service. Demonstrate the three page 8 spending choices. Close and reopen at battle two with the same HP, Marks and roster. Match the rival's entry strength. |
| Five-stop march · pp. 9–10 | First Ford only | Add seeded forks and terrain, the fallback, campaign chronicle, Standard and Veteran decision policies and the Fifth Bell finale. |
| Art and sound · pp. 11–12 | Text-labelled cards, fort totals and order flags | Integrate the separate art project's approved batches and credited music/SFX. Test readability, mute and reduced motion on device. |
| Release · pp. 13–14 | Browser prototype | Reproduce saved decisions and rewards after interruptions, run the PDF's balance and player tests, then package and test offline Android. |

## First duel checks

- Run `npm test` for the page 4 arithmetic, deterministic deals, legality, simultaneous defeat, 100 seeded duels and regression cases for damage reports, Gate Plate and cavalry repositioning.
- The browser smoke test in `tests/browser_smoke.py` uses touch emulation at 844 × 390 and 667 × 375. It exercises both practice outcomes, a legal deployment and a complete duel. Physical Android usability and new-player comprehension require separate playtests.
- The current rival uses fixed starting families and a baseline muster heuristic. Full rival matching, campaign purchases, save/resume and Android delivery remain open.

## Playtest release handoff

First Ford now has a static WebP build, optional art-free view (`?art=0`), local duel resume and a packaged browser smoke-test artifact. The release builder accepts exact reviewed Git blob hashes; six previous repository files may be used provisionally, and five corrected cards remain text placeholders until the corrected PNGs arrive on main. The full march, camp, sound, balance and physical Android tests are still separate milestones.
