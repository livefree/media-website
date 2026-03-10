# Planner Handoff: Episode Navigation And Selector Round 1

## Task summary

Episode Navigation And Selector Round 1 is a focused episode-navigation pass across existing `series` and `anime` watch flows.

This round has four concrete goals:

1. expand current `series` and `anime` entries to 10-50 episodes each for realistic testing
2. convert the current episode buttons to numeric-first labels with hover title behavior
3. preserve and explicitly validate the current `下一集` control as part of the accepted episode-navigation surface
4. add a right-side `选集 (E)` trigger that opens a lower-left episode popup with current-item centering and keyboard selection support

This round is about episode-navigation behavior only. It is not a broader player redesign.

## Execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- expand episodic coverage for `series` and `anime` titles while preserving demo-video playback strategy

3. `detail-player`
- implement the numeric selector, next-episode validation surface, and `选集 (E)` popup behavior inside the watch/player flow

4. `reviewer`
- validate expanded episode coverage, next-episode behavior, selector popup behavior, and keyboard interaction before merge

## Ownership boundaries

### Data Catalog owned scope

- `data/`
- `types/`
- `lib/media*`

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

### Reviewer scope

- docs and runtime/browser validation only
- no implementation takeover of Data Catalog or Detail Player files

## Expanded episode-data plan

## Data target

Current `series` and `anime` entries are too small for realistic selector and popup testing. Round 1 should expand the active episodic test records so each relevant `series` and `anime` title exposes between 10 and 50 episodes.

Practical target rule:

- minimum: `10` episodes
- maximum: `50` episodes

Round 1 does not require every title to have the same count. It does require every `series` and `anime` title used for watch-page testing to land inside that range.

## Data Catalog implementation strategy

- Preserve the current title set rather than creating a large new title set.
- Expand the existing season/episode arrays for current `series` and `anime` entries.
- Preserve current public-ID, slug, and watch-context generation patterns.
- Preserve the local demo-backed playback strategy introduced earlier.

## Demo-backed playback preservation rule

Expanded episodes must keep the existing simplified demo playback approach.

That means:

- `series` episodes continue to reuse the local TV demo asset strategy
- `anime` episodes continue to reuse the local anime demo asset strategy
- expanding episode counts must not reintroduce a multi-source playback UX requirement

It is acceptable in Round 1 for many generated episodes of the same title to reuse the same underlying demo video resource, as long as:

- episode identity remains distinct
- next-episode routing remains coherent
- selector and popup flows can be tested realistically

## Data Catalog checklist

- Expand current `series` entries to 10-50 episodes each.
- Expand current `anime` entries to 10-50 episodes each.
- Keep episode numbering deterministic and continuous.
- Preserve existing first episodes and existing title identity where possible.
- Ensure generated episodes still produce valid watch-page episode options and next-episode links.
- Keep demo-backed playback resources simple and deterministic.

## Episode button behavior plan

## Numeric label rule

The primary visible episode buttons should render as numeric labels:

- `1`
- `2`
- `3`
- ...

They should no longer render full verbose episode titles as the visible button label.

## Hover title rule

If an episode has a title, hovering its numeric button should reveal that episode title.

Accepted implementations may use:

- tooltip treatment aligned with the player’s existing tooltip style, or
- another compact hover title surface that behaves consistently

If an episode has no custom title, fallback hover text may use a generic label such as:

- `第 12 集`

## Current-item highlighting

The current episode must remain visibly highlighted both:

- in the main numeric selector surface
- inside the popup selector

## Next-episode control plan

The current next-episode control already exists and must be preserved as part of this round’s acceptance surface.

### Required behavior

- show a visible `下一集` control when a next episode exists
- keep the existing shortcut expectation for `N`
- keep tooltip treatment consistent with the rest of the player controls
- do not show the control when no next episode exists

### Scope note

Round 1 does not redesign the next-episode feature. It validates and preserves it while the selector system around it changes.

## Popup selector plan

## Trigger placement

Add a right-side `选集 (E)` trigger in the player control cluster.

This trigger should be a compact control, not a large page-level button row replacement.

## Popup placement

Activating the trigger should open an episode popup positioned from the lower-left region of the player surface, similar to the player’s compact control-panel language rather than a full-page drawer.

The popup should not feel detached from the player.

## Popup content expectations

The popup should:

- list episodes using numeric labels
- highlight the current episode
- support scroll when the count is large
- center the current episode in view when possible on open

### Current-item centering rule

When the popup opens:

- if the current episode is not near the beginning or end of the list, it should be scrolled into the center of the popup viewport
- if the current episode is near the beginning or end, the popup should scroll as close to centered as practical without overscrolling past bounds

## Keyboard interaction expectations

The popup must support:

- arrow-key movement between episode items
- `Enter` to activate the focused item

Recommended toggle behavior:

- `E` opens the popup
- `E` may close it when already open
- `Escape` may close it if implemented

The required minimum from this task is arrow-key navigation plus `Enter` selection.

## Detail Player implementation checklist

- Convert inline episode buttons to numeric labels.
- Provide hover title behavior for episodes with titles.
- Preserve watched/current visual states in the numeric selector.
- Preserve the visible `下一集` control and its shortcut/tooltip expectations.
- Add a right-side `选集 (E)` trigger in the player control cluster.
- Open a lower-left episode popup from that trigger.
- Highlight the current episode inside the popup.
- Center the current episode in the popup viewport when possible.
- Support arrow-key navigation and `Enter` selection inside the popup.
- Keep canonical watch routing and existing list-aware behavior intact.
- Do not broaden into a general player-control redesign.

## Reviewer validation sequence

Reviewer sign-off must cover both the larger episodic data baseline and the interaction behavior.

### 1. Expanded episode coverage

- Open representative `series` titles and confirm they now expose 10-50 episodes.
- Open representative `anime` titles and confirm they now expose 10-50 episodes.
- Confirm next-episode links still resolve correctly across the expanded data.

### 2. Numeric selector behavior

- Confirm main episode buttons display numeric labels only.
- Hover representative buttons and confirm episode titles appear when available.
- Confirm the active episode remains visually highlighted.

### 3. Next-episode control behavior

- Confirm the visible `下一集` button appears when a next episode exists.
- Confirm the button does not appear on the final episode.
- Confirm tooltip treatment is consistent with other controls.
- Confirm the `N` shortcut still triggers next-episode navigation where applicable.

### 4. Popup selector behavior

- Activate `选集 (E)` and confirm the popup opens from the lower-left player region.
- Confirm the current episode is highlighted and scrolled into centered view where practical.
- Confirm arrow keys move focus between popup items.
- Confirm `Enter` activates the focused episode.
- Confirm mouse selection still works.

### 5. Routing and regression guard

- Confirm canonical watch routing does not regress.
- Confirm existing list-aware watch behavior does not regress.
- Confirm the round does not introduce unrelated player UI or browse changes.

## Acceptance criteria

Round 1 passes only if:

- tested `series` and `anime` titles each expose between 10 and 50 episodes
- expanded episodes still use the current simplified demo-video playback strategy
- main episode buttons render as numeric labels
- episode titles are available on hover when present
- a visible `下一集` control remains available when a next episode exists, with preserved tooltip/shortcut expectations
- a right-side `选集 (E)` trigger opens a lower-left episode popup
- the popup highlights and centers the current item where practical
- popup selection supports arrow keys plus `Enter`
- canonical watch/list behavior does not regress

Round 1 fails if:

- episodic data remains too small for realistic testing
- expanded episodes break demo-backed playback assumptions
- full episode titles still remain the primary visible selector labels
- `下一集` behavior regresses
- the popup is missing, misplaced, or not keyboard-usable
- the work broadens into unrelated player redesign or browse changes

## Explicit out of scope

Round 1 does not include:

- browse redesign
- auth flow or admin tooling
- server-backed episode progress systems
- subtitle/danmaku work
- a full queue or playlist redesign
- changing canonical watch routing
- replacing the simplified demo-video playback model with a richer multi-source system
- broad player chrome redesign beyond the selector and next-episode surface

## Recommendation summary

This round should be treated as a realistic episodic-navigation test pass:

- Data Catalog makes series/anime episode volume large enough to stress the selector
- Detail Player makes the selector compact, numeric, keyboard-usable, and popup-capable
- Reviewer validates next-episode continuity, popup behavior, and routing stability

That is enough to make episode navigation testable at scale without turning the task into a full player overhaul.
