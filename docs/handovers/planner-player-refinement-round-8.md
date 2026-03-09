# Planner Handoff: Player Refinement Round 8

## Task summary

Round 8 is a narrow follow-up to the accepted Round 7 progress-control alignment fix. The only issue in scope is that the custom played and buffered fill layers escaped the rail-local positioning context and now paint a large red block over the left controls.

This round must restore rail-local containment for the fill layers while preserving the accepted Round 7 result where the custom track and native thumb share the same vertical center line.

## Exact owned-file boundaries

### Detail Player owned scope

- `app/media/`
- `components/player/`
- `components/detail/`

### Reviewer scope

- runtime/browser validation only
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
- confirm the containment regression and prepare the runtime QA sequence

3. `detail-player`
- restore a rail-local positioning context for the custom played and buffered fill layers
- preserve the existing Round 7 thumb/track center-line alignment

4. `reviewer`
- validate the result in-browser before merge

## Detail Player implementation checklist

### 1. Restore rail-local fill containment

- Re-anchor the played and buffered fill layers to the progress rail so they render only inside the rail bounds.
- Remove the condition where the fill layers paint across the left controls or time display area as a large red block.

### 2. Preserve Round 7 alignment

- Keep the Round 7 structural thumb/track center-line alignment intact.
- Do not reintroduce the old vertical mismatch while fixing fill containment.

### 3. Do not broaden the fix

- Treat this as a local progress-rail positioning bug.
- Do not change unrelated player behavior or use a broader container-level masking workaround that hides the symptom without restoring true rail-local fill positioning.

## Reviewer validation sequence

### 1. Left-side spill check

- Open the `/media/[slug]` player in the browser.
- Confirm the red played or buffered fill no longer paints over the left controls or time display area.

### 2. Rail containment check

- Inspect the progress rail closely in the running UI.
- Verify the played and buffered fills remain visually clipped to the rail itself.

### 3. Interaction check

- Hover and drag the progress thumb briefly.
- Confirm the fill stays inside the rail during and after interaction.

### 4. Round 7 regression guard

- Verify the thumb still sits on the same vertical center line as the track.

## Acceptance gate

Round 8 passes only if:

- the played and buffered fill layers stay inside the rail
- no large red fill block appears over the left controls
- the Round 7 thumb/track center-line alignment remains intact
- reviewer confirms the result in the browser

Round 8 fails if the fill still spills into the left control area or if the containment fix regresses the accepted Round 7 alignment.
