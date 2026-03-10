# Planner Handoff: Player Title Overlay Round 1

## Task summary

Player Title Overlay Round 1 is a narrow watch-surface copy and immersive-overlay refinement.

This round has four goals only:

1. replace the generic watch-page heading `在线播放` with a real playback title string
2. keep non-episodic playback on a clean title-only heading
3. show the same title string at the top edge in theater mode and fullscreen mode
4. make that top title overlay hide and reappear together with the immersive chrome/cursor behavior

This round does not authorize a broader player redesign.

## Execution order

1. `planner`
- publish this handoff

2. `detail-player`
- implement the watch-page title replacement and immersive top-overlay behavior inside the watch/player surface

3. `reviewer`
- validate the title replacement and immersive top-overlay behavior before merge

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

- replacing the visible watch-page player heading copy
- defining a clean title string for episodic vs non-episodic playback
- showing the same title string at the top edge in theater mode and fullscreen mode
- wiring that top overlay to the existing immersive hide/show behavior

## Out of scope

- broader player layout redesign
- changing control-bar content or control density
- changing canonical routes
- changing media or episode data contracts
- browse/detail copy redesign outside this specific watch/player title surface
- auth, admin, or data-catalog work

## Recommendation for title string format

### Episodic playback

Recommended visible format:

```text
<media title>【第<episode number>集】
```

Examples:

- `恐龙时代：你不知道的故事【第12集】`
- `Prism Hearts【第3集】`

### Why

- It matches the user’s requested “视频名称 + 【集数】” framing.
- It stays compact enough for both the page heading and the immersive top edge.
- It avoids relying on potentially long episode titles in the always-visible heading line.

### Non-episodic playback

Recommended visible format:

```text
<media title>
```

Examples:

- `侵略机器`
- `The Farm`

No empty suffix, placeholder brackets, or broken episode token should appear for movies or other non-episodic playback.

### Optional subtitle handling

If the implementation wants to surface the episode title somewhere else, that should remain outside this heading string.

For this round, the heading and immersive overlay should stay on:

- title only for non-episodic
- title plus `【第N集】` for episodic

## Detail Player implementation checklist

### 1. Replace the watch-page heading

- Replace the generic `在线播放` section heading with the playback title string described above.
- Use the active episode context when episodic playback is active.
- Fall back to clean title-only output for non-episodic playback.

### 2. Add immersive top-edge title overlay

- In theater mode, show the same playback title string at the top edge of the page/theater presentation area.
- In fullscreen mode, show the same playback title string at the top edge of the fullscreen screen area.
- The overlay should read as part of the immersive player chrome, not as a separate page header.

### 3. Tie top overlay to immersive hide/show behavior

- The top title overlay must auto-hide when the immersive controls/cursor auto-hide.
- It must reappear on the same interaction triggers that reveal the immersive controls.
- It should not remain pinned on screen while the rest of the immersive chrome has faded away.

### 4. Preserve existing behavior

- Do not regress the existing bottom control-bar hide/show behavior.
- Do not regress playback controls.
- Do not regress canonical watch/list routing.
- Do not broaden the task into a full player top-bar redesign.

## Reviewer acceptance checklist

### 1. Watch-page heading replacement

- Open an episodic watch entry and confirm the heading now shows `<media title>【第N集】`.
- Open a movie or other non-episodic watch entry and confirm the heading shows title only.
- Confirm `在线播放` is no longer the visible player heading.

### 2. Theater-mode top overlay

- Enter theater mode.
- Confirm the same title string appears at the top edge of the page/theater presentation area.
- Confirm the string matches the watch-page heading rules for episodic vs non-episodic playback.

### 3. Fullscreen-mode top overlay

- Enter fullscreen mode.
- Confirm the same title string appears at the top edge of the screen.
- Confirm the string matches the watch-page heading rules for episodic vs non-episodic playback.

### 4. Immersive auto-hide behavior

- Let the player go idle in theater mode and fullscreen mode.
- Confirm the top title overlay hides together with the immersive player chrome/cursor behavior.
- Move the pointer or otherwise trigger immersive chrome reveal.
- Confirm the top title overlay reappears along with the controls.

### 5. Regression guard

- Confirm existing control-bar auto-hide behavior still works.
- Confirm playback controls still work.
- Confirm canonical watch/list routing does not regress.
- Confirm no unrelated player layout changes were introduced.

## Acceptance criteria

Round 1 passes only if:

- the watch-page heading changes from `在线播放` to the real playback title string
- episodic playback renders `<media title>【第N集】`
- non-episodic playback renders clean title-only form
- theater mode shows the same title string at the top edge
- fullscreen mode shows the same title string at the top edge
- the top overlay auto-hides and reappears together with the immersive player chrome/cursor behavior
- existing control-bar auto-hide behavior, playback controls, and routing do not regress

Round 1 fails if:

- `在线播放` remains the visible watch-page heading
- non-episodic playback shows a broken or empty episode suffix
- theater/fullscreen modes lack the matching top-edge title
- the top title remains visible when the immersive chrome/cursor has hidden
- the top title fails to reappear on interaction
- the change broadens into unrelated player redesign work

## Recommendation summary

This round should stay small:

- page heading becomes the real playback title
- episodic format: `<media title>【第N集】`
- non-episodic format: `<media title>`
- theater/fullscreen get the same string as an immersive top-edge overlay
- that overlay follows the same hide/show lifecycle as the immersive player chrome
