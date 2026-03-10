# Reviewer Findings: Player Title Overlay Round 1

## Decision

Findings only. I am not accepting this round yet.

## Why acceptance is withheld

This round's acceptance is explicitly runtime-visible: the top overlay must appear at the top edge in theater/fullscreen and hide/reappear with the immersive chrome lifecycle. I validated the implementation direction from code review and confirmed `npm run build` passes, but I could not complete the required browser-runtime validation in this session.

I checked the local [$playwright-interactive](/Users/livefree/.codex/skills/playwright-interactive/SKILL.md) workflow because this task clearly needs interactive browser QA. That workflow requires `js_repl`, but this session does not expose a `js_repl` tool, so I could not execute the intended runtime verification path here.

## Blocking finding

1. Runtime/browser confirmation is still missing for the title overlay lifecycle.
   - The watch-page heading replacement is implemented structurally in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L134) and [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L286), and the immersive top title overlay is implemented structurally in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1061), [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1109), and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L681).
   - However, I did not verify in-browser that the overlay is actually visible at the top edge in both theater and fullscreen, that it hides when the immersive chrome/cursor hide, or that it reappears on the same interaction triggers as the controls.

## Code/build observations

- `在线播放` no longer appears as the watch-page player heading. The page now computes a real `playbackTitle` and renders it in the section heading in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L259) and [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L288).
- Episodic playback uses the requested format `<media title>【第N集】`, while non-episodic playback falls back to clean title-only output, via [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L134).
- The same `playbackTitle` string is passed into the player shell in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L294) and rendered for immersive modes only in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1109).
- The overlay hide/show state is wired to the same `isControlsVisible` state used by the immersive chrome in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L505), [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1055), and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1061).
- I did not find a code-level regression to canonical watch/list routing in this round. The canonical watch state construction in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L174) through [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L258) remains intact, and the title work does not alter those href builders.
- I did not find an obvious code-level regression to the bottom control surfaces; the touched player shell keeps the existing controls and hide/show state machinery in place.
- `npm run build` passed.

## Runtime QA still required before acceptance

1. Open an episodic watch entry and confirm the visible heading is `<media title>【第N集】`.
2. Open a non-episodic watch entry and confirm the visible heading is title-only with no broken suffix.
3. Enter theater mode and confirm the same title string appears at the top edge.
4. Enter fullscreen mode and confirm the same title string appears at the top edge.
5. Let the immersive player go idle in theater mode and fullscreen mode and confirm the top title hides together with the immersive controls/cursor.
6. Move the pointer or otherwise reveal controls and confirm the top title reappears with the chrome.
7. Confirm the bottom controls still auto-hide/reappear normally.
8. Confirm canonical watch/list routing still behaves the same while using the updated heading/overlay surface.

## Current recommendation

Do not treat this round as reviewer-accepted yet. The implementation looks directionally correct from code/build review, but it still needs runtime-visible verification of the top-edge overlay and immersive lifecycle behavior.
