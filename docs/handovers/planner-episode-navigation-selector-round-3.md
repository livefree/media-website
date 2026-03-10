# Planner Handoff: Episode Navigation And Selector Round 3

## Task summary

Episode Navigation And Selector Round 3 is a narrow visual-emphasis follow-up for the episode popup.

This round covers only two user-reported issues:

1. the current episode number in the popup should render in red and read more obviously as active
2. hovered or keyboard-focused candidate episode buttons should get a deeper border-color contrast

This round does not authorize broader selector layout changes or wider player redesign.

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- implement the popup visual-feedback refinements inside the watch/player surface

3. `reviewer`
- validate current-episode emphasis and non-active candidate contrast before merge

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

- active current-episode styling inside the popup
- hovered candidate episode styling inside the popup
- keyboard-focused candidate episode styling inside the popup
- preserving existing popup behavior while improving those visual states

## Detail Player implementation checklist

### 1. Current episode active emphasis

- The active episode inside the popup must stand out immediately.
- Its numeric label should render in red rather than blending into the neutral button palette.
- The active treatment should still feel visually integrated with the existing popup chrome, not like an unrelated warning/error state.
- Existing current-item highlighting may remain, but the red numeric treatment must make the active item more obvious than before.

### 2. Hover and focus contrast for non-active candidates

- Hovered candidate episode buttons must show a noticeably deeper border-color contrast than the current weak state.
- Keyboard-focused candidate episode buttons must receive the same stronger contrast treatment.
- The contrast increase should be visible without depending on subtle color shifts that are easy to miss.
- Hovered/focused candidates should remain clearly distinct from the active red current item.

### 3. Preserve accepted behavior

- Do not change popup structure or placement beyond what is needed for these visual refinements.
- Do not change the dense numeric-only layout.
- Do not change the `N` or `E` shortcut behavior.
- Do not regress canonical watch routing or next-episode behavior.

## Reviewer validation sequence

Reviewer sign-off must be based on visible runtime behavior.

### 1. Active current-episode check

- Open the episode popup on a title with multiple episodes.
- Confirm the current episode number renders in red.
- Confirm the current episode reads as obviously active at a glance.

### 2. Hover contrast check

- Hover several non-active episode buttons.
- Confirm the hovered candidate gets a deeper border-color contrast than the baseline non-hover state.
- Confirm the contrast change is clearly visible, not barely perceptible.

### 3. Keyboard focus contrast check

- Open the popup and move focus with the keyboard.
- Confirm the focused candidate receives the same stronger border-color treatment.
- Confirm keyboard focus remains distinguishable from both the default candidate state and the active red current item.

### 4. Regression guard

- Confirm popup layout remains dense and numeric-only.
- Confirm popup open/close behavior still works.
- Confirm `N` / `E` shortcuts, canonical routing, and next-episode behavior do not regress.

## Acceptance criteria

Round 3 passes only if:

- the current episode number in the popup renders in red
- the active item reads more obviously as the current selection
- hovered non-active candidates receive a clearly deeper border-color contrast
- keyboard-focused non-active candidates receive the same stronger contrast treatment
- existing popup layout, shortcuts, canonical routing, and next-episode behavior remain intact

Round 3 fails if:

- the current episode still blends into the neutral popup palette
- the red treatment is missing or too weak to make the active item obvious
- hovered/focused candidate borders still change too subtly
- the visual tweaks regress popup behavior, shortcuts, or routing

## Explicit out of scope

This round does not include:

- changing popup layout density again
- changing popup placement or animation
- changing the selector-entry hover reveal
- changing the control label beside `下一集`
- changing episode counts or data
- broader player or page redesign
- auth, admin, or data-catalog work

## Recommendation summary

Treat Round 3 as a pure visual-emphasis pass for the popup:

- make the active current episode read immediately through red numeric emphasis
- make hovered and focused candidates read more clearly through stronger border contrast

Nothing else should move in this round.
