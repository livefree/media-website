# Planner Handoff: Compact Playback Source Selector Round 1

## Task summary

This round restores visible playback-source selection to the watch player, but only in a compact player-local form.

Goals:

1. explain and preserve the current background source-resolution model
2. expose playback sources in a compact selector adjacent to the episode controls
3. preserve the user’s current source preference when switching episodes if a matching source exists
4. keep the canonical `/watch?v=...&e=...&r=...` model intact

This round does **not** authorize a return to the old large source section.

## Current background source behavior

The current watch route already does the following:

- resolves playback options from the active episode’s source set
- prefers the explicit `r` query param when it matches a source for the current episode
- falls back to the first playable source when `r` is missing or invalid for the active episode
- preserves source preference for `nextEpisodeHref` by trying to match the current source on:
  - `provider`
  - `format`
  - `label`

The current gap is ordinary episode switching:

- episode selector links currently clear `resourcePublicId`
- that means manual episode changes lose the explicit source choice even when the next episode has an equivalent source
- the UI also does not expose source choice in the compact episode-control area

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- implement compact source-selection UI near the episode controls
- preserve source preference across ordinary episode switching and source-triggered episode changes

3. `reviewer`
- validate visible source selection, compact placement, sticky source behavior across episodes, and no regression to canonical watch/list routing

## Ownership boundaries

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

### Reviewer scope

- runtime/browser validation
- docs findings and acceptance notes only

## In scope

- compact playback-source selector placement near the episode controls
- active-source visibility in the player UI
- user-selectable source switching
- sticky source preservation across episode changes when a matching source exists
- continued sticky behavior for next-episode navigation

## Out of scope

- bringing back the old large playback-source section
- changing the canonical public URL model
- changing list playback semantics
- changing data contracts outside what Detail Player already receives for source options
- larger player layout redesign
- download-resource redesign

## Recommendation: compact selector UI placement

Recommended placement:

- place the compact source selector in the same player-control cluster as:
  - `下一集`
  - the compact episode-selector trigger

Recommended visible behavior:

- render it as a compact control-chip or button immediately adjacent to the episode controls
- show the active source label in short form
  - examples: `线路 1`, `M3U8`, `HD`
- keep the control in the lower player control row, not in a separate section below the player

Recommended interaction:

- clicking the source control opens a compact popup, menu, or flyout anchored to that control
- the menu lists only the currently relevant playback sources for the active episode
- the active source is clearly marked
- selecting a source updates the watch state and closes the compact menu

Do not:

- reintroduce a full-width block with a visible `播放源：` section label and tab row
- move source choice outside the player-local episode/navigation controls
- duplicate source selection both in the player cluster and in a separate large section

## Recommendation: preserve source choice across episode switches

Preserve source choice by translating the current source preference into the destination episode’s matching resource before building the destination href.

Recommended rule:

1. treat the current active source as the preference anchor
2. when building an episode-switch href, search the destination episode’s playable sources for the best match on:
   - `provider`
   - `format`
   - `label`
3. if a matching playable source exists, write that destination resource’s `publicId` into `r`
4. if no match exists, omit `r` and let the existing fallback resolution pick the first playable source

This keeps the canonical URL model unchanged:

- `r` still means a concrete resource for the destination episode
- the system simply chooses the correct destination resource id while composing the episode href
- no new query param is needed

Implementation recommendation:

- use one shared helper for destination-source matching
- use that helper for:
  - ordinary episode selector links
  - compact popup episode picks
  - `nextEpisodeHref`

That avoids divergence where one episode-transition path is sticky and another is not.

## Detail Player implementation checklist

### 1. Keep current source-resolution semantics visible in implementation

- preserve the existing precedence:
  - explicit valid `r`
  - otherwise first playable source
- do not change canonical watch/list query structure
- do not change the watch route to depend on a new preference-only query param

### 2. Add compact source selector near episode controls

- render a compact source selector in the player control cluster adjacent to the episode controls
- show the active source in short form so the user can tell which source is active without opening a large section
- keep the selector visually compact enough to coexist with:
  - `下一集`
  - the compact episode selector trigger

### 3. Make sources selectable

- list current-episode playback sources in the compact selector UI
- selecting one should navigate or update state to the corresponding canonical `/watch?...&r=<resourcePublicId>` target
- the newly selected source should become visibly active

### 4. Preserve source choice on ordinary episode switching

- stop clearing `resourcePublicId` blindly for ordinary episode selector links
- when building an episode href, try to map the current source preference to the destination episode using the provider/format/label match rule
- write the matched destination resource id to `r` if found
- if no match exists, clear `r` and rely on normal first-playable fallback

### 5. Preserve source choice in all episode transitions

- `nextEpisodeHref` must continue preserving source preference
- compact episode popup selection must preserve source preference
- any other player-local episode-change path in scope must use the same matching logic

### 6. Prevent regression to the old large source section

- do not reintroduce the old full-width source section
- if `SourceTabs` still exists temporarily, it should not be the visible primary UI for this round
- the only user-facing source selector in scope should be the compact player-local control

## Reviewer acceptance checklist

### 1. Compact source selector visibility

- open a watch page with multiple playback sources for the active episode
- confirm the player visibly shows a compact source selector adjacent to the episode controls
- confirm there is no return of the old large source section below the player

### 2. Active source readability

- confirm the compact selector shows which source is currently active
- confirm the active source remains understandable in collapsed state without opening a full-width section

### 3. Source selection behavior

- open the compact source selector
- choose a different playable source
- confirm playback switches to that source
- confirm the watch URL remains canonical and uses the destination source’s `r` value

### 4. Ordinary episode-switch stickiness

- select a non-default source on an episode that has more than one source
- switch to another episode using the ordinary episode selector
- if an equivalent source exists on the destination episode, confirm that source remains selected
- if no equivalent source exists, confirm playback falls back cleanly to the destination episode’s first playable source

### 5. Next-episode behavior

- select a non-default source
- use `下一集`
- confirm the next-episode transition still preserves source preference when a match exists

### 6. Compact popup episode behavior

- if the player has a popup or compact episode menu, select another episode from that UI
- confirm source preference is preserved there too when a match exists

### 7. Canonical URL and routing guard

- confirm `/watch` still uses the existing public query model
- confirm no new public preference query param was introduced
- confirm list-aware watch context does not regress when `list` / `li` are present

### 8. Regression guard

- confirm player controls still work
- confirm episode selector behavior does not regress
- confirm no large source section reappears

## Acceptance criteria

Round 1 passes only if:

- the watch player exposes a compact source selector adjacent to the episode controls
- the active source is visible and user-selectable
- selecting a source updates the active playback source without reviving the old large source section
- ordinary episode switching preserves source preference when a matching destination source exists
- next-episode navigation continues preserving source preference
- the canonical `/watch` URL model remains unchanged

Round 1 fails if:

- source choice remains hidden from the player UI
- the solution restores the old large source section
- ordinary episode switching still clears source preference even when a match exists
- next-episode source preservation regresses
- a new non-canonical preference query model is introduced
