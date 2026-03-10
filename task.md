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

### Episode Navigation And Selector Round 3

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Detail Player implements the popup-visual feedback refinements inside the watch/player surface
3. Reviewer validates current-episode emphasis and non-active option contrast before merge
6. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Episode-popup visual emphasis refinements only
- Owned surfaces:
  - Detail Player: `app/media/`, `app/watch/`, `components/player/`, `components/detail/`
  - Planner/Reviewer: docs and acceptance only
- No unrelated browse redesign, auth flow, admin tooling, or broader player redesign beyond these episode-navigation rules

Acceptance criteria:
- The current episode in the popup must stand out more clearly by rendering its numeric label in red
- Non-active popup options must have a noticeably stronger border-color change for hover/focus/selection movement
- Existing `N` / `E` shortcuts, popup layout, canonical routing, and next-episode behavior must not regress

Current user-requested improvement to implement:
1. Make the current episode much more obvious by rendering its number in red inside the popup.
2. Increase the visual distinction of the focused/hovered candidate episodes by deepening the border-color change.

Current baseline:
- The popup entry, popup stability, dense numeric layout, and episode counts are already in place from the previous rounds.
- The remaining issues are limited to insufficient current-item emphasis and weak visual contrast for the hovered/focused candidate episode buttons.
