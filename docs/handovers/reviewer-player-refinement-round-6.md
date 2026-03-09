# Reviewer Handoff: Player Refinement Round 6

## Scope

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Coordination rules: [AGENTS.md](/Users/livefree/projects/media-website-v2/AGENTS.md#L1)
- Runtime surface under review: `/media/[slug]`
- Validation target for runtime QA: `/media/the-dinosaurs`

Round 6 is a focused polish pass. Reviewer sign-off for this round must be based on visible runtime behavior in the actual player, not on code inspection alone.

## Round 6 Acceptance Checklist

The following six refinements must be directly observable in runtime before the candidate can be accepted.

### 1. No redundant volume meter on the volume button

Pass if a tester can observe:
- The volume button no longer contains the extra miniature bar-meter visualization.
- The button still clearly communicates mute or volume state through the main icon treatment alone.
- Removing the meter does not make the button ambiguous at a glance.

Fail if a tester can observe:
- Any remaining inline meter bars or duplicate volume-level visualization inside the button.
- A button treatment that still feels visually redundant with the hover slider.

### 2. Volume-thumb size matches progress-thumb size

Pass if a tester can observe:
- The volume slider thumb and the progress slider thumb appear to be the same diameter.
- The two thumbs feel visually aligned as part of the same control system.

Fail if a tester can observe:
- The volume thumb is noticeably larger or smaller than the progress thumb.
- The two controls look mismatched in density or scale.

### 3. Progress thumb is vertically centered on the track

Pass if a tester can observe:
- The draggable progress thumb is centered on the rail, not visually biased above or below it.
- This alignment remains correct in idle, hover, and active drag states.

Fail if a tester can observe:
- The thumb still sits too high or too low relative to the rail.
- Alignment changes or feels off during drag.

### 4. Fullscreen video is vertically centered

Pass if a tester can observe:
- Entering fullscreen keeps the video vertically centered within the fullscreen viewport.
- No extra dead space appears disproportionately above or below the video unless the aspect ratio requires equal letterboxing.
- Returning from fullscreen does not break the normal player layout.

Fail if a tester can observe:
- The fullscreen video is pinned too high or too low.
- Vertical empty space is visibly uneven.
- Exiting fullscreen leaves the player misaligned.

### 5. Speed popup aligns to the player right edge and does not overlap the control bar incorrectly

Pass if a tester can observe:
- The speed popup aligns to the player’s right edge rather than merely following the right edge of the speed button.
- The popup remains visually associated with the lower-right control area.
- The popup does not cover or incorrectly collide with the bottom control bar.

Fail if a tester can observe:
- The popup is still keyed to the button edge rather than the player edge.
- The popup overlaps or crowds the bottom controls.
- The popup placement feels visually detached or unstable.

### 6. Play/pause tooltip is fully visible and not clipped at the left edge

Pass if a tester can observe:
- Hovering or focusing the play/pause control shows the full tooltip text.
- The tooltip is fully readable even when the control is near the left side of the player.
- The tooltip does not clip against the player edge in default, theater, or fullscreen modes.

Fail if a tester can observe:
- The tooltip text is cut off on the left.
- The tooltip shifts into an unreadable or awkward position near the player edge.

## Runtime QA Inventory

Round 6 QA should focus on visible outcomes, edge-alignment behavior, and consistency across player modes.

### Base QA setup

1. Open `/media/the-dinosaurs`.
2. Start on desktop width.
3. Begin playback before testing controls that depend on active player state.
4. Repeat mode-sensitive checks in default mode, theater mode, and fullscreen where relevant.

### Visible-outcome checks

1. Inspect the volume button at rest and confirm there is no duplicate mini meter.
2. Reveal the volume slider and visually compare its thumb size to the progress-thumb size.
3. Inspect the progress rail at rest and during dragging to confirm vertical centering.
4. Open the speed popup and compare its right alignment against the outer player edge, not the button edge.
5. Hover or focus the play/pause button and verify the tooltip remains fully visible.

### Player-mode checks

1. Enter fullscreen and verify the video is vertically centered.
2. Exit fullscreen and confirm the player returns to its normal layout cleanly.
3. In theater and fullscreen, re-check tooltip placement and popup alignment if those surfaces move or resize.

### Preservation checks

Round 6 is a polish pass, so previous accepted behavior must still hold:
- Volume and speed controls must not change playback progress.
- Volume hover behavior must still reveal the slider correctly.
- The control bar must still remain compact, black, and auto-hiding.
- Click-to-toggle on the video surface must still work.
- Resume playback by media plus episode must still work.
- Episode and source switching must still avoid page jumps.
- Idle cursor hiding must still work in all player modes.

## Explicit Human Tester Questions

These are the direct reviewer questions for final sign-off.

1. Does the volume button now rely only on the main icon and no longer show a redundant meter?
2. Do the volume and progress thumbs look like the same size?
3. Does the progress thumb look vertically centered on the rail during both rest and drag?
4. In fullscreen, does the video sit vertically centered in the viewport?
5. Does the speed popup align with the player’s right boundary and stay clear of the bottom control bar?
6. Is the play/pause tooltip fully readable without clipping at the left side of the player?
7. Do all of the above refinements hold without regressing the already accepted Round 4 and Round 5 behaviors?

## Code-Level And UX Risks Before Implementation

These risks are worth flagging before the Detail Player pass because they map directly to the requested Round 6 polish items.

1. The current volume button still includes a dedicated `.playerVolumeMeter` element and bar styling, so removing the redundant meter will require both visual cleanup and confidence that the icon alone still communicates state clearly. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L455).
2. The current volume slider thumb is still much larger than the progress thumb, so Round 6 needs a deliberate geometry adjustment rather than minor spacing tweaks. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L355) and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L621).
3. The progress thumb centering issue is likely still tied to explicit thumb margin math, which means it can appear fixed in one state while remaining visually off in another browser or interaction state. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L355).
4. Fullscreen centering is a mode-specific layout problem, so a change that looks correct in default mode can still leave fullscreen vertically off if the immersive viewport styles are not aligned with the actual media box. Reviewer QA must explicitly check fullscreen rather than infer from other modes.
5. The speed popup currently anchors to `right: 0` inside the speed dock and uses a large `bottom` offset, which makes it likely to track the button rather than the overall player edge. That is exactly the failure mode Round 6 is trying to remove. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L643).
6. The tooltip still uses a centered transform from the trigger shell. Near the left edge, that can easily clip if no alternate alignment rule is introduced for edge-adjacent controls. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L490).

## Reviewer Baseline Outcome

Round 6 should be treated as a visible polish pass with concrete geometric expectations.

Reviewer expectation for the next Detail Player pass:
- optimize for visibly correct alignment and edge behavior rather than abstract code cleanliness
- preserve the accepted Round 4 and Round 5 runtime behavior while tightening the remaining UI polish
- do not claim success unless all six refinements are directly observable in the running player
