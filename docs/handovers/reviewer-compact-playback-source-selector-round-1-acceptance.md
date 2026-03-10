# Reviewer Acceptance: Compact Playback Source Selector Round 1

Status: accepted

Scope reviewed:
- `/Users/livefree/projects/media-website-v2/task.md`
- `/Users/livefree/projects/media-website-v2/docs/handovers/planner-compact-playback-source-selector-round-1.md`
- `/Users/livefree/projects/media-website-v2/app/watch/page.tsx`
- `/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx`
- `/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css`

Acceptance decision:
- Accepted from code/build review.

Findings:
- The watch player now exposes playback-source selection in a compact form adjacent to the episode controls. The watch page derives `sourceOptions` from the active episode and passes them into the player in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L261), and the compact source dock renders next to the episode controls in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1332).
- The implementation did not restore the old large source section. The current watch page only feeds the compact in-player selector path and does not render a separate page-level source chooser in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L255).
- The active source is visibly indicated. The collapsed control reflects the active source label in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1147), and the open panel marks the current source with active styling in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1372) and [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L1206).
- Switching episodes preserves the chosen source preference where a matching source exists. `resolveSourcePreferenceForEpisode` matches the destination episode source by provider, format, and label, then `buildEpisodeWatchHref` keeps the matched `r` value in the canonical href in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L91) and [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L112).
- `下一集` continues to preserve the current source preference by using the same sticky-source href helper in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L287).
- Canonical `/watch?...&r=...` behavior remains intact. Both source switching and episode transitions still flow through `buildCanonicalWatchStateHref` in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L124) and [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L265).
- I did not find an obvious regression to the episode selector, player controls, or routing. The source panel reuses the existing local episode navigation path in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1090), while the episode controls remain in place in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1296).

Styling note:
- The compact source picker is implemented as a player-local popup above the button, not a restored wide section, in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L1168).

Verification:
- `npm run build` passed.

Residual risk:
- This acceptance is based on code/build review in this session. I did not complete live browser QA for the compact selector interaction.
