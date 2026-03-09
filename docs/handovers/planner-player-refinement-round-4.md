# Planner Handoff: Player Refinement Round 4

## Task summary

Player Refinement Round 4 exists because the Round 3 candidate was **rejected by user review**. The user reported no observable improvement, so all four reported runtime regressions remain open and must be treated as unresolved.

This round is limited to `/media/[slug]` player/detail behavior. It is not a browse-shell, search, shared-data, or architecture task.

## Exact owned-file boundaries

### Detail Player owned scope

- `app/media/`
- `components/player/`
- `components/detail/`
- brief `docs/dev-log.md` note for its own implementation work

### Reviewer scope

- runtime/browser validation against the active task
- user-visible acceptance framing against the reported regressions
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
- publish this Round 4 handoff

2. `reviewer`
- confirm the four reported regressions are still the active issue set
- prepare the runtime/browser QA sequence
- align acceptance framing with the user-visible outcomes below

3. `detail-player`
- implement fixes only inside owned scope
- optimize for visible behavior changes, not internal refactor claims

4. `reviewer`
- validate the result in-browser
- frame the result in terms the user can directly observe
- fail the candidate if the requested changes are still not visibly working

## Detail Player checklist

The implementation must be judged by observable outcomes, not by internal intent or code structure.

### 1. Slider drag must visibly stop affecting playback progress

- Dragging the volume slider must not move playback progress.
- Changing speed must not move playback progress.
- The playback position must not jump or reset to the beginning while adjusting volume or speed.
- This must be visibly true in the running UI, not just theoretically isolated in code.

### 2. Volume slider geometry must visibly match the requested interaction

- The volume slider must appear only on hover/focus of the volume control region.
- The slider must slide out smoothly from the **right side** of the volume button.
- As it expands, the time label must visibly move to the right instead of being overlapped.
- The expanded state must show only the slider itself, not a separate panel background.
- The volume button must remain visibly clickable and unobstructed during the interaction.

### 3. Control bar must visibly return to the requested idle behavior

- The control bar background must be black when shown.
- The control bar must hide when inactive.
- The control bar must reappear on hover or active interaction.
- In the inactive state, the control bar must no longer visibly sit over and block the video.

### 4. Speed panel must visibly match the requested placement and treatment

- The speed panel must appear in the lower-right corner area of the player.
- The panel must be smaller and semi-transparent.
- The panel must not appear misplaced relative to the controls.
- The panel must close on outside click or conflicting player actions.

### 5. Preserve the previously requested visible behavior

- Clicking the video surface still toggles play/pause.
- Resume playback still restores the saved breakpoint for the same media/episode.
- Watched inactive episodes remain dimmed.
- Episode/source switching still preserves scroll position.
- Volume hover/mute tooltip text still reflects the current visible state.
- Theater/fullscreen visuals still preserve black non-video areas and cleaned-up labels/borders.

## Reviewer validation sequence

Reviewer sign-off for Round 4 must be based on runtime/browser validation and described in user-visible terms.

### Step 1: Reproduce the four reported regressions first

- Confirm whether volume slider drag still changes playback progress.
- Confirm whether speed changes still change playback progress.
- Confirm whether the volume slider geometry is still wrong in the actual player.
- Confirm whether the control bar still remains visibly present when it should hide.
- Confirm whether the speed panel still appears in the wrong place or with the wrong treatment.

### Step 2: Run interactive browser checks

#### Slider drag checks

- Drag the volume slider while monitoring playback time.
- Change speed while monitoring playback time.
- Repeat after play/pause transitions if control state can affect behavior.

#### Overlay geometry checks

- Hover/focus the volume control and inspect slider expansion direction.
- Verify the time label visibly shifts right as the slider expands.
- Verify there is no extra panel background behind the expanded slider.
- Verify the volume button remains clickable while expanded.

#### Control-bar hide/show checks

- Verify control bar is visible on hover or active interaction.
- Verify control bar hides when inactive.
- Verify its visible background is black.
- Verify the inactive state no longer blocks the video visually.

#### Speed panel placement checks

- Open the speed panel and verify lower-right placement.
- Verify compact size and semi-transparent treatment.
- Verify outside click closes it.
- Verify conflicting player actions close it when expected.

### Step 3: Final user-visible acceptance framing

Reviewer must describe the result in terms of what the user can actually see:

- “The playback time no longer moves when adjusting volume or speed.”
- “The volume rail now slides out from the right of the volume button and pushes the time label aside.”
- “The control bar now hides when idle and returns with a black background on interaction.”
- “The speed panel now sits in the lower-right area with the requested semi-transparent styling.”

If reviewer cannot honestly state those outcomes after runtime validation, the candidate is not ready.

## Acceptance gate

Round 4 is complete only if:

- all four currently reported regressions are visibly fixed in the running UI
- reviewer completes runtime/browser validation
- reviewer can describe the fixes as user-visible observable improvements
- the candidate still satisfies the active task acceptance criteria in `task.md`
- the user can actually see the requested changes

The candidate fails if:

- reviewer validation is incomplete
- fixes exist only as internal intent and are not visible in the UI
- the user still cannot observe the requested changes after the update
