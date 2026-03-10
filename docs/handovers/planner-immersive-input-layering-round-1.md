# Planner Handoff: Immersive Input Layering Round 1

## Task summary

Immersive Input Layering Round 1 is a narrow structural cleanup of the player’s input semantics and immersive idle behavior.

This round should move the player closer to a YouTube-style layering model:

- passive video layer
- gesture/click layer
- control layer
- one immersive idle manager

The user-facing goals are:

- the video image area shows default/arrow cursor semantics, not a hand/pointer
- only real interactive controls show pointer affordance
- immersive auto-hide in theater/fullscreen works reliably after 3 seconds without needing a blank-area click first

This is not a broad visual redesign.

## Root-cause analysis from current structure

## 1. Video surface currently advertises itself like a button

In the current CSS, `.playerVideo` is styled with:

- `cursor: pointer`

That makes the entire image area read as an interactive button surface even when the user is simply hovering over passive video content.

That differs from YouTube-style semantics, where:

- the image area feels passive by default
- only actual controls, timeline, and buttons advertise pointer affordance

## 2. Gesture semantics and pointer semantics are coupled too broadly

The current `video` element itself handles:

- click-to-toggle playback

while the outer player wrapper also handles:

- `onMouseMove`
- `onMouseEnter`
- `onMouseLeave`
- focus capture / blur capture

This means:

- the passive video layer
- the click gesture surface
- the control chrome
- the immersive reveal logic

are partially collapsed into one overlapping interaction zone.

That makes cursor semantics harder to reason about and encourages “everything feels clickable” behavior.

## 3. Immersive hide currently relies on multiple states/timers

The current player already has:

- `isControlsVisible`
- `isCursorHidden`
- `hideControlsTimeoutRef`
- `cursorHideTimeoutRef`
- separate immersive title visibility derived from control visibility

This is better than having no structure, but it still suggests the immersive system is being coordinated indirectly rather than from one explicit immersive idle manager.

## 4. Likely reason hide can depend on where the cursor last rested

Current hide/reveal behavior is driven by broad wrapper mouse/focus events plus chrome-local pointer-event zones.

That creates a likely failure mode:

- if the pointer ends over chrome or another interactive sub-layer
- or if focus/panel state remains active
- or if different pieces of the immersive UI are deriving hide/reveal from different state paths

then the immersive hide lifecycle can become sensitive to where the cursor last was, rather than to one unified “player is idle in immersive mode” rule.

This matches the reported symptom that immersive hide sometimes does not fully resolve until the user clicks a blank area first.

## 5. Structural diagnosis

The real issue is not just a wrong cursor CSS rule.

The underlying problem is that the player currently lacks a clean separation between:

- passive rendered video
- gesture capture
- actual interactive controls
- immersive idle state

Round 1 should correct that layering at the player-surface level.

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- implement the immersive input-layer and idle-manager refinement inside the watch/player surface

3. `reviewer`
- validate cursor semantics and immersive auto-hide behavior before merge

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

- passive video-layer cursor semantics
- control-only pointer affordance
- internal separation of passive video layer, gesture layer, and control layer
- one shared immersive idle manager for theater/fullscreen hide/show
- reliable 3-second immersive hide without blank-area click dependency

## Out of scope

- redesigning the look of the player controls
- changing routes or data contracts
- changing autoplay policy
- changing title-copy rules
- broader page layout redesign

## Concrete implementation handoff for Detail Player

## 1. Split the player into clearer interaction layers

### Passive video layer

- The rendered video/image area should be treated as passive visual media.
- It should use default cursor semantics, not `pointer`.
- It should not itself communicate that every pixel is a button.

### Gesture/click layer

- If click-to-toggle playback is retained across the video area, that behavior should live in a dedicated gesture layer or clearly scoped interaction layer above the passive video surface.
- That layer may handle click/tap semantics, but it should not force pointer-hand affordance across the whole image area.
- In practice, default cursor semantics over the image area are acceptable even when click-to-toggle remains supported.

### Control layer

- Buttons, sliders, rail, and explicit interactive controls should remain the only surfaces that present pointer/hand affordance.
- Pointer affordance should be scoped to actual controls, not the entire viewport.

## 2. Introduce one shared immersive idle manager

Theater mode and fullscreen mode should derive immersive hide/show from one shared state machine or manager.

Recommended behavior model:

- `immersiveActive`: user is currently interacting, chrome visible
- `immersiveIdle`: 3 seconds elapsed in theater/fullscreen with no qualifying interaction, chrome hidden

That single immersive state should drive:

- bottom control bar visibility
- top title visibility
- cursor visibility

## 3. Use one inactivity timer source of truth

Recommended implementation direction:

- replace loosely related hide paths with one immersive inactivity timer
- reset that timer on qualifying player interaction
- when the timer expires, flip one immersive-hidden state
- derive the top title, control bar, and cursor from that same state

This is the key change that should eliminate the “must click blank area first” class of bug.

## 4. Define qualifying interaction sources clearly

Qualifying interaction in immersive modes should include:

- mouse movement over the player region
- pointer interaction with controls
- pointer interaction with the gesture layer
- relevant keyboard interaction aimed at the player

The important rule is:

- real interaction reveals/reset immersive state
- mere pointer location over the passive video or control layer should not create conflicting hide rules

## 5. Cursor semantics recommendation

Use this rule set:

- passive video/image area: default cursor
- explicit controls and sliders: pointer where appropriate
- hidden immersive state: `cursor: none`

Do not use a broad viewport-wide `cursor: pointer` as the main interaction signal.

## Detail Player checklist

- Remove broad pointer-hand cursor semantics from the passive video/image layer.
- Preserve pointer affordance only on real interactive controls.
- Separate passive video rendering from gesture capture and control interactivity as distinct layers in the player structure.
- Introduce one shared immersive idle manager for theater/fullscreen behavior.
- Drive control bar, top title, and cursor hide/show from that single immersive state.
- Ensure immersive hide works after 3 seconds without requiring a blank-area click first.
- Keep existing playback controls, title display, and routing behavior intact.

## Reviewer acceptance checklist

Reviewer sign-off must be based on visible runtime behavior.

### 1. Passive video cursor semantics

- Hover over the non-control video image area.
- Confirm the cursor is default/arrow rather than a hand/pointer.

### 2. Control-only pointer affordance

- Hover over actual buttons, sliders, and progress controls.
- Confirm those real controls still show appropriate pointer affordance.
- Confirm pointer affordance is not globally applied across the whole viewport.

### 3. Theater-mode immersive hide

- Enter theater mode.
- Interact briefly, then stop interacting.
- Confirm that after 3 seconds the immersive chrome hides reliably.
- Confirm this does not require clicking a blank area first.

### 4. Fullscreen-mode immersive hide

- Enter fullscreen mode.
- Interact briefly, then stop interacting.
- Confirm that after 3 seconds the immersive chrome hides reliably.
- Confirm this does not require clicking a blank area first.

### 5. Synchronized reveal

- In immersive modes, interact again after hide.
- Confirm control bar, top title, and cursor all return together.

### 6. Regression guard

- Confirm click/tap playback interaction still works if that behavior remains supported.
- Confirm existing controls still function.
- Confirm title display and routing do not regress.

## Acceptance criteria

Round 1 passes only if:

- the passive video image area no longer shows pointer-hand cursor semantics
- only real interactive controls present pointer affordance
- theater-mode immersive hide works reliably after 3 seconds without blank-area click dependency
- fullscreen-mode immersive hide works reliably after 3 seconds without blank-area click dependency
- control bar, top title, and cursor are driven by one synchronized immersive hide/show lifecycle
- existing playback controls, title display, and routing do not regress

Round 1 fails if:

- the video image area still feels globally clickable through pointer-hand cursor semantics
- immersive hide still depends on clicking a blank area first
- control bar, top title, and cursor still drift on separate hide/show behavior
- the change regresses existing playback interactions or routing

## Recommended design change summary

The player should move toward this layering model:

### Passive video layer

- visual media only
- default cursor

### Gesture layer

- optional click/tap playback toggles
- reveal/reset immersive activity

### Control layer

- all explicit buttons, rails, sliders, and menus
- pointer affordance lives here

### One immersive idle manager

- one timer
- one immersive hidden/visible state
- bar/title/cursor all derive from it

That separation is the best way to match YouTube-like cursor semantics while making immersive auto-hide robust.
