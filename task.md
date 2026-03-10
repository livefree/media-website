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

### Compact Playback Source Selector Round 1

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements a compact playback-source selector near episode controls and preserves source preference across episode switches
3. Reviewer validates source selection visibility and source-sticky episode navigation before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Expose playback-source choice in the watch player UI and preserve the selected source across episode navigation
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No broader player redesign, no new public URL model, and no data-ingest architecture changes in this round

Acceptance criteria:
- The watch page must visibly expose playback-source selection in a compact form adjacent to the episode controls
- Selecting a playback source must update the active source without expanding into the old large source section
- After a source is selected, switching episodes must preserve that source preference where a matching source exists for the destination episode
- Next-episode navigation must continue preserving the current source preference
- Existing canonical watch/list URL behavior must remain intact
- Existing player controls, episode selector behavior, and routing must not regress

Current user-requested improvement to implement:
1. Explain how source selection is currently handled in the background.
2. Show playback sources in a compact form near the episode selector.
3. Keep the chosen source sticky when switching episodes.

Current baseline:
- The watch page already resolves an active playback source internally from the active episode’s available sources and the optional `r` query param.
- The player UI currently does not expose that source choice next to the episode controls, and ordinary episode switching clears the explicit source selection.
