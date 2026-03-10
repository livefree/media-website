# Reviewer Findings: Episode Navigation And Selector Round 1

## Decision

Acceptance withheld. I did not find a clear blocking code-level defect in the reviewed implementation, but this round's acceptance criteria are interaction-heavy and require runtime/browser validation that I could not complete in this session.

## What Was Validated

Validated from code/build review:
- `npm run build` passed with the current watch/player implementation
- episodic seed expansion appears to be active for the current `series` and `anime` catalog entries
- the watch route still passes canonical episode hrefs and next-episode state into the player
- the player code now includes:
  - preserved next-episode action and `N` shortcut handling
  - a right-side `选集 (E)` trigger
  - a lower-left episode popup
  - arrow-key focus movement and `Enter` selection logic
- the inline episode selector now renders numeric labels with tooltip copy instead of verbose primary labels

## Strong Code/Build Evidence

1. Expanded episode coverage appears to meet the required 10-50 range.
   - `data/media.ts` now includes episodic expansion helpers such as `buildExpandedEpisodeList(...)` and `expandEpisodicCoverage(...)`; see [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L2234) and [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L2279).
   - The configured `targetEpisodes` values in the current data file span `10` to `14`, which is inside the requested range.
   - The current seed file still preserves the demo-backed playback pattern for generated episodes via `buildLocalDemoStream(...)`.

2. Canonical watch/list and episode routing do not show an obvious code-level regression.
   - The watch route still composes canonical episode hrefs through `buildCanonicalWatchStateHref(...)` in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L27).
   - The player receives both the expanded `episodes` array and `nextEpisodeHref` in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L266).

3. The inline selector is numeric-first with hover title copy in code.
   - [components/player/EpisodeSelector.tsx](/Users/livefree/projects/media-website-v2/components/player/EpisodeSelector.tsx#L79) renders `episode.episodeNumber` as the visible chip label.
   - Tooltip copy is provided via `episode.title || 第 n 集` and shown through `.selectorTooltip` / `:hover` / `:focus-within` styling in [components/player/EpisodeSelector.tsx](/Users/livefree/projects/media-website-v2/components/player/EpisodeSelector.tsx#L97) and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L549).

4. The next-episode control still exists in the player code.
   - The player still renders the next-episode button when `nextEpisodeHref` exists in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1179).
   - Tooltip/shortcut treatment remains wired through `ControlShell` and `N` key handling in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L867).

5. The `选集 (E)` popup behavior is implemented in code.
   - The right-side trigger is rendered in the player secondary cluster in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1249).
   - The popup panel is positioned at the lower-left player region in CSS via `left: 12px; bottom: 76px;` in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L1034).
   - Popup open centers/focuses the active episode with `scrollIntoView({ block: "center" })` in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L605).
   - Arrow-key focus movement plus `Enter` activation is implemented in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L762).

## Why Acceptance Is Withheld

The core acceptance checks for this round are behavior- and layout-driven, and I could not execute them in-browser in this session.

Unverified here:
- that representative current `series` and `anime` titles actually render with 10-50 selectable episodes in the live UI
- that the visible `下一集` control appears only when appropriate and its tooltip/shortcut behavior works as intended
- that the main numeric episode chips show the episode title on actual hover/focus in the rendered UI
- that `选集 (E)` opens from the intended lower-left player region visually
- that the current episode is actually centered in the popup viewport where practical
- that arrow keys move focus as intended inside the popup and `Enter` activates the focused episode
- that canonical watch/list behavior still holds under live episode switching rather than only static code inspection

Because those are the substantive acceptance gates for this task, code/build review alone is not sufficient to accept the round.

## Recommendation

Do not mark this round accepted yet.

Next step:
- run the planner's runtime QA sequence in-browser against representative `series` and `anime` watch entries
- accept only after the selector hover, popup placement, popup keyboard navigation, and next-episode behaviors are directly observed
