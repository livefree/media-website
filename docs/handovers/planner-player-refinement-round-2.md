# Planner Handoff: Player Refinement Round 2

## Task summary

Refine the `/media/[slug]` player experience to fix the current interaction regressions and satisfy the active acceptance criteria in `task.md`.

This round is limited to player/detail behavior and presentation inside the detail route. It is not a browse-shell, search, or data-architecture task.

## Owned-file boundaries

### Detail Player owned scope

- `app/media/`
- `components/player/`
- `components/detail/`
- brief `docs/dev-log.md` note for its own implementation work

### Reviewer scope

- review findings against the active task
- validate acceptance criteria and regression coverage
- do not take over implementation of Detail Player-owned files

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
- publish this handoff and implementation checklist

2. `reviewer`
- audit the current player regressions against `task.md`
- confirm the checklist is still complete before implementation starts

3. `detail-player`
- implement fixes only inside owned scope
- keep the round focused on player/detail behavior, state continuity, and mode polish

4. `reviewer`
- validate the implementation against the verification matrix below
- report any failed acceptance items or new regressions before merge

## Implementation checklist for Detail Player

- Ensure volume and speed interactions do not mutate playback progress or seek state.
- Separate volume and speed control events from timeline/progress handlers.
- Make the volume slider hidden by default and reveal it only on hover/focus of the volume control region.
- Make the volume slider slide out from the right side of the volume control and keep the volume button clickable.
- Ensure mute/unmute tooltip text and shortcut guidance match the actual current state.
- Make the speed panel smaller, semi-transparent, and anchored to the lower-right area of the player controls.
- Auto-close the speed panel on outside click and other conflicting player actions.
- Revise theater/fullscreen iconography against the provided reference asset.
- In theater/fullscreen modes, remove unrelated labels and visible borders and render non-video areas black.
- Make clicking the video surface toggle play/pause.
- Restore playback from the saved breakpoint when reopening the same media and episode.
- Render watched episodes dimmed when they are inactive.
- Preserve scroll position when switching episode or source inside the detail route.
- Avoid regressions to control-row visibility/background behavior while fixing the above items.

## Reviewer verification matrix

| Area | Expected result | Reviewer check |
| --- | --- | --- |
| Volume slider drag | Dragging volume changes volume only and never scrubs playback progress | Reproduce volume drag and confirm playback time does not jump |
| Speed interaction | Changing speed does not move playback progress | Reproduce speed change and confirm no seek side effect |
| Volume reveal behavior | Slider stays hidden until hover/focus and slides out from the right | Validate hover/focus behavior and visual direction |
| Volume button access | Volume button remains clickable and unobstructed | Toggle mute/unmute while slider is present |
| Volume tooltip copy | Tooltip text and shortcut guidance reflect mute state correctly | Check both muted and unmuted states |
| Speed panel layout | Panel is compact, semi-transparent, and lower-right anchored | Validate panel size, translucency, and anchor |
| Speed panel dismissal | Panel closes on outside click and other player actions | Open panel, click elsewhere, and trigger another control |
| Theater/fullscreen visuals | Updated icons, black non-video area, no unrelated labels/borders | Validate both theater and fullscreen modes |
| Video click toggle | Clicking video surface toggles play/pause | Reproduce from paused and playing states |
| Resume playback | Reopening same media/episode restores saved breakpoint | Leave media, reopen same target, and confirm resume |
| Watched episode styling | Watched inactive episodes are visibly dimmed | Compare active vs inactive watched episode buttons |
| Scroll preservation | Episode/source switching does not jump page to top | Switch source and episode and confirm scroll stays stable |
| Control-row regression check | Fixes do not regress control-row background/visibility behavior | Validate idle/hover/open states after all fixes |

## Acceptance gate

This round is complete only if:

- all active task acceptance items in `task.md` pass
- the three reported regressions are fixed
- no new control-row, mode, or continuity regressions are introduced
- reviewer validation passes after Detail Player implementation
