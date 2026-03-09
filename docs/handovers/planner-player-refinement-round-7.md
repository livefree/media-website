# Planner Handoff: Player Refinement Round 7

## Task summary

Player Refinement Round 7 is a single-issue follow-up after the accepted Round 6 player polish. The only remaining defect is the visible geometry mismatch between the custom progress track and the native range thumb in the `/media/[slug]` player UI.

This round is successful only if the rendered progress rail and the draggable thumb share the same vertical center line in the actual browser UI. The handoff intentionally discourages fragile offset nudges and instead requires a structural alignment fix between the custom-rendered rail and the native thumb system.

## Exact owned-file boundaries

### Detail Player owned scope

- `app/media/`
- `components/player/`
- `components/detail/`
- brief `docs/dev-log.md` note for its own implementation work

### Reviewer scope

- runtime/browser validation against the active Round 7 task
- close-up visual inspection of the progress control
- acceptance framing in visible user-facing terms
- no implementation takeover of Detail Player-owned files

### Out of scope

- `app/` outside `app/media/`
- `components/` outside `components/player/` and `components/detail/`
- `styles/`
- `data/`
- `lib/`
- `types/`
- unrelated adjustments to volume, speed, fullscreen, tooltip, or other accepted Round 6 behavior

## Concrete execution order

1. `planner`
- publish this Round 7 handoff

2. `reviewer`
- confirm the single remaining issue
- prepare the runtime QA sequence focused on real browser rendering of the progress control

3. `detail-player`
- implement only inside owned scope
- fix only the structural center-line alignment issue described below

4. `reviewer`
- validate the result in-browser before merge
- report pass/fail in visible UI terms, not implementation intent

## Detail Player implementation checklist

### 1. Fix the actual rendered center-line mismatch

- Make the custom progress track and the native range thumb render on the same vertical center line in the live player UI.
- The thumb must visibly sit on the center of the track at rest and while dragging.

### 2. Use a structural alignment fix, not a fragile nudge

- Treat this as a structural integration problem between two rendering systems: the custom rail and the native range/thumb.
- Do not rely on one-off top, translate, margin, or similar magic-number nudges that only mask the mismatch in one state or one browser rendering path.
- The chosen approach should make the track and thumb share the same geometry reference rather than manually offsetting one against the other.

### 3. Preserve accepted Round 6 behavior

- Do not change volume behavior.
- Do not change speed popup behavior.
- Do not change fullscreen centering.
- Do not change tooltip behavior.
- Keep this round isolated to the progress-control alignment defect.

## Reviewer validation sequence

Reviewer sign-off must come from runtime/browser verification, not from code inspection alone.

### 1. Baseline visual inspection

- Open the `/media/[slug]` player in the browser and inspect the progress control at rest.
- Confirm whether the rail and thumb share one visible vertical center line.

### 2. Interactive drag verification

- Drag the progress thumb across multiple positions on the rail.
- Confirm the thumb remains visually centered on the rail while moving, not just at one static point.

### 3. Close-up geometry check

- Perform a close-up visual inspection of the progress control in the rendered browser UI.
- Validate that the thumb no longer appears above the rail and that both elements read as one centered control.

### 4. Regression guard

- Verify there are no visible regressions to accepted Round 6 behavior for volume, speed, fullscreen, or tooltip interactions.

## Acceptance gate

Round 7 passes only if:

- the rendered progress track and native range thumb visibly share the same vertical center line
- the thumb visibly sits on the track center instead of above it
- reviewer confirms this through interactive browser checks and close-up visual inspection
- the fix reads as a structural alignment correction rather than a fragile offset nudge
- no unrelated accepted Round 6 behavior regresses

Round 7 fails if the user can still see the thumb riding above the track or if the apparent fix depends on browser-fragile offset tweaking rather than real center-line alignment.
