# Planner Handoff: Player Control Position And Episodic Autoplay Round 1

## Task summary

Player Control Position And Episodic Autoplay Round 1 is a narrow player-behavior pass with two goals only:

1. move the control bar to the true bottom edge of the page/screen in theater mode and fullscreen mode
2. keep normal watch-page entry paused, while allowing autoplay only for a small set of episode-to-episode transitions

This round must not broaden into a general player redesign.

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- implement the control-position and episodic-autoplay behavior changes inside the watch/player surface

3. `reviewer`
- validate bottom-anchored control positioning and the autoplay exception flows before merge

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

- control-bar positioning in theater mode
- control-bar positioning in fullscreen mode
- keeping direct watch-page entry non-autoplay
- autoplay exceptions for the three allowed episode transitions only
- preserving canonical watch/list behavior while carrying autoplay intent internally

## Out of scope

- broader player chrome redesign
- changing control density or visual language outside the required repositioning
- autoplay on direct entry
- autoplay for unrelated media transitions
- autoplay query params in canonical public URLs
- browse/detail redesign outside the player
- auth, admin, data-catalog, or routing-model rewrites

## Detail Player implementation plan

## 1. Control-bar positioning behavior

### Theater mode

- In theater mode, the control bar should no longer sit in the same relative band over the video frame.
- It should visually anchor to the bottom edge of the page viewport or theater surface, reading as the bottom transport bar for the whole presentation area.

### Fullscreen mode

- In fullscreen mode, the control bar should visually anchor to the bottom edge of the fullscreen screen area.
- It should not remain floating at the previous inline-video position.

### Practical implementation expectation

- Treat control-bar positioning as mode-specific layout logic.
- Normal inline mode may remain unchanged.
- Theater/fullscreen mode should explicitly switch the control bar to a bottom-edge anchored presentation.

## 2. Default startup rule remains paused

- Direct watch-page entry must remain non-autoplay.
- Refreshing a watch page must remain non-autoplay.
- Opening a copied/shared canonical watch URL must remain non-autoplay.

This round adds autoplay exceptions only for specific in-app episode transitions. It does not weaken the direct-entry rule.

## 3. Allowed autoplay exception flows

Autoplay is allowed only when entering a new episode because of one of these three user-approved flows:

### A. Playback ending and auto-advancing to next episode

- When the current episode ends and the player auto-advances to the next episode, the newly entered episode should autoplay.

### B. Clicking `下一集`

- When the user clicks the `下一集` control, the newly entered episode should autoplay.

### C. Choosing a new episode from the selector popup/menu

- When the user selects an episode from the selector popup/menu, the chosen episode should autoplay.

## 4. Autoplay intent recommendation

Autoplay intent should not be carried in the canonical URL.

### Recommended rule

- keep canonical watch/list URLs unchanged
- carry autoplay intent as a transient in-app navigation signal
- scope that signal to the exact next target episode route
- consume it once on destination load and clear it immediately

### Recommended mechanism

Use one of these internal-only patterns:

- session-scoped storage entry, or
- history/navigation state local to the client transition

Recommended payload shape:

- target `mediaPublicId`
- target `episodePublicId`
- optional `listPublicId`
- optional `listItemPublicRef`
- one-shot `autoplay` intent flag

### Why this recommendation

- direct entry, refresh, and shared URLs stay paused
- canonical `/watch?...` and list-aware URLs do not gain an autoplay query parameter
- autoplay stays limited to intentional in-app episode transitions
- stale autoplay intent can be matched and discarded safely if the destination does not match

### One-shot consumption rule

On the destination watch page:

- read the transient autoplay intent
- verify it matches the current route identity
- allow autoplay only if it matches
- clear it immediately after use or mismatch

This prevents refresh or later unrelated navigation from replaying the autoplay exception.

## 5. State preservation requirements

- Existing canonical watch routing must remain intact.
- Existing list-aware route state must remain intact.
- Autoplay exceptions must not strip `list` / `li` when they are already part of the episode transition.
- Existing shortcuts and selector routing must not regress.

## Detail Player checklist

- Anchor the control bar to the bottom edge in theater mode.
- Anchor the control bar to the bottom edge in fullscreen mode.
- Keep normal inline mode behavior unchanged unless strictly necessary.
- Keep direct watch-page entry paused.
- Allow autoplay only for:
  - ended -> next episode auto-advance
  - `下一集` click
  - selector episode selection
- Carry autoplay intent internally rather than in the canonical URL.
- Scope autoplay intent to the exact destination route identity.
- Consume autoplay intent once and clear it.
- Preserve canonical watch/list behavior and shortcuts.

## Reviewer acceptance checklist

Reviewer sign-off must be based on visible runtime behavior.

### 1. Theater-mode control position

- Enter theater mode.
- Confirm the control bar anchors to the bottom edge of the page/theater surface.
- Confirm it no longer sits in the same relative spot over the inline video frame.

### 2. Fullscreen control position

- Enter fullscreen mode.
- Confirm the control bar anchors to the bottom edge of the screen.
- Confirm it does not remain vertically stranded at the old inline position.

### 3. Direct-entry non-autoplay guard

- Open a watch page directly.
- Confirm playback remains paused on entry.
- Refresh the page and confirm playback still remains paused.
- Open the same page from a copied/share-style canonical URL and confirm playback remains paused.

### 4. Allowed autoplay exception: ended -> next episode

- Let an episode reach the end when a next episode exists.
- Confirm the player transitions into the next episode with autoplay enabled.

### 5. Allowed autoplay exception: `下一集`

- Click the `下一集` control.
- Confirm the destination episode opens with autoplay enabled.

### 6. Allowed autoplay exception: selector episode choice

- Open the episode selector and choose another episode.
- Confirm the chosen episode opens with autoplay enabled.

### 7. Canonical URL and list-state regression guard

- Confirm the canonical watch URL does not gain an autoplay parameter.
- Confirm list-aware URLs still preserve `list` / `li` where applicable.
- Confirm `N`, selector routing, and existing episode navigation do not regress.

## Acceptance criteria

Round 1 passes only if:

- the control bar anchors to the bottom edge in theater mode
- the control bar anchors to the bottom edge in fullscreen mode
- direct watch-page entry remains non-autoplay
- autoplay occurs only for:
  - ended -> next episode auto-advance
  - `下一集` click
  - selector episode selection
- autoplay intent is carried without regressing canonical watch/list URLs
- existing canonical routing, list state, shortcuts, and selector behavior remain intact

Round 1 fails if:

- the control bar remains in the old relative overlay position in theater or fullscreen
- direct entry starts autoplaying
- autoplay exceptions leak into ordinary page entry or refresh behavior
- canonical watch URLs gain autoplay-specific public params
- list-aware or selector routing regresses

## Recommendation summary

Treat this as a two-part behavior round:

- layout: bottom-anchor the control bar in theater/fullscreen only
- navigation: allow one-shot autoplay only for explicit episode-to-episode transitions

The cleanest way to satisfy both is to keep canonical URLs unchanged and carry autoplay intent as transient internal navigation state.
