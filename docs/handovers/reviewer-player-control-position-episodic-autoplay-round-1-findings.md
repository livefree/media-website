# Reviewer Findings: Player Control Position And Episodic Autoplay Round 1

## Decision

Findings only. I am not accepting this round yet.

## Why acceptance is withheld

The planner handoff makes reviewer sign-off explicitly runtime-visible for this round. I was able to validate the implementation direction from code review and confirm `npm run build` passes, but I could not complete browser-runtime validation in this session for the required theater/fullscreen positioning and autoplay-exception flows. Because of that missing runtime proof, the candidate should not be treated as accepted yet.

## Blocking finding

1. Runtime acceptance evidence is still missing for the round's required visible behaviors.
   - Theater/fullscreen control positioning is implemented structurally in CSS, but I did not verify the actual rendered placement in-browser. The candidate switches immersive mode chrome to fixed bottom anchoring in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L681) and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L691), but this still needs visible confirmation that the bar sits on the true bottom page/screen edge rather than reading as an old inline overlay.
   - Episodic autoplay intent is implemented structurally, but I did not verify the live flows in-browser. The player consumes one-shot intent on load in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L625) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1115), and only sets that intent for episode-to-episode transitions in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1024), [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1162), and [components/player/EpisodeSelector.tsx](/Users/livefree/projects/media-website-v2/components/player/EpisodeSelector.tsx#L104). That is directionally correct, but it still requires runtime proof that direct watch entry stays paused while the three allowed transitions actually autoplay.

## Code/build observations

- Direct watch-page entry still appears paused by default. The player clears state, pauses the video, and only attempts `video.play()` when a matching transient autoplay intent is consumed; see [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L635) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1130).
- The allowed autoplay triggers appear narrowly scoped to:
  - ended -> next episode in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1162)
  - `下一集` / `N` in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L872) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1205)
  - selector episode picks in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1451) and [components/player/EpisodeSelector.tsx](/Users/livefree/projects/media-website-v2/components/player/EpisodeSelector.tsx#L104)
- I did not find public autoplay query-param leakage. Canonical watch href construction still only passes media, episode, resource, list, list-item, and optional time state in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L30) and [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L202), while autoplay intent lives in transient session storage in [components/player/autoplay-intent.ts](/Users/livefree/projects/media-website-v2/components/player/autoplay-intent.ts#L48).
- `npm run build` passed against the candidate branch.

## Runtime QA still required before acceptance

1. Enter theater mode and confirm the control bar visually anchors to the bottom edge of the page/theater surface.
2. Enter fullscreen mode and confirm the control bar visually anchors to the bottom edge of the screen.
3. Open `/watch` directly and confirm startup remains paused.
4. Refresh a watch URL and confirm startup remains paused.
5. Let an episode end when a next episode exists and confirm the next episode enters with autoplay.
6. Click `下一集` and confirm the destination episode enters with autoplay.
7. Pick an episode from the selector UI and confirm the destination episode enters with autoplay.
8. Confirm the canonical `/watch` URL does not gain an autoplay parameter during those transitions.
9. Confirm list-aware `list` / `li` state and existing episode routing still survive those transitions.

## Current recommendation

Do not merge on reviewer acceptance yet. The candidate looks directionally correct from code/build review, but this round still needs runtime-visible confirmation before it should be treated as accepted.
