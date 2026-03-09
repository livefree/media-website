# Planner Handoff: Player Refinement Round 3

## Task summary

Refine the `/media/[slug]` runtime player behavior to resolve the four currently reported interaction and layout regressions in `task.md`.

This round is limited to Detail Player ownership and runtime QA validation. It is not a browse-shell, search, shared-data, or architecture task.

## Owned-file boundaries

### Detail Player owned scope

- `app/media/`
- `components/player/`
- `components/detail/`
- brief `docs/dev-log.md` note for its own implementation work

### Reviewer scope

- validate the task checklist and runtime behavior against the active task
- use interactive browser checks for player interactions and overlay geometry
- do not become the implementing agent for Detail Player-owned files

### Out of scope

- `app/` outside `app/media/`
- `components/` outside `components/player/` and `components/detail/`
- `styles/`
- `data/`
- `lib/`
- `types/`
- planner/coordinator architecture and roadmap docs

## Exact execution order

1. `planner`
- publish this Round 3 handoff and acceptance framing

2. `reviewer`
- audit the current regressions
- prepare the runtime QA inventory
- confirm the acceptance checklist before implementation starts

3. `detail-player`
- implement fixes only inside owned scope
- keep changes focused on the four reported runtime issues and any directly related acceptance items

4. `reviewer`
- validate the implementation in-browser before merge
- report any remaining failures or regressions against the QA inventory and acceptance gate

## Implementation checklist for Detail Player

The implementation should address these four Round 3 runtime issues directly:

### Issue 1: slider drag still mutates playback progress

- Ensure moving the volume slider never changes playback progress.
- Ensure changing speed never changes playback progress.
- Prevent slider drag handlers from sharing or leaking into seek/progress state.
- Confirm playback cannot reset to the beginning as a side effect of volume or speed interaction.

### Issue 2: volume slider geometry is still wrong

- Make the volume slider slide smoothly out from the right side of the volume button.
- Ensure the expanding volume slider pushes the time label to the right instead of overlapping or blocking the control.
- Show only the slider itself during expansion, without an extra panel background.
- Keep the volume button clickable and unobstructed through the full hover/interaction range.

### Issue 3: control bar background and auto-hide behavior regressed

- Restore the control-bar background to black.
- Ensure the control bar hides when inactive.
- Ensure the control bar reappears on hover or active interaction.
- Prevent the control bar from permanently blocking the video surface when the player is idle.

### Issue 4: speed panel placement and treatment are still wrong

- Anchor the speed panel to the lower-right corner area of the player.
- Use the requested semi-transparent visual treatment.
- Keep the panel compact relative to the control area.
- Auto-close the panel on outside click or conflicting player actions.

### Preserve previously required behavior while fixing Round 3 issues

- Keep video-surface click-to-toggle play/pause behavior working.
- Preserve resume-from-breakpoint behavior for the same media and episode.
- Preserve watched-episode dimming for inactive watched episodes.
- Preserve scroll position when switching episode or source.
- Preserve correct tooltip text and shortcut guidance for volume hover and mute state.
- Preserve theater/fullscreen black non-video areas and cleaned-up mode visuals.

## Reviewer QA inventory requirements

Reviewer sign-off for this round must include interactive browser validation. Static code review alone is not sufficient.

### Required interactive checks

#### Slider drag checks

- Drag the volume slider and confirm playback time does not change.
- Change speed and confirm playback time does not jump or reset.
- Repeat the checks after play/pause transitions if player state affects event wiring.

#### Overlay geometry checks

- Hover/focus the volume control and confirm the slider expands from the right side of the volume button.
- Confirm the time label is pushed to the right by the expanding slider rather than overlapped.
- Confirm no extra background panel appears behind the expanded volume slider.
- Confirm the volume button remains clickable while the slider is expanded.

#### Control-bar hide/show checks

- Confirm the control bar shows on hover or active interaction.
- Confirm the control bar hides when inactive.
- Confirm the control-bar background is black when visible.
- Confirm the hidden control bar no longer blocks the video visually or interactively.

#### Speed panel placement checks

- Open the speed panel and confirm it is anchored to the lower-right area.
- Confirm the panel is smaller and semi-transparent.
- Confirm it closes on outside click.
- Confirm it also closes on other conflicting player actions when required by the current player behavior.

## Acceptance gate

Round 3 is complete only if:

- all four currently reported runtime issues are fixed
- the active acceptance criteria in `task.md` still pass after the fixes
- reviewer completes the required in-browser QA inventory
- no new regressions appear in slider behavior, overlay geometry, control-bar visibility, or speed-panel placement
