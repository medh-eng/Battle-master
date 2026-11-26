# Battle Master — The Bell Marches

Standalone mobile-landscape roguelike card game. Based on the 26 November 2026 design plan. Yuddh is a read-only reference; no Yuddh source or assets imported.

## First duel prototype
Requires a modern browser. Run `python3 -m http.server 8080` in the repository and open http://localhost:8080. Choose two regiments, deploy via tap, pass muster, select a secret order, then reveal. The fixed seed can be replayed. The prototype has no external network dependencies.

Run `npm test` with Node 20+ (no dependencies). Tests include the page 4 worked clash, seed determinism and simulated duels. CI/device testing not yet verified.

Architecture decision: browser-native JavaScript and semantic HTML/CSS initially, with a later Capacitor Android wrapper and optional PixiJS renderer inspired by Yuddh. This deviates from the PDF's Unity proposal.

See [roadmap](docs/ROADMAP.md) and [asset handoff](docs/ASSETS.md). No final art or audio, camp, five-stop campaign, persistence or APK yet.
