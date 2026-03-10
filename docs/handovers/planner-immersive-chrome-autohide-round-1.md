# Planner Handoff: Immersive Chrome Auto-Hide Round 1

## Task summary

Immersive Chrome Auto-Hide Round 1 is a narrow timing-and-synchronization pass for theater mode and fullscreen mode only.

This round must ensure that after 3 seconds of inactivity in immersive modes:

- the bottom control bar hides
- the immersive top title hides
- the mouse cursor hides

Interaction must reveal them again.

This round does not authorize any broader player redesign.

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- tighten the immersive inactive-timer behavior inside the watch/player surface

3. `reviewer`
- validate the immersive 3-second auto-hide behavior before merge

## Ownership boundaries

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

### Reviewer scope

- docs and runtime/browser validation only
- no implementation takeover of Detail Player files

## In scope

- theater-mode immersive auto-hide timing
- fullscreen-mode immersive auto-hide timing
- synchronization of:
  - bottom control bar
  - immersive top title
  - mouse cursor
- reveal-on-interaction behavior in those immersive modes

## Out of scope

- non-immersive layout changes
- control-bar redesign
- title-copy changes
- autoplay behavior changes
- routing changes
- broader player-UI redesign

## Detail Player implementation handoff

## 1. Single 3-second immersive inactivity rule

In theater mode and fullscreen mode:

- inactivity window must be exactly 3 seconds for this round
- after 3 seconds without interaction, the immersive chrome should hide

For this task, “immersive chrome” includes:

- bottom control bar
- top title overlay
- mouse cursor

## 2. Reveal behavior

In theater mode and fullscreen mode, interaction must reveal immersive chrome again.

Interaction should include the same user activity currently used to keep the player alive, such as:

- mouse movement over the player
- pointer interaction with the player
- keyboard interaction that meaningfully targets the player

The important requirement is that once the user interacts again, the control bar, top title, and cursor return together.

## 3. Synchronization requirement

The bottom control bar, top title overlay, and cursor must not drift on separate hide schedules in immersive modes.

Required behavior:

- they hide together after the same 3-second idle period
- they reveal together on interaction

This does not forbid internal sub-state, but from the user’s perspective the immersive chrome should behave as one synchronized layer.

## 4. Recommended implementation direction

Use one immersive inactivity source of truth rather than separate loosely-coupled timers for each element.

Recommended direction:

- centralize theater/fullscreen idle handling behind one immersive active/hidden state
- let control bar, top title, and cursor all derive their hide/show behavior from that same state
- avoid per-element timeout drift

## 5. Likely current mismatch to address

Based on the current `PlayerShell.tsx` structure, there are already separate refs/state for:

- controls visibility
- cursor hiding
- multiple timeout refs

That strongly suggests a likely mismatch risk:

- the control bar and cursor may already be driven by partially separate timeout/state paths
- the newer top title overlay may not be tied to exactly the same reveal/hide lifecycle

For this round, Detail Player should assume the bug is most likely a synchronization problem, not just a missing CSS transition.

## Detail Player checklist

- Ensure theater mode uses a 3-second immersive inactivity timeout.
- Ensure fullscreen mode uses the same 3-second immersive inactivity timeout.
- Hide control bar, top title, and cursor together after that idle period.
- Reveal control bar, top title, and cursor together when interaction resumes.
- Keep non-immersive playback behavior unchanged.
- Do not broaden into control-layout or overlay redesign.

## Reviewer acceptance checklist

Reviewer sign-off must be based on visible runtime behavior.

### 1. Theater-mode idle hide

- Enter theater mode.
- Stop interacting with the player.
- Confirm that after 3 seconds:
  - the bottom control bar hides
  - the top title overlay hides
  - the mouse cursor hides

### 2. Theater-mode reveal

- After those elements hide, move the mouse or otherwise interact with the player.
- Confirm the bottom control bar, top title overlay, and cursor all return together.

### 3. Fullscreen-mode idle hide

- Enter fullscreen mode.
- Stop interacting with the player.
- Confirm that after 3 seconds:
  - the bottom control bar hides
  - the top title overlay hides
  - the mouse cursor hides

### 4. Fullscreen-mode reveal

- After those elements hide, move the mouse or otherwise interact with the player.
- Confirm the bottom control bar, top title overlay, and cursor all return together.

### 5. Synchronization guard

- Confirm there is no obvious stagger where one element hides or returns significantly earlier than the others.
- Confirm the top title overlay does not remain visible while controls/cursor have already hidden.
- Confirm the cursor does not remain visible while the rest of the immersive chrome has already hidden.

### 6. Non-immersive regression guard

- Confirm inline/non-immersive playback does not regress.
- Confirm controls, title display, and routing still work outside this timing refinement.

## Acceptance criteria

Round 1 passes only if:

- in theater mode, control bar, top title, and cursor all hide after 3 seconds of inactivity
- in fullscreen mode, control bar, top title, and cursor all hide after 3 seconds of inactivity
- interaction reveals those same elements again in both immersive modes
- the immersive chrome behaves as one synchronized hide/show system
- non-immersive playback does not regress

Round 1 fails if:

- any of the three elements remains visible after the 3-second idle window in immersive mode
- any of the three elements hides on a visibly different schedule than the others
- interaction does not reliably restore the hidden immersive chrome
- the fix regresses non-immersive playback behavior

## Recommendation summary

Treat this as a timing-coherence round, not a design round:

- 3 seconds idle in theater/fullscreen
- one synchronized immersive hide/show lifecycle
- control bar, top title, and cursor all bound to that same lifecycle
