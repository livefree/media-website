# Reviewer Handoff: Player Refinement Round 5

## Scope

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Coordination rules: [AGENTS.md](/Users/livefree/projects/media-website-v2/AGENTS.md#L1)
- Runtime surface under review: `/media/[slug]`
- Validation target: `/media/the-dinosaurs`

Round 5 is a runtime- and UI-focused refinement pass. Reviewer sign-off for this round must be based on what a human tester can directly observe in the player, not on code claims alone.

## Observable Acceptance Checks For The 6 Requested Improvements

These six items are the Round 5 acceptance baseline. Each one must be visibly true in the running UI before the candidate can be accepted.

### 1. Speed panel opens lower-right and does not cover the bottom controls

Pass if a tester can observe all of the following:
- Clicking the speed button opens the speed panel in the lower-right area of the player.
- The panel does not cover or block the bottom control row while open.
- The panel remains visually attached to the control area rather than floating too high or too centrally.

Fail if any of the following is visible:
- The panel overlaps the bottom controls.
- The panel opens too high, too centrally, or detached from the lower-right control area.
- The panel interferes with clicking nearby controls.

### 2. Mute/unmute restores previous volume and keyboard volume reveal works

Pass if a tester can observe all of the following:
- Muting stores the previous non-zero volume.
- Pressing `M` to unmute restores the prior volume level instead of restoring an arbitrary default.
- Changing volume with keyboard shortcuts reveals the volume slider temporarily and shows the updated level.
- Mouse-driven volume changes still work normally after keyboard changes.

Fail if any of the following is visible:
- Unmute always returns to the same fixed volume regardless of the prior level.
- Keyboard volume changes do not reveal the slider.
- Keyboard and mouse volume behavior become inconsistent with each other.

### 3. Speed button visibly shows the current playback rate

Pass if a tester can observe all of the following:
- The speed control itself communicates the current playback rate without opening the panel.
- Changing the rate updates the value shown on the button immediately.
- The button remains readable at normal desktop width.

Fail if any of the following is visible:
- The button still shows only a generic speed icon with no visible current rate.
- The displayed rate lags behind the actual chosen rate.
- The added rate label makes the button unreadable or visually unstable.

### 4. Volume icon visibly communicates four states

Pass if a tester can observe four distinct icon states:
- Muted
- Low volume
- Medium volume
- High volume

Fail if any of the following is visible:
- Two or more volume levels look the same.
- The icon does not visibly change across the four required states.
- The muted state is ambiguous versus low volume.

### 5. Control bar is significantly more compact with corrected rail/thumb alignment

Pass if a tester can observe all of the following:
- The bottom control bar is materially shorter than the current accepted baseline and reads as compact.
- The progress rail sits at the top edge of the control-bar surface.
- The draggable progress thumb looks vertically centered on the rail rather than visually biased upward.
- The compact layout still preserves legibility and clickability.

Fail if any of the following is visible:
- The control bar still looks tall or bulky.
- The rail floats too low within the bar.
- The thumb alignment still looks vertically off.
- Tightening the bar harms usability or readability.

### 6. Idle cursor hides during active playback across all player modes

Pass if a tester can observe all of the following:
- The mouse cursor disappears while playback is active and the pointer is idle.
- Moving the pointer brings the cursor back immediately.
- Cursor hide behavior works in default mode, theater mode, and fullscreen.

Fail if any of the following is visible:
- The cursor stays visible while video plays and the pointer is idle.
- The cursor hides but does not reliably return on movement.
- Cursor hiding works only in one player mode.

## Runtime QA Inventory

Round 5 QA must emphasize visible outcomes, keyboard behavior, and mode-specific behavior.

### Core visible-outcome checks

1. Open `/media/the-dinosaurs` and begin playback.
2. Open the speed panel and compare its position against the lower-right control area.
3. Confirm the panel does not cover the bottom controls while open.
4. Inspect the speed button before and after changing rate and confirm the visible rate indicator updates.
5. Inspect the volume icon at muted, low, medium, and high levels.
6. Compare the control-bar height and rail placement against the previous baseline and confirm the bar is visibly more compact.

### Keyboard behavior checks

1. Press `M` to mute and `M` again to unmute.
2. Confirm the original non-zero volume level returns after unmute.
3. Use `ArrowUp` and `ArrowDown` for volume changes.
4. Confirm keyboard-driven volume changes temporarily reveal the slider and update the visible level.
5. Confirm mouse hover and mouse drag still work after keyboard-driven volume changes.
6. Use speed shortcuts or panel controls to change rate and confirm the speed button label updates.

### Player-mode behavior checks

1. Verify idle cursor hiding in default mode.
2. Switch to theater mode and repeat the idle cursor check.
3. Switch to fullscreen and repeat the idle cursor check.
4. Open the speed panel in each relevant mode and confirm it still stays out of the bottom controls.
5. Confirm the compact control bar remains usable in default, theater, and fullscreen modes.

### Preservation checks

Round 5 should not regress previously accepted behavior. A tester should still verify:
- Volume and speed changes do not scrub playback progress.
- Click-to-toggle on the video surface still works.
- Resume playback by media plus episode still works.
- Watched episodes still appear dimmed when inactive.
- Episode and source switching still avoid page jumps.
- The controls still auto-hide and return correctly while maintaining a black control-bar background when visible.

## Explicit Human Tester Checks

These are the direct reviewer questions for final sign-off.

1. Does the speed panel open low and right enough that the bottom controls remain usable and visible?
2. After muting, does unmuting restore the exact prior volume level instead of a generic fallback?
3. When volume changes come from the keyboard, does the slider appear so the user can see the new level?
4. Can the current playback rate be read directly from the speed button without opening the speed panel?
5. Are the four required volume icon states visibly distinct?
6. Is the control bar clearly more compact, with the rail anchored at the top edge and the thumb centered on it?
7. Does the cursor disappear while video is playing and the pointer is idle in normal, theater, and fullscreen modes?
8. Do all of the above changes remain stable without breaking previously accepted playback and navigation behavior?

## Code-Level And UX Risks Before Implementation

These risks are worth flagging before the Detail Player pass because they could lead to visually incomplete work even if the code appears technically correct.

1. The current speed panel uses a fixed popover position tied to `right` and `bottom`, so a superficial adjustment may still leave it visually overlapping or crowding the lower control region across modes. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L582).
2. The current speed control still presents a generic icon-only trigger, so adding visible rate text without redesigning button sizing and spacing may create a cramped control or inconsistent hit target. See [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L907).
3. Volume restoration currently depends on `previousVolume`, but Round 5 adds keyboard-driven reveal behavior on top of mute memory. If reveal timing and stored volume timing are not aligned, the player could restore correctly while still feeling visually broken, or vice versa. See [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L622) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L633).
4. The current volume UI still assumes a single icon treatment and a hover-expanding slider. Extending that to four clearly distinct icon states plus keyboard-triggered reveal introduces both visual-design risk and state-sync risk. See [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L121) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L837).
5. The accepted control bar already has auto-hide behavior and a black surface. Making it approximately half-height while preserving rail alignment, hit targets, and mode consistency is a high-risk density change that can easily create visual misalignment without outright breaking functionality. See [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L273), [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L298), and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L375).
6. Cursor auto-hide across default, theater, and fullscreen is partly a behavior problem and partly a perception problem. It is easy to implement a timer that hides the cursor in one mode while leaving edge cases when overlays, focus, or mode transitions occur. Reviewer QA must explicitly cover all player modes.

## Reviewer Baseline Outcome

Round 5 is a refinement round, not a rescue round. The baseline assumption is that major Round 4 blockers are resolved, but the new UI and runtime improvements still need visible proof in the product.

Reviewer expectation for the next Detail Player pass:
- optimize for clearly visible control affordance improvements
- preserve earlier accepted playback and navigation behavior
- treat keyboard, hover, and mode transitions as first-class QA surfaces
- do not claim success unless the six requested changes are directly observable in the running player
