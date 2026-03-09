# Planner Handoff: Player Refinement Round 6

## Task summary

Player Refinement Round 6 is a focused player-polish pass on the `/media/[slug]` runtime after the larger Round 5 control and cursor improvements were accepted. This round targets six remaining visible issues around redundant volume UI, slider/thumb sizing and alignment, fullscreen centering, speed-popup alignment, and play/pause tooltip clipping.

This is still limited to Detail Player ownership and reviewer runtime validation. It is not a browse-shell, search, shared-data, or architecture task.

## Exact owned-file boundaries

### Detail Player owned scope

- `app/media/`
- `components/player/`
- `components/detail/`
- brief `docs/dev-log.md` note for its own implementation work

### Reviewer scope

- runtime/browser validation against the active task
- acceptance framing in terms of visible player behavior
- no implementation takeover of Detail Player-owned files

### Out of scope

- `app/` outside `app/media/`
- `components/` outside `components/player/` and `components/detail/`
- `styles/`
- `data/`
- `lib/`
- `types/`
- planner/coordinator architecture docs

## Concrete execution order

1. `planner`
- publish this Round 6 handoff

2. `reviewer`
- audit the six requested polish items
- prepare the runtime/browser QA sequence for those six items
- confirm the active acceptance framing before implementation starts

3. `detail-player`
- implement only inside owned scope
- keep the round focused on the six visible Round 6 improvements below

4. `reviewer`
- validate the implementation in-browser
- report the result in user-visible terms before merge

## Detail Player implementation checklist

### 1. Remove redundant volume meter from the volume button

- Remove the extra volume-meter treatment from the volume button itself.
- Keep the dedicated slider as the single visible control for volume level.
- Preserve the accepted multi-state volume icon behavior from Round 5.

### 2. Shrink volume slider thumb

- Reduce the volume-slider thumb diameter so it matches the progress-thumb diameter.
- Keep the thumb still usable and visible after the size reduction.

### 3. Fix progress track/thumb alignment

- Correct the remaining alignment mismatch between the progress track and its draggable thumb.
- Ensure the thumb sits visually centered on the rail at rest and while dragging.

### 4. Vertically center video in fullscreen

- In fullscreen mode, center the video correctly within the viewport.
- Avoid top bias or leftover vertical offset from non-fullscreen layout logic.

### 5. Align speed popup to the player right edge

- Move the speed popup so it aligns with the player’s right edge, not the speed button’s right edge.
- Preserve the accepted lower-right placement intent while using the player edge as the alignment reference.

### 6. Fix play/pause tooltip clipping

- Ensure the play/pause tooltip is fully readable and not clipped on the left side of the player.
- Preserve tooltip readability across the supported player states where the control is shown.

## Reviewer validation sequence

Reviewer sign-off for Round 6 must use runtime/browser checks and describe results in visible terms.

### 1. Volume button cleanup

- Open the player controls and verify the volume button no longer shows a redundant volume meter.
- Verify the accepted Round 5 multi-state volume icon still works visibly.

### 2. Volume slider thumb size

- Reveal the volume slider and compare its thumb diameter to the progress-thumb diameter.
- Confirm the slider thumb has been reduced to the same apparent diameter.

### 3. Progress alignment

- Inspect the progress rail and thumb at rest.
- Drag the progress thumb and confirm it remains centered on the rail rather than visually offset.

### 4. Fullscreen video centering

- Enter fullscreen mode and verify the video is vertically centered within the viewport.
- Exit and re-enter if needed to confirm the behavior is stable.

### 5. Speed popup edge alignment

- Open the speed popup and verify its right edge aligns with the player’s right edge rather than the speed button’s edge.
- Confirm the popup still remains readable and clear of the compact control bar.

### 6. Play/pause tooltip readability

- Reveal the play/pause tooltip and verify it is fully readable.
- Confirm no left-side clipping occurs in the actual player viewport.

## Acceptance gate

Round 6 is complete only if:

- all six requested improvements are visibly present in the running UI
- reviewer completes the runtime/browser validation sequence above
- the accepted Round 5 behaviors remain intact while the Round 6 polish items land
- the user can directly observe the requested geometry, alignment, centering, and tooltip fixes
