# Project Task

Recreate the front-end structure of a modern streaming-style media catalog website.

Pages required:

/
/movie
/series
/anime
/search
/media/[slug]

Shared components:

Navbar
SearchBox
FilterBar
MediaCard
MediaGrid
Pagination
PlayerShell

## Current Active Task

### Player Resume And Startup Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements the resume/startup behavior changes inside the watch/player surface
3. Reviewer validates resume rules, startup behavior, and playback continuity before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Player resume persistence rules, startup/autoplay behavior, and resume-aware preload behavior
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign, auth flow, admin tooling, data-catalog rewrites, or broader player redesign beyond these resume/startup rules

Acceptance criteria:
- Resume points must not be recorded when the user exits within the first 30 seconds
- Resume points must not be recorded when the user exits within the final 30 seconds; that case should be treated as completed / no resume
- Persisted resume points must snap to 5-second precision
- Entering the watch page must not auto-play video; playback starts only after explicit user action
- Preload behavior may prepare media before play, and if a valid resume point exists the preload flow should begin from that resume point rather than from time 0
- Reviewer sign-off must confirm the resume/startup rules work without regressing existing watch/list behavior

Current user-requested improvement to implement:
1. Do not record a resume point if the user exits within the first 30 seconds.
2. If the user exits within the final 30 seconds, treat the video as completed and do not keep a resume point.
3. Store resume points at 5-second precision.
4. Do not auto-play when entering the video page; playback should start only after user interaction.
5. Allow preload/buffering before playback, and when a valid resume point exists, bias preload from that resume point.

Current baseline:
- The player already persists local resume data and restores it on reopen, but the current thresholds and precision do not match the requested first-30s / last-30s / 5-second rules.
- The player may currently restore and continue too aggressively relative to the desired no-autoplay startup behavior.
- Preload is currently lightweight and not explicitly aligned with resume-aware startup behavior.
