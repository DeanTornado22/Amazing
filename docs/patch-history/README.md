# VibeTunnel Visual Design History

These are the historical design-patch documents that were used during
VibeTunnel's three iterative visual redesigns. They're preserved here for
reference; the resulting code changes are already merged into the project.

## Patches

1. [`10_VISUAL_REDESIGN_PATCH.md`](./10_VISUAL_REDESIGN_PATCH.md) — Round 1
2. [`VIBETUNNEL_ROUND2_DARK_CONCERT_PATCH.md`](./VIBETUNNEL_ROUND2_DARK_CONCERT_PATCH.md) — Round 2
3. [`VIBETUNNEL_ROUND3_MINIMAL_MODERN_PATCH.md`](./VIBETUNNEL_ROUND3_MINIMAL_MODERN_PATCH.md) — Round 3

The first patch is the original Brazilian-phonk concert direction; the
second reduced bloom and added concert objects; the third pivoted to a
minimal modern aesthetic with live tuning.

If you want to know **what's actually in the codebase today**, look at
`src/visual/visualPresets.ts`, `src/scene/TunnelFrames.tsx`, and
`src/audio/AudioEngine.ts` — the three rounds are all visible there.
