# Reviewer Findings: Immersive Chrome Auto-Hide Round 1

## Decision

Findings only. I am not accepting this round yet.

## Why acceptance is withheld

This round's acceptance is explicitly runtime-visible and timing-sensitive: theater and fullscreen must hide the control bar, top title, and cursor together after 3 seconds of inactivity, then reveal them together again on interaction. I validated the implementation direction from code review and confirmed `npm run build` passes, but I could not complete browser-runtime validation in this session.

I used the local [$playwright-interactive](/Users/livefree/.codex/skills/playwright-interactive/SKILL.md) guidance because this task clearly needs interactive browser QA. That workflow requires `js_repl`, but this session does not expose a `js_repl` tool, so I could not run the intended runtime verification path here.

## Blocking finding

1. Runtime/browser confirmation is still missing for the 3-second synchronized hide/reveal behavior.
   - The code now defines a dedicated immersive delay of `3000` ms in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L19) and uses a shared immersive branch to hide both controls and cursor together in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L508).
   - The immersive top title derives from the same `isControlsVisible` state in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1065) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1093), with matching visible/hidden CSS states in [components/detail/detail-page.module.css](/Users/livefree/projects/media-website-v2/components/detail/detail-page.module.css#L681).
   - However, I did not verify in-browser that theater mode and fullscreen mode actually hide all three elements after the same visible 3-second idle window, or that interaction restores them without drift.

## Code/build observations

- The player now distinguishes non-immersive and immersive auto-hide delays with `1800` ms vs `3000` ms in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L19) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L526).
- In immersive mode, the same timeout callback now hides both the control bar and cursor together in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L526), which is the right structural direction for eliminating drift.
- The immersive title overlay remains structurally tied to `isControlsVisible`, not a separate timer, in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1071) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1120).
- Non-immersive behavior appears intentionally preserved with the old `1800` ms split logic and the non-immersive `onMouseLeave` path in [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L531) and [components/player/PlayerShell.tsx](/Users/livefree/projects/media-website-v2/components/player/PlayerShell.tsx#L1100).
- I did not find an obvious code-level regression to playback controls, title display, or routing from this round.
- `npm run build` passed.

## Runtime QA still required before acceptance

1. Enter theater mode, stop interacting, and confirm that after 3 seconds the control bar, top title, and cursor all hide together.
2. In theater mode, interact again and confirm the same three elements reappear together.
3. Enter fullscreen mode, stop interacting, and confirm that after 3 seconds the control bar, top title, and cursor all hide together.
4. In fullscreen mode, interact again and confirm the same three elements reappear together.
5. Watch for visible stagger or drift between any of the three elements during both hide and reveal.
6. Confirm inline/non-immersive playback still behaves as before.

## Current recommendation

Do not treat this round as reviewer-accepted yet. The implementation looks directionally correct from code/build review, but the visible 3-second synchronization behavior still needs browser-runtime verification.
