# Planner Handoff: Episode Navigation And Selector Round 2

## Task summary

Episode Navigation And Selector Round 2 is a narrow correction pass on the selector-entry control and episode popup behavior added in Round 1.

This round covers only four user-reported issues:

1. the episode-entry control should slide out from the right of `下一集` on hover instead of staying visible
2. the control label should be icon plus current episode number only, without the text `选集`
3. opening the popup or keyboard-moving inside it should not shift the page or player viewport
4. popup options should become compact numeric-only buttons in a dense horizontal/grid layout

This round must not broaden into a larger player redesign.

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- implement the selector-entry and popup-behavior corrections inside the watch/player surface

3. `reviewer`
- validate hover-trigger behavior, popup stability, compact episode layout, and keyboard interaction before merge

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

- hover-revealed episode-entry control behavior next to `下一集`
- the visible label/content of that control
- popup open/close and keyboard-navigation stability
- popup episode-item density and layout
- preserving existing `N` / `E` shortcuts, tooltip behavior, routing, and next-episode behavior while making the above corrections

## Detail Player implementation checklist

### 1. Hover-triggered slide-out entry

- The episode-entry control must not remain permanently visible beside `下一集`.
- It should appear only when the user hovers the `下一集` area or the combined next-episode/episode-entry cluster.
- Its reveal should read as sliding out from the right side of the `下一集` button, not as a separately floating control that is always present.
- The hover interaction must remain stable enough that users can move from `下一集` onto the revealed episode-entry control without it disappearing mid-transfer.

### 2. Compact control label

- The control should show:
  - the existing episode-list icon
  - the current episode number only
- The visible literal text `选集` must be removed from the control face.
- Tooltip/accessible labeling may still use fuller text for clarity, but the visible control chrome should stay icon-plus-number only.

### 3. No page shift on popup open or keyboard movement

- Opening the popup must not move the page.
- Opening the popup must not visibly shift the player viewport.
- Arrow-key movement inside the popup must not trigger browser/page scroll or layout jump.
- Current-item centering may still occur inside the popup’s own scroll container, but that centering must be local to the popup rather than shifting the page.

### 4. Dense numeric-only popup layout

- Popup items should render as compact numeric-only buttons.
- Remove oversized title-style button treatment from the popup.
- Use a dense horizontal-wrap or compact grid layout that supports large episode counts without feeling like a vertical list of oversized controls.
- Keep the current item clearly highlighted.
- Hover or focus may still expose fuller episode title context where available, but the default visible item label should remain numeric-only.

### 5. Preserve existing accepted behavior

- Keep the `N` next-episode shortcut working.
- Keep the `E` selector shortcut working.
- Keep hover tooltips coherent with the rest of the player.
- Keep canonical watch routing and next-episode behavior intact.
- Do not alter unrelated player controls or popup systems beyond what is needed for these four corrections.

## Reviewer validation sequence

Reviewer sign-off must be based on visible runtime behavior.

### 1. Hover-trigger behavior

- Open a title with a next episode.
- Confirm the episode-entry control is not always visible by default.
- Hover the `下一集` area and confirm the episode-entry control slides out from the right side.
- Move from `下一集` onto the revealed control and confirm the control remains usable.

### 2. Control label check

- Confirm the revealed control shows only the icon plus the current episode number.
- Confirm the visible text `选集` is not present on the control face.

### 3. Popup stability check

- Open the popup with mouse and with `E`.
- Confirm opening it does not shift the page or player viewport.
- Use arrow keys inside the popup and confirm selection movement does not cause page scroll or unexpected viewport movement.

### 4. Dense popup layout check

- Confirm popup items render as compact numeric-only buttons.
- Confirm the layout reads as a dense horizontal-wrap or compact grid rather than oversized title buttons.
- Confirm the current item remains clearly highlighted.

### 5. Regression guard

- Confirm `N` still advances to the next episode where applicable.
- Confirm `E` still toggles the episode popup.
- Confirm canonical watch routing and next-episode behavior do not regress.

## Acceptance criteria

Round 2 passes only if:

- the episode-entry control stays hidden until hover over the `下一集` area or shared control cluster
- the control reveals from the right side of `下一集`
- the visible control label is icon plus current episode number only
- opening the popup does not shift the page or player viewport
- keyboard navigation inside the popup does not shift the page or player viewport
- popup items render as compact numeric-only buttons in a dense horizontal/grid layout
- existing `N` / `E` shortcuts, hover tooltips, canonical routing, and next-episode behavior remain intact

Round 2 fails if:

- the episode-entry control remains always visible
- the control still visibly says `选集`
- popup open or keyboard movement still shifts the page or viewport
- popup items still look like oversized title buttons instead of dense numeric controls
- the fixes regress next-episode behavior, shortcuts, or routing

## Explicit out of scope

This round does not include:

- expanding episode data again
- redesigning the overall player control bar
- changing next-episode semantics
- changing canonical watch routing
- broader popup-system redesign outside this episode-selector surface
- browse-page or detail-page redesign
- auth, admin, or data-catalog work

## Recommendation summary

Treat Round 2 as a targeted cleanup round for the new selector UI:

- hide the entry until hover
- reduce the visible label to icon plus episode number
- keep popup behavior locally scrollable and page-stable
- make the popup dense and numeric-first

Nothing else should move in this round.
