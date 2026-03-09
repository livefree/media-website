# Reviewer Handoff: Player Refinement Round 4

## Scope

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Coordination rules: [AGENTS.md](/Users/livefree/projects/media-website-v2/AGENTS.md#L1)
- Runtime surface under review: `/media/[slug]`
- Validation target for tester sign-off: `/media/the-dinosaurs`

This document is the reviewer baseline for Round 4. It defines what still counts as failing, what a human tester must be able to observe directly in the UI, and which implementation risks remain worth watching before reimplementation.

## Authoritative Round 3 Outcome

Round 3 is not accepted.

The Round 3 candidate was rejected by user review because no visible improvement was observed in the actual UI. Per the current [AGENTS.md](/Users/livefree/projects/media-website-v2/AGENTS.md#L55) and [task.md](/Users/livefree/projects/media-website-v2/task.md#L14) rules, that rejection is authoritative evidence that the requested runtime and visual changes were not successfully delivered.

For Round 4, reviewer and detail-player work must treat the previously claimed fixes as unproven and the reported regressions as still open.

## Open Regressions Still Failing

The following four regressions remain open and should be treated as current failures until a human tester can observe them working in the product:

1. Dragging the volume slider still affects playback progress and may reset playback to the beginning.
2. The volume slider geometry is still wrong. It is not yet visibly behaving like a right-expanding slider attached to the volume button, and the requested time-label push behavior is not yet accepted as delivered.
3. The control bar background and inactivity behavior are still wrong. The bar has not yet been accepted as black, auto-hiding, and non-obstructive to video viewing.
4. The speed panel placement and treatment are still wrong. It has not yet been accepted as visibly lower-right and semi-transparent in the live UI.

## Runtime QA Inventory Centered On Observable UI Outcomes

Reviewer sign-off for Round 4 must be based on things a human tester can directly see, feel, or reproduce in the running player. Code claims alone are not evidence.

### Test setup

1. Open `/media/the-dinosaurs`.
2. Use desktop width first.
3. Let video playback actually begin before testing sliders and overlays.
4. Keep the current time and progress rail visible while testing.
5. Repeat the most important checks from both paused and playing states.

### Observable outcome checks

#### 1. Slider drag isolation

Tester action:
- Start playback.
- Note the current time.
- Drag the volume slider across several positions.
- Open speed controls and change playback speed.

What must be visibly true:
- The progress bar does not jump.
- The current time does not reset.
- Playback does not suddenly seek backward or return to `0:00`.
- Only volume changes during volume drag.
- Only playback speed changes during speed adjustment.

#### 2. Volume slider reveal and layout behavior

Tester action:
- Hover the volume button.
- Keep the pointer within the volume control area while watching the time label.
- Move away and repeat.

What must be visibly true:
- The slider emerges from the right edge of the volume button.
- The volume button remains clickable while the slider is open.
- The time label is pushed to the right by the slider expansion instead of being overlapped.
- The reveal looks attached to the volume control, not like a detached floating widget.
- When hover leaves the control region, the slider collapses cleanly.

#### 3. Volume slider visual treatment

Tester action:
- Hover the volume control and inspect the revealed slider carefully.

What must be visibly true:
- Only the slider track and thumb appear.
- No separate background panel, rounded pill, floating card, or dark capsule appears behind the slider.

#### 4. Control bar visibility and background

Tester action:
- Move the pointer off the controls and leave the player idle.
- Move the pointer back over the player and interact again.

What must be visibly true:
- The controls disappear when the player is inactive.
- The controls come back when the player is hovered or actively used.
- When visible, the control bar background reads as black.
- When hidden, the controls no longer cover or visually block the video.

#### 5. Speed panel placement and treatment

Tester action:
- Open the speed panel from the speed button.
- Compare its position to the control row and the lower-right corner area of the player.
- Click outside and reopen it.

What must be visibly true:
- The panel opens in the lower-right area of the player controls.
- It looks compact rather than oversized.
- It looks semi-transparent rather than opaque and heavy.
- It closes on outside click.
- It also closes when another conflicting player action is triggered.

#### 6. Preservation checks

Tester action:
- Click the video surface.
- Watch part of the episode and reload.
- Observe inactive watched episodes.
- Switch episode and source selections.

What must be visibly true:
- Clicking the video still toggles play and pause.
- Resume playback still restores the same media and episode from the saved point.
- Inactive watched episodes still look dimmed.
- Changing episode or source does not jump the page to the top.

## Human Acceptance Checks

These checks are intentionally written so a human tester can verify them without reading code or inspecting internals.

### Pass criteria

Round 4 can be accepted only if a tester can directly observe all of the following:

1. Moving the volume slider never changes playback progress or resets the time.
2. Changing playback speed never changes playback progress or resets the time.
3. The volume slider opens from the right side of the volume button.
4. The opening volume slider visibly pushes the time label to the right.
5. The open volume slider does not show a separate background panel.
6. The control bar becomes hidden when the player is inactive.
7. The control bar reappears when the player is hovered or interacted with.
8. The visible control bar background is black.
9. The speed panel appears in the lower-right area and looks semi-transparent.
10. Previously preserved behaviors still work in the running product: click-to-toggle, resume by media plus episode, watched-episode dimming, and no page jump on episode or source switching.

### Fail criteria

Round 4 remains rejected if a tester observes any of the following:

1. Slider interaction moves or resets playback time.
2. The volume slider overlaps the time label instead of pushing it.
3. The volume slider appears as a floating panel or capsule rather than just the slider.
4. The control bar stays on screen while idle.
5. The visible control bar background is not black.
6. The speed panel still looks too high, too central, too large, or too opaque.
7. Any previously preserved behavior breaks while chasing the new fixes.
8. A reviewer or user still cannot see the requested improvement in the actual UI.

## Code-Level Risks Before Reimplementation

These code-level risks are worth flagging up front because they align with the user-reported failures and could easily survive another implementation attempt if not handled deliberately.

1. The current volume slider is still implemented as an absolutely positioned `.playerVolumePanel` with its own `background` and `box-shadow`, which matches the “floating panel” failure mode rather than the requested bare slider reveal. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L454).
2. The current primary control row and time label layout do not obviously encode a push-right expansion relationship, so the requested “slider expands and pushes the time label right” behavior is still structurally at risk. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L350), [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L360), and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L761).
3. The player chrome still uses a full overlay with a persistent gradient background and there is no visible inactivity-state class or timer wiring in the current player shell, so the requested black auto-hide control bar remains a direct implementation risk. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L273) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L715).
4. The speed panel is still styled as a popover positioned above the trigger using `bottom: calc(100% + 8px)`, which can continue to read as “floating above controls” instead of “lower-right anchored” unless the visual treatment changes more decisively. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L543).
5. The current seek, volume, and speed handlers are separate in code, but the user's repeated rejection means handler separation alone has not been sufficient evidence of correct UI behavior. Real interaction geometry and user-visible outcomes must drive acceptance. See [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L574), [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L585), and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L608).

## Reviewer Baseline Outcome

Round 4 starts from a failed user-visible baseline, not from a presumed near-complete implementation.

Reviewer expectation for the next detail-player pass:

- treat all four regressions as still failing
- optimize for clearly observable UI change rather than internal code claims
- plan browser validation around what a human tester can immediately see
- do not represent the candidate as accepted unless the requested changes are visibly working in the running product
