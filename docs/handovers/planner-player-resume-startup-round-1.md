# Planner Handoff: Player Resume And Startup Round 1

## Task summary

Player Resume And Startup Round 1 is a narrow playback-behavior refinement.

It changes only:

- when a resume point should be saved
- when a resume point should be dropped
- how resume time should be rounded
- how the player should behave on initial watch-page startup
- how preload/buffering should behave when a valid resume point exists

It does not authorize a broader player redesign.

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- implement the resume/startup behavior changes inside the existing watch/player surface

3. `reviewer`
- validate resume rules, startup behavior, and playback continuity before merge

## Ownership boundaries

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

Detail Player owns the actual resume persistence logic, startup behavior, and any player-local state transitions needed to satisfy this round.

### Reviewer scope

- docs and runtime/browser validation only
- no implementation takeover of Detail Player files

### Out of scope

- player visual redesign
- new controls or overlays
- data-catalog rewrites
- auth or server-backed progress sync
- admin tooling
- subtitle/danmaku systems
- broader queue/list redesign
- unrelated watch-page layout changes

## Exact resume save/drop rules

## Save window rule

A resume point is valid only inside the resumable window:

- at or after 30 seconds from the start
- more than 30 seconds away from the end

Expressed directly:

- do not save if `currentTime < 30`
- do not save if `duration - currentTime <= 30`

## First 30 seconds rule

If the user exits within the first 30 seconds:

- do not keep a resume point
- if a stored resume exists for that media/episode, it should be cleared or replaced with a non-resume state
- reopening should behave like a fresh start, not a resume

## Final 30 seconds rule

If the user exits within the final 30 seconds:

- treat the item as completed
- do not keep a resume point
- reopening should not resume from the end region

This is a completion case, not a resumable case.

## Short-media edge case

If the total duration is 60 seconds or less, there is no valid resumable middle window.

For this round, the safe rule is:

- treat media with `duration <= 60` as non-resumable
- either it is fresh-start or completed, but not resumable

This prevents overlap between the first-30s and last-30s exclusion rules.

## 5-second snapping rule

Persisted resume points must snap to 5-second precision.

Recommended exact rule:

- snap downward to the nearest 5-second boundary before persisting

Examples:

- `32s -> 30s`
- `34s -> 30s`
- `37s -> 35s`
- `59s -> 55s`

Rationale:

- snapping downward avoids resuming ahead of what the user definitely watched
- it produces deterministic local resume state and stable QA expectations

## Resume persistence rule after snapping

The save/drop decision should be made against the effective persisted time, not only the raw time.

Recommended sequence:

1. read raw `currentTime` and `duration`
2. reject resume if the item is in the first 30 seconds
3. reject resume and mark completed if the item is in the final 30 seconds
4. otherwise snap downward to the nearest 5-second boundary
5. persist that snapped value

If snapping would move the saved value below 30 seconds, treat it as no-resume.

## Startup behavior

## No-autoplay rule

Entering the watch page must not auto-play video.

Required user-visible behavior:

- the player may load media and prepare it
- the player may restore the correct startup position
- playback must remain paused until explicit user interaction

Explicit user interaction includes:

- pressing the play button
- clicking the video surface to play
- using an allowed keyboard play action once focus/input rules permit it

## Startup state with no valid resume

If there is no valid resume point:

- the player loads in paused state
- startup position is time `0`
- preload may still occur

## Startup state with a valid resume

If a valid resume point exists:

- the player loads in paused state
- startup position should resolve to the snapped resume point
- first playback after user action should begin from that snapped resume point, not from time `0`

## Preload and buffering behavior

## Allowed preload behavior

Round 1 allows preload/buffering before the user presses play.

That means:

- metadata may load
- the video element may buffer while paused
- the player may prepare the media state ahead of first play

## Resume-aware preload rule

When a valid resume point exists:

- preload/startup preparation should bias from the resume point rather than from time `0`

In practical terms, this means:

- the media may seek to the resume point during startup preparation once metadata is ready
- buffering/preparation should be aligned to that restored point
- the player must still remain paused

## What is not required

Round 1 does not require:

- guaranteed full buffer completion before play
- a visible resume prompt UI
- network-level preload optimization beyond what the browser/player can already do

The requirement is correct paused startup position with resume-aware preparation, not an advanced buffering system.

## Detail Player implementation checklist

- Apply the first-30s no-save rule.
- Apply the last-30s completed/no-resume rule.
- Snap persisted resume points downward to 5-second precision.
- Ensure invalid resume points are cleared instead of reused.
- Ensure startup enters paused state on watch-page entry.
- If a valid resume exists, restore paused startup position at the snapped resume point.
- Bias preload/buffering from that resume point when startup preparation occurs.
- Keep existing canonical watch routing and list-aware behavior intact.
- Do not broaden into visual or control-surface redesign.

## Reviewer validation sequence

Reviewer sign-off must be based on runtime/browser behavior.

### Test setup

- use a representative direct-play title or episode with a stable local/demo-backed source
- clear local progress for the target media/episode before each scenario as needed

### 1. First 30 seconds rule

- play the media
- exit before 30 seconds, for example around `25s`
- reopen the same watch entry
- confirm there is no resumed startup point and playback starts paused from fresh-start state

### 2. Middle-window save rule with 5-second snapping

- play to a resumable time such as `32s`, exit, reopen
- confirm the restored paused startup position is `30s`
- repeat with another time such as `37s`
- confirm the restored paused startup position is `35s`

### 3. Final 30 seconds rule

- play into the final 30 seconds of the item, exit, reopen
- confirm the item is treated as completed / no-resume
- confirm startup does not restore into the end region

### 4. No-autoplay startup rule

- open the watch page with and without a valid resume point
- confirm the player does not begin playback automatically
- confirm playback begins only after explicit user interaction

### 5. Resume-aware preload rule

- create a valid resume point
- reopen the watch page
- confirm the player loads paused near the snapped resume position rather than time `0`
- confirm first play starts from that restored position

### 6. Regression guard

- confirm episode navigation still works
- confirm canonical watch/list behavior still works
- confirm no unrelated player UI regression was introduced as part of this narrow behavior change

## Acceptance criteria

Round 1 passes only if:

- resume points are never kept for exits within the first 30 seconds
- exits within the final 30 seconds are treated as completed and do not keep a resume point
- persisted resume points snap downward to 5-second precision
- entering the watch page does not auto-play
- when a valid resume exists, startup remains paused but prepares from the snapped resume point rather than time `0`
- reviewer confirms the rules above without regressions to existing watch/list behavior

Round 1 fails if:

- a first-30s exit still restores a resume point
- an end-of-video exit still restores a resume point
- stored resume times are not consistently snapped to 5-second precision
- the watch page auto-plays on entry
- a valid resume still starts buffering/restoring from time `0`
- the change broadens into unrelated player redesign work

## Recommendation summary

This round should be treated as a deterministic resume-policy and startup-policy pass:

- strict first-30s and last-30s exclusion
- 5-second persisted precision
- paused startup always
- resume-aware preload only when a valid resume exists

That is enough to satisfy the requested behavior without turning the task into a larger player rewrite.
