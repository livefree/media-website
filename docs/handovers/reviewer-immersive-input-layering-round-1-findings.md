# Reviewer Findings: Immersive Input Layering Round 1

## Decision

Findings only. I am not accepting this round yet.

## Why acceptance is withheld

This round is explicitly runtime-visible. The core acceptance checks are cursor semantics over different surfaces and whether immersive theater/fullscreen hide now works reliably after 3 seconds without the blank-area click workaround. I validated the implementation direction from code review and confirmed `npm run build` passes, but I could not complete browser-runtime validation in this session.

I used the local [$playwright-interactive](/Users/livefree/.codex/skills/playwright-interactive/SKILL.md) guidance because this task clearly needs interactive browser QA. That workflow requires `js_repl`, but this session does not expose a `js_repl` tool, so I could not run the intended runtime verification path here.

## Blocking finding

1. Runtime/browser confirmation is still missing for the input-layering and immersive idle outcomes.
   - The passive video surface is now structurally non-interactive in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L629), and a separate default-cursor gesture layer now carries click-to-toggle semantics in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1183) and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L642).
   - Real controls still retain explicit pointer affordance in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L781), [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L852), and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L1245).
   - The immersive idle path is also directionally aligned: the player now uses a single timeout path that hides controls and cursor together, with the top title still derived from the same visibility state in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L508), [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1055), and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1189).
   - However, I did not verify in-browser that the cursor actually reads as default over the passive video area, that only controls read as pointer, or that theater/fullscreen auto-hide now succeeds after 3 seconds without first clicking a blank control-bar area.

## Code/build observations

- The old broad `cursor: pointer` on the video surface is gone. The `video` element is now `pointer-events: none` in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L629), which supports passive-surface semantics.
- A dedicated `.playerGestureLayer` now sits above the passive video and uses `cursor: default` while handling click-to-toggle in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1183) and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L642).
- Real interactive controls still advertise pointer affordance through the progress input, control buttons, rate steps, and preset buttons in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L781), [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L852), and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L1257).
- The immersive idle path appears simplified: `hideControlsTimeoutRef` now drives both `isControlsVisible` and `isCursorHidden`, and the prior separate cursor timeout ref is gone from the current code path. See [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L344) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L508).
- Pointer movement, pointer entry, and pointer down on the wrapper all now call `revealControls()` in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1095), which is directionally consistent with removing the “blank-area click first” dependency.
- I did not find an obvious code-level regression to playback controls, title overlay, or routing from this round.
- `npm run build` passed.

## Runtime QA still required before acceptance

1. Hover the passive video image area and confirm the cursor is default/arrow, not hand/pointer.
2. Hover real buttons, sliders, and the progress rail and confirm only those interactive controls show pointer affordance.
3. Enter theater mode, interact briefly, stop interacting, and confirm the chrome hides after 3 seconds without needing a blank-area click first.
4. Enter fullscreen mode, interact briefly, stop interacting, and confirm the chrome hides after 3 seconds without needing a blank-area click first.
5. In both immersive modes, confirm control bar, top title, and cursor still hide and reveal together without drift.
6. Confirm click-to-toggle playback still works on the gesture layer if that behavior remains intended.
7. Confirm title overlay behavior and canonical routing do not regress.

## Current recommendation

Do not treat this round as reviewer-accepted yet. The implementation looks structurally aligned from code/build review, but the visible cursor and immersive-idle outcomes still need browser-runtime verification.
