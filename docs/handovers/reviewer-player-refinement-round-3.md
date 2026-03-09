# Reviewer Handoff: Player Refinement Round 3

## Scope

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Coordination rules: [AGENTS.md](/Users/livefree/projects/media-website-v2/AGENTS.md#L1)
- Planner acceptance framing: [docs/handovers/planner-player-refinement-round-3.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-player-refinement-round-3.md#L1)
- Runtime surface under review: `/media/[slug]`
- Detail Player owned implementation scope remains limited to `app/media/`, `components/player/`, and `components/detail/`

This baseline is for pre-implementation review. It is not a final acceptance sign-off. Final Reviewer approval for Round 3 must include interactive browser validation.

## Current Known Regressions

The current user-reported regressions for Round 3 are:

1. Dragging the volume slider or changing speed can still affect playback progress and may reset playback to the beginning.
2. The volume slider geometry is still wrong. It should expand smoothly from the right side of the volume button, push the time label to the right while expanding, and show only the slider without a background panel.
3. The control bar background and auto-hide behavior regressed. The bar should return to a black background, hide when inactive, and reappear on hover or active interaction without permanently covering the video.
4. The speed panel is still not correctly anchored to the lower-right corner and is not using the requested semi-transparent treatment.

## Runtime QA Inventory

Round 3 requires in-browser QA. Static code review is not sufficient for acceptance.

### Environment baseline

1. Run the app at desktop width first, then repeat spot checks at a narrower responsive width.
2. Open a stable detail route with a real playable source, such as `/media/the-dinosaurs`.
3. Let playback begin, then repeat slider and overlay checks from both paused and playing states.
4. Keep the current time label visible while testing slider interactions so unintended progress jumps are obvious.

### Interactive browser validation checklist

#### Slider drag isolation

1. Start playback and note the current time.
2. Drag the volume slider across multiple positions.
3. Confirm only volume changes.
4. Confirm the current time and progress rail do not jump, scrub, or reset.
5. Open the speed panel and change speed via slider.
6. Confirm only playback rate changes.
7. Confirm playback progress does not jump, scrub, or reset to `0:00`.
8. Repeat both checks after pausing and resuming playback.

#### Volume reveal geometry

1. Hover the volume button without touching the progress rail.
2. Confirm the slider expands from the right side of the volume button.
3. Confirm the volume button remains clickable while the slider is expanded.
4. Confirm the expanding slider pushes the time label to the right instead of overlapping it.
5. Confirm there is no extra volume-panel background, pill, or floating card behind the slider.
6. Confirm the slider collapses cleanly when hover or focus leaves the control region.

#### Volume tooltip behavior

1. Hover the volume control in unmuted state.
2. Confirm the tooltip text matches the current mute and volume shortcut behavior.
3. Mute the player.
4. Hover again and confirm the tooltip updates for the muted state.
5. Confirm tooltip visibility remains stable while the hover slider is expanded.

#### Control-bar visibility and background

1. Leave the player idle without pointer movement.
2. Confirm the control bar auto-hides when inactive.
3. Move the pointer over the player or interact with playback.
4. Confirm the control bar reappears.
5. Confirm the visible control bar background is black, not a gray or translucent overlay that blocks the video.
6. Confirm the hidden state no longer visually or interactively obstructs the video surface.

#### Speed panel layout and behavior

1. Open the speed panel from the speed button.
2. Confirm the panel is anchored to the lower-right area of the player controls.
3. Confirm the panel remains compact relative to the control row.
4. Confirm the panel uses a semi-transparent treatment rather than a dense opaque card.
5. Click outside the panel and confirm it closes.
6. Reopen the panel and trigger other player actions such as play/pause, seek, mute, theater, fullscreen, and next-episode, then confirm the panel closes when appropriate.

### Regression preservation checks

1. Click directly on the video surface and confirm play/pause still toggles.
2. Leave playback mid-episode, reload, and confirm resume playback still restores by media plus episode.
3. Confirm inactive watched episodes remain dimmed.
4. Switch episode and source selections and confirm the page does not jump to the top.
5. Confirm theater and fullscreen still render black non-video areas without reintroducing unrelated labels or borders.

## Explicit Pass/Fail Checks

### Slider drag must not affect progress

- Pass:
  - Volume slider drag changes only volume.
  - Speed change changes only playback rate.
  - Playback time and the progress rail remain stable unless the progress rail itself is used.
- Fail:
  - Dragging volume or speed changes `currentTime`, scrubs the rail, or resets playback.

### Volume slider expands from volume button right side and pushes time label right

- Pass:
  - The slider expands from the right edge of the volume button.
  - Expansion shifts the time label to the right as part of the layout flow.
  - The volume button remains clickable throughout the interaction.
- Fail:
  - The slider overlaps the button or time label.
  - The time label does not move and instead gets covered.
  - The slider appears detached from the volume button.

### No volume panel background

- Pass:
  - Only the slider track and thumb are visible during expansion.
  - No extra background chip, card, or pill appears behind it.
- Fail:
  - Any visible background panel or floating capsule remains behind the expanded slider.

### Black auto-hiding control bar

- Pass:
  - Controls disappear when inactive.
  - Controls return on hover or active interaction.
  - The visible bar background is black and does not permanently mask the video.
- Fail:
  - The bar remains visible while idle.
  - The bar background is not black.
  - The bar continues to block the video even when inactive.

### Speed panel lower-right and semi-transparent

- Pass:
  - The speed panel opens from the lower-right area of the player controls.
  - The panel reads as compact and semi-transparent.
  - Outside click and conflicting player actions close it.
- Fail:
  - The panel appears too high, too centered, too large, or too opaque.
  - The panel remains open when it should close.

## Code-Level Risks Before Implementation

These are implementation risks visible from the current `codex/coordinator-baseline` code and should be treated as likely failure points until fixed and runtime-verified.

1. The volume control is still built as an absolutely positioned panel with its own background and box shadow, so the current structure is biased toward overlay behavior rather than inline expansion that pushes the time label. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L454) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L761).
2. The current layout does not provide an explicit flex-growth or transition relationship between the volume dock and the time label, so there is no obvious code path that would naturally push the time label right during slider expansion. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L360) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L797).
3. The player chrome currently uses a persistent gradient overlay and there is no visible inactivity timer or hide-state class in the player shell, so the Round 3 black auto-hide requirement appears unimplemented from the baseline. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L273) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L715).
4. The speed panel is still positioned above the trigger button with `bottom: calc(100% + 8px)`, which is close to the control row but not obviously the requested lower-right anchored treatment from the latest regression note. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L543).
5. The existing slider handlers are logically separated from seek, but the user has still reported runtime progress mutations. That means the remaining risk is likely in real interaction wiring, pointer hit geometry, or overlapping controls rather than the obvious state-update functions alone. This must be closed by browser QA, not code inspection. See [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L574), [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L585), and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L608).

## Reviewer Baseline Outcome

Round 3 is not ready for acceptance yet. The baseline for this round is:

- runtime QA is mandatory before merge
- the four reported regressions remain open until verified in-browser
- Detail Player should treat volume geometry and control-bar behavior as the highest-risk layout items
- Reviewer final sign-off must be based on interactive validation, not code review alone
