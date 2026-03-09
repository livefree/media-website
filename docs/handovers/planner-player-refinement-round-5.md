# Planner Handoff: Player Refinement Round 5

## Task summary

Player Refinement Round 5 is a focused polish pass on the `/media/[slug]` player after the major Round 4 runtime blockers were cleared. This round is about control-density redesign, clearer control affordances, volume-memory behavior, and cursor presentation while preserving the already accepted Round 4 runtime fixes.

This is still limited to Detail Player ownership and runtime QA validation. It is not a browse-shell, search, shared-data, or architecture task.

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

## Exact execution order

1. `planner`
- publish this Round 5 handoff

2. `reviewer`
- audit the new requested improvements
- prepare the runtime/browser QA sequence for all six items
- confirm the active acceptance framing before implementation starts

3. `detail-player`
- implement only inside owned scope
- keep the round focused on the six visible control-behavior improvements below

4. `reviewer`
- validate the implementation in-browser
- report the result in user-visible terms before merge

## Detail Player implementation checklist

### 1. Lower-right speed panel placement

- Ensure the speed panel opens in the lower-right area of the player.
- Ensure it does not cover the bottom control bar.
- Preserve the accepted compact and semi-transparent treatment from earlier rounds.

### 2. Volume memory and temporary slider reveal

- Pressing `M` to unmute must restore the pre-mute volume level.
- Keyboard-driven volume changes must temporarily reveal the volume slider and show the updated level.
- Mouse-driven volume interactions must continue to work while this temporary reveal behavior exists.
- Keyboard and mouse paths must remain compatible with each other so one does not break or override the other’s expected reveal/hide logic.

### 3. Speed button rate indicator redesign

- Redesign the speed button so the current playback rate is visible directly in the button treatment.
- The visible indicator should remain readable in normal, theater, and fullscreen player modes.

### 4. Multi-state volume icon redesign

- Redesign the volume button icon so it visibly communicates four states:
  - muted
  - low volume
  - medium volume
  - high volume
- The icon state must update reliably for both keyboard and mouse volume changes.

### 5. Compact control bar geometry

- Reduce control bar height significantly, targeting roughly half the current height.
- Position the progress rail at the top edge of the control bar.
- Center the draggable thumb vertically on the rail instead of leaving it visually biased upward.
- Preserve non-overlap between the lower-right speed panel and the compact control bar.

### 6. Cursor auto-hide across player modes

- Hide the mouse cursor while playback is active and the pointer is idle.
- Restore the cursor on movement or active interaction.
- Keep this behavior consistent across normal, theater, and fullscreen modes.

## Explicit compatibility note: keyboard and mouse volume behavior

Round 5 must preserve compatibility between keyboard and mouse volume flows:

- keyboard volume changes must reveal the slider temporarily without forcing the slider into a permanently visible state
- mouse hover/focus behavior must still govern the normal slider reveal interaction
- unmute via `M` must restore the previous volume level and update both the icon state and visible slider level correctly
- keyboard-triggered reveal must not block, offset incorrectly, or desynchronize later mouse-driven volume adjustments

## Reviewer validation sequence

Reviewer sign-off for Round 5 must use runtime/browser checks and must be phrased in terms of visible player behavior.

### 1. Lower-right speed panel placement

- Open the speed panel and confirm it appears in the lower-right area.
- Confirm it does not overlap the compact control bar.
- Confirm it still uses the requested semi-transparent treatment.

### 2. Non-overlapping control bar

- Verify the compact control bar does not collide with the lower-right speed panel.
- Verify controls remain readable and clickable after the height reduction.

### 3. Speed button rate indicator

- Verify the speed button visibly displays the active playback rate.
- Change rates and confirm the displayed indicator updates immediately.

### 4. Multi-state volume icon

- Validate the icon in muted, low, medium, and high volume states.
- Change volume using both keyboard and mouse and confirm the icon updates correctly in both cases.

### 5. Compact control bar geometry

- Verify the control bar is visibly more compact than the prior accepted baseline.
- Verify the progress rail sits at the top edge of the control bar.
- Verify the rail/thumb alignment is visually centered rather than biased upward.

### 6. Rail/thumb alignment

- Check the progress thumb at rest and while dragging.
- Confirm the thumb remains centered vertically relative to the rail in visible states.

### 7. Temporary volume-slider reveal behavior

- Use keyboard volume changes and confirm the slider temporarily appears with the updated level.
- Use mouse hover and direct volume dragging after keyboard changes and confirm behavior still works normally.
- Press `M` to mute and unmute and confirm the prior volume level is restored visibly.

### 8. Cursor auto-hide across modes

- Verify cursor auto-hide during active playback in normal mode.
- Verify the same behavior in theater mode.
- Verify the same behavior in fullscreen mode.
- Confirm cursor reappears correctly on movement or active interaction in all modes.

## Acceptance gate

Round 5 is complete only if:

- all six requested improvements are visibly present in the running UI
- keyboard and mouse volume interactions remain compatible
- reviewer completes the runtime/browser validation sequence above
- the user can directly observe the requested control-density, control-affordance, and cursor-behavior improvements
- no regressions are introduced to previously accepted Round 4 behavior
