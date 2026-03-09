# Reviewer Handoff: Player Refinement Round 8

## Scope

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Runtime surface under review: `/media/[slug]`
- Validation target: `/media/the-dinosaurs`

Round 8 is intentionally narrow. Reviewer sign-off for this round is only about proving two things in runtime:

1. the played and buffered fill stay visually clipped inside the progress rail
2. the Round 7 thumb/track center-line alignment remains intact while that containment bug is fixed

This round should be rejected if the candidate solves the overflow bug by masking a larger container while quietly breaking the rail-local geometry that Round 7 established.

## Narrow Acceptance Checklist

### Required outcome

The red played fill and buffered fill must render only inside the progress rail, and the thumb must still sit on the same vertical center line as the rail.

### Pass if a tester can directly observe all of the following

1. The red played segment is confined to the rail and does not paint over the left play cluster.
2. The buffered segment is also confined to the rail and does not extend into the left control region or time display.
3. A close-up view shows the fill starting and ending within the rail bounds rather than within a larger container.
4. The left controls and time label area remain visually clean, with no large red block behind them.
5. The thumb still appears vertically centered on the rail at rest, on hover, and during a short drag.
6. The played/buffered fill remains clipped correctly before and after interacting with the progress control.

### Fail if a tester can directly observe any of the following

1. A large red or buffered block appears under the left controls or time display.
2. The fill appears to use a broader container than the rail itself.
3. The fix removes the overflow artifact but the thumb no longer shares the rail’s center line.
4. Hover or drag reveals that the fill containment is only temporarily correct.

## Runtime QA Inventory

This QA pass must be browser-based and include close-up visual inspection.

### Required browser checks

1. Open `/media/the-dinosaurs`.
2. Start playback so the played segment becomes visible.
3. Inspect the left side of the player at normal scale and confirm there is no red spill behind the play cluster or time label.
4. Hover the progress control and inspect again.
5. Drag the thumb a short distance and inspect again.
6. Wait briefly after drag and confirm the fill still remains clipped to the rail.

### Close-up verification requirement

Reviewer must not sign off from a normal-distance screenshot alone.

At least one close-up verification step is required:
- browser zoom, or
- tightly cropped screenshot, or
- equivalent magnified inspection focused on the rail plus the left control area

The close-up must make both of these judgments possible:
- whether the fill is truly clipped to the rail
- whether the thumb still shares the rail’s vertical center line

### Preservation requirement

Round 8 must preserve the accepted Round 7 alignment fix.

Reviewer must explicitly confirm:
- the thumb still sits on the rail center line
- the rail does not regress back to the old “thumb floating above track” defect
- the containment fix does not rely on a masking trick that hides the bug while leaving the rail geometry structurally wrong

## Reviewer Questions For Final Sign-Off

1. Does any red or buffered fill appear underneath the left play controls or the time display?
2. In close-up view, do the played and buffered fills stay fully inside the rail?
3. After hover and a short drag, does the fill still stay clipped inside the rail?
4. Does the thumb remain vertically centered on the rail throughout those checks?
5. Does the candidate avoid unrelated regressions to already accepted Round 6 and Round 7 behavior?

## Merge Gate

Round 8 can be accepted only if:
- reviewer completes browser runtime verification
- reviewer performs at least one close-up inspection
- the fill layers are visibly confined to the rail in rest, hover, and post-drag states
- the Round 7 thumb/track center-line alignment remains intact
- no unrelated accepted behavior regresses

Round 8 must be rejected if:
- the fill still paints a large red area over the left controls or time display
- the fill is hidden by a larger clipping trick rather than clearly belonging to the rail
- the Round 7 alignment fix regresses while solving the containment bug
