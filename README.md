# Battle Master — The Bell Marches

A landscape card duel at First Ford. Pick two regiments, muster on Road and Ridge, and secretly commit one order. Both lanes resolve together.

## Play First Ford

Run `npm start` from the repository and open <http://localhost:8080>. The game requires a modern browser and Python 3 for the local server. Game code and styles are served locally.

- **Learn one clash** starts at the position on page 4 of the design PDF. Try Press Road, then replay with Hold Ridge to see how two fort HP can turn on one decision.
- **Enter First Ford** starts a full seeded duel. Tap a card and a highlighted slot to deploy, pass muster, preview an order and reveal. A broken fort or the eighth clash ends the duel.

Run `npm test` with Node 20 or later. The engine tests have no package dependencies.

The project uses the original five-duel Bell Marches plan and a web-first implementation. Yuddh informed the separation of engine and presentation and the coached first decision. See the [phase roadmap](docs/ROADMAP.md) and [art and sound handoff](docs/ASSETS.md).

## Playtest build

First Ford is a playable preview, not the complete five-stop campaign. The browser saves an unfinished non-practice duel on this device; use Resume duel from the title screen. Local saves are not synced. For the optimised package, install Pillow (`python -m pip install pillow==11.3.0`), run `python scripts/build_release.py`, then `python -m http.server 8080 --directory dist`. The First Ford checks workflow also publishes the tested `first-ford-playable` artifact. Artwork with pending review hashes is displayed as a labelled text card. Six earlier GitHub images are provisional; exact reviewed files are accepted automatically by the builder. All source masters are preserved. See `dist/art-status.json` for the build's actual state. To publish a web URL, enable GitHub Actions as the Pages source in repository Settings → Pages and run Publish First Ford preview on main. No APK or full campaign is included.
