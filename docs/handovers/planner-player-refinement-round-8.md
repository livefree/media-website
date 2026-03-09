# Planner Handoff: Player Refinement Round 8

## Task summary

Player Refinement Round 8 is a containment-only follow-up after the accepted Round 7 alignment fix. The remaining regression is that the custom played and buffered fill layers lost the correct rail-local positioning context and now spill out of the progress rail into the left control cluster as a large red block.

This round must restore proper fill containment inside the rail while preserving the Round 7 result where the native thumb and the custom track share the same vertical center line. The fix must target the local positioning-context bug inside the progress control itself, not hide the symptom with overflow clipping on a larger unrelated container.

## Exact owned-file boundaries

### Detail Player owned scope

- `app/media/`
- `components/player/`
- `components/detail/`
- brief `docs/dev-log.md` note for its own implementation work

### Reviewer scope

- runtime/browser validation against the active Round 8 task
- close-up visual inspection of the progress rail and surrounding left control area
- acceptance framing in visible user-facing terms
- no implementation takeover of Detail Player-owned files

### Out of scope

- `app/` outside `app/media/`
- `components/` outside `components/player/` and `components/detail/`
- `styles/`
- `data/`
- `lib/`
- `types/`
- unrelated changes to volume, speed, fullscreen, tooltip, or other accepted Round 6 and Round 7 behavior

## Concrete execution order

1. `planner`
- publish this Round 8 handoff

2. `reviewer`
- confirm the containment regression and prepare the browser QA sequence

3. `detail-player`
- implement only inside owned scope
- restore rail-local containment for the custom played and buffered fill layers
- preserve the existing Round 7 thumb/track center-line alignment

4. `reviewer`
- validate the result in-browser before merge
- report pass/fail in visible UI terms, not implementation intent

## Detail Player implementation checklist

### 1. Restore rail-local fill containment

- Re-establish the correct local positioning context for the custom played and buffered fill layers.
- Ensure both fill layers render only inside the visible progress rail instead of expanding into the left control cluster or time display area.

### 2. Preserve the accepted Round 7 geometry

- Keep the Round 7 structural thumb/track center-line alignment intact.
- Do not reintroduce separate vertical alignment math that causes the thumb to drift above or away from the track center.

### 3. Fix the actual containment bug, not a larger-container symptom

- Treat this as a progress-control-local positioning problem.
- Do not solve it by clipping overflow on a wider parent container that merely hides the red block while leaving the fill layers incorrectly scoped.
- The fill system should inherit or anchor to the rail-local geometry that defines the visible progress control.

### 4. Keep this pass isolated

- Do not change volume behavior.
- Do not change speed popup behavior.
- Do not change fullscreen behavior.
- Do not change tooltip behavior.
- Keep this round focused on fill containment inside the rail.

## Reviewer validation sequence

Reviewer sign-off must come from runtime/browser verification, not code inspection alone.

### 1. Baseline control-bar inspection

- Open the `/media/[slug]` player and inspect the progress control plus the left control cluster.
- Confirm whether any red played or buffered fill is visibly spilling into the control buttons or time display region.

### 2. Close-up rail containment check

- Perform a close-up browser inspection of the progress rail.
- Verify that the played and buffered fills are visually clipped to the rail itself and do not render outside the rail bounds.

### 3. Interaction check across progress states

- Scrub or click across multiple progress positions.
- Confirm the played and buffered layers stay contained inside the rail while updating.
- Confirm the large red block does not reappear in the left control area during interaction.

### 4. Round 7 alignment regression guard

- Verify the native thumb still shares the same vertical center line as the custom track.
- Confirm the thumb still sits on the track center after the containment fix.

### 5. Unrelated regression guard

- Verify there are no visible regressions to accepted Round 6 and Round 7 behavior for volume, speed, fullscreen, or tooltip interactions.

## Acceptance gate

Round 8 passes only if:

- the played and buffered fill layers remain visually contained inside the progress rail
- no large red block appears in the left control cluster or time display area
- the Round 7 thumb/track center-line alignment remains intact
- reviewer confirms the result through close-up browser inspection and interactive progress checks
- no unrelated accepted Round 6 or Round 7 behavior regresses

Round 8 fails if the fill is merely hidden by broader overflow clipping, if the left side of the control bar still shows fill spill, or if preserving containment breaks the accepted Round 7 track/thumb alignment.
