# Reviewer Acceptance: Player Refinement Round 6

## Decision

Reject.

This candidate is **not yet safe to merge to `main`**.

Reason: the Round 6 reviewer baseline in [docs/handovers/reviewer-player-refinement-round-6.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-player-refinement-round-6.md#L1) requires runtime validation of visible behavior, and this acceptance pass did not include an in-browser verification environment. The code changes appear directionally aligned with the six requested fixes, but reviewer acceptance cannot be granted without the required runtime QA.

Reviewed candidate:
- Branch: `codex/detail-player-refinement-round-6`
- Commit: `0e9ca92`

## Requested Fix Assessment

### 1. Remove the redundant volume meter from the volume button

Status: `Code appears fixed, runtime unverified`

What changed:
- The extra `.playerVolumeMeter` markup was removed from the volume button in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L977).
- The corresponding `.playerVolumeMeter*` styles were removed from [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L455).

Acceptance risk:
- The button now relies solely on the icon, which is correct directionally, but I did not verify in-browser that the button remains immediately readable at runtime.

### 2. Reduce the volume slider thumb so it matches the progress-thumb diameter

Status: `Code appears fixed, runtime unverified`

What changed:
- The progress thumb is `14px` in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L360).
- The volume thumb is now also `14px` in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L601).

Acceptance risk:
- The raw dimensions now match in code, but visual parity still needs browser confirmation because shadow treatment and track geometry can still make equal sizes look mismatched.

### 3. Vertically center the progress thumb on the track

Status: `Code appears fixed, runtime unverified`

What changed:
- The progress thumb `margin-top` changed from a negative offset to `0` in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L360).
- The progress rail remains centered via the track positioning in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L325).

Acceptance risk:
- This is a highly visual alignment fix. It may be correct in code and still appear slightly high or low in the browser, especially during drag. Runtime inspection is still required.

### 4. Vertically center the fullscreen video

Status: `Code appears fixed, runtime unverified`

What changed:
- The fullscreen wrapper now uses `display: grid` and `place-items: center` in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L230).
- The immersive viewport sizing remains defined in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L247).

Acceptance risk:
- Fullscreen centering is mode-specific. The code is plausible, but acceptance still requires an actual fullscreen browser check.

### 5. Align the speed popup to the player right edge without incorrect control-bar overlap

Status: `Partially fixed in code, runtime still required`

What changed:
- The speed panel was moved out of the speed button dock and rendered as a sibling under the chrome surface in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1059).
- It is now positioned from the chrome surface with `right: 12px` and `bottom: 76px` in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L641).

Remaining concern:
- This no longer tracks the speed button edge directly, which is the right structural change.
- However, it is still inset from the chrome surface with a hard-coded offset, so I cannot confirm from code alone that it visually aligns to the player right edge in the way Round 6 requires, or that it fully avoids awkward overlap with the bottom controls in all relevant view states.

### 6. Ensure the play/pause tooltip is fully visible and not clipped on the left

Status: `Code appears fixed, runtime unverified`

What changed:
- The play/pause control now uses `align="start"` in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L933).
- The new `.playerTooltipStart` left-edge alignment rules are defined in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L480).

Acceptance risk:
- This is the right directional fix, but tooltip clipping is inherently runtime-visible and still needs browser confirmation in default, theater, and fullscreen states.

## Blocking Findings

### 1. Reviewer acceptance cannot be granted without the required runtime QA

Severity: High

The active Round 6 baseline explicitly requires runtime-visible acceptance checks for all six polish items. This pass reviewed the candidate code, but did not verify the player in a browser. Under the repository rules, that means the candidate cannot be accepted or described as safe to merge yet.

Evidence:
- [docs/handovers/reviewer-player-refinement-round-6.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-player-refinement-round-6.md#L1)
- [AGENTS.md](/Users/livefree/projects/media-website-v2/AGENTS.md#L55)

### 2. Speed popup edge alignment still has unresolved runtime risk

Severity: Medium

The popup is structurally improved because it is no longer anchored inside the speed button dock, but the current positioning still uses a fixed inset from the chrome surface. That may be correct, but from code review alone I cannot confirm the requested “player right edge” alignment or that the popup clears the control bar correctly in runtime.

Evidence:
- [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1059)
- [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L641)

## Merge Recommendation

Do not merge to `main` yet.

Next step:
- Run the Round 6 reviewer checklist from [docs/handovers/reviewer-player-refinement-round-6.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-player-refinement-round-6.md#L1) in a browser against `/media/the-dinosaurs`.
- If the runtime checks pass, this candidate is likely close to acceptable.
- If the speed popup still looks inset or overlapping in-browser, that should remain a blocking UI finding.
