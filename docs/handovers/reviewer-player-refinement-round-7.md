# Reviewer Handoff: Player Refinement Round 7

## Scope

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Runtime surface under review: `/media/[slug]`
- Validation target: `/media/the-dinosaurs`

Round 7 is intentionally narrow. Reviewer sign-off for this round is only about one thing: proving in runtime that the custom-rendered progress track and the native draggable thumb share the same vertical center line.

This round must not be diluted by unrelated player polish. The reviewer should reject any candidate that appears to fix the rail by coincidence or browser-specific offset luck rather than by structurally aligning the rendered track and thumb.

## Narrow Acceptance Checklist

### Required outcome

The progress track and the native thumb must render on the same vertical center line in the actual browser UI.

### Pass if a tester can directly observe all of the following

1. At normal playback state, the thumb appears centered on the track rather than floating above it.
2. While hovering the progress control, the thumb still appears centered on the track.
3. While dragging the thumb, the track and thumb remain centered against each other instead of visually separating.
4. In close-up inspection, the thumb center visually intersects the track center line.
5. The alignment still looks correct after the page settles and after a short drag interaction, not just in one static frame.

### Fail if a tester can observe any of the following

1. The thumb still looks vertically high relative to the track.
2. The thumb looks centered only from a distance, but close-up inspection shows the centers do not actually line up.
3. Hover state or drag state reveals that the alignment is only approximate.
4. The candidate relies on a compensating offset that looks correct in one state but drifts in another.

## Structural Alignment Versus Coincidental Offset

Reviewer must explicitly distinguish these two outcomes:

### Acceptable structural alignment

- The track and thumb read as sharing one vertical axis in rest, hover, and drag states.
- The alignment remains stable when zooming in or taking a close-up screenshot.
- There is no sense that one element was merely nudged until it “looked close enough.”

### Unacceptable coincidental offset

- The alignment looks correct only at one zoom level or in one captured state.
- The thumb center and track center diverge during drag.
- The track appears centered only because one element was shifted independently while the native thumb still follows a different geometry model.
- The control would likely break again across browsers or slight CSS changes because the apparent fix is compensating rather than structural.

## Runtime QA Inventory

This QA pass must use browser runtime inspection, not code review alone.

### Required browser checks

1. Open `/media/the-dinosaurs`.
2. Begin playback so the progress control is active and visually meaningful.
3. Inspect the progress rail at standard page scale.
4. Hover the progress control and inspect again.
5. Drag the thumb a short distance and inspect during or immediately after drag.
6. Perform a close-up verification using browser zoom, devtools magnification, or a tightly cropped screenshot.

### Close-up verification requirement

Reviewer must not sign off using only a normal-distance screenshot.

At least one close-up verification step is required:
- browser zoom, or
- high-resolution cropped screenshot, or
- equivalent magnified inspection that makes the thumb center line and track center line easy to judge

If the candidate only “looks about right” at normal scale, that is not enough.

### State coverage requirement

Reviewer must inspect alignment in all of these states:
- idle/rest state
- hover state
- active drag state or immediately post-drag state

If one of those states is not checked, the review is incomplete.

## Reviewer Questions For Final Sign-Off

1. Does the thumb visually sit on the exact center of the progress track at rest?
2. Does that same center-line relationship remain true on hover?
3. Does that same center-line relationship remain true during drag?
4. Does a close-up view confirm the alignment, not just a normal-distance impression?
5. Does the candidate avoid unrelated regressions to already accepted Round 6 behavior while making this focused geometry fix?

## Merge Gate

Round 7 can be accepted only if:
- reviewer completes runtime browser verification
- reviewer performs at least one close-up inspection
- the thumb and track still share one center line in rest, hover, and drag states
- no unrelated Round 6 behavior regresses

Round 7 must be rejected if:
- the apparent fix depends on a visual nudge that does not hold across interaction states
- the review lacks close-up runtime evidence
- the candidate changes unrelated player behavior while chasing the rail geometry issue
