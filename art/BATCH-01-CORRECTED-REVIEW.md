# Batch 01 — corrected artwork review (27 November 2026)

The user-supplied Battle_Master_Batch_01_Corrected.zip was opened and its five PNGs inspected visually against PROMPTS-BATCH-01.md and at 90 px wide. All five are opaque RGB, exactly 1500 × 2100 and 5:7. Four pass visual review; Archer is accepted for gameplay with a framing exception (lower bow tip still exits the image; avoid an aggressive frame crop). This is not a mobile UI or release performance test.

| File under art/source/card/ | Review | Expected corrected Git blob SHA-1 |
|---|---|---|
| bow1.png | Conditional pass: improved headroom, lower bow cropped | 08436cfdeb8de0603843c432f8b7ff5252b7e06d |
| watch.png | Pass: two guards, watch lantern | a2156c02299f8117b46ed9f07195be98f8fdf051 |
| stitch.png | Pass: sleeve bandage and medical supplies | a258fd92ff16f52d70d1b1495052550f14146adc |
| screen.png | Pass: helmet, hand, indigo binding | 7f0a4a052c5f3e7a1be2379f5565206ba7911721 |
| courier.png | Pass: ivory dispatch, blue paper, clasp, bench and cord | a91336a25abd1d631f825dad4aacf9bf38dea21f |

**Replacement status: PENDING.** The connector can write text but cannot access the local attachment bytes directly, and the local runtime has no GitHub network access. Do not delete old files before the corrected PNGs can be uploaded. Overwrite the five identical paths on main in one commit; verify the blob hashes above. Existing preview PR #2 still references the original art tree and must be refreshed after replacement. Keep the six other source files untouched. Previous visual approval covered the user-supplied versions, not verified identical repository binaries. Final landscape frame and WebP optimisation checks remain pending.
