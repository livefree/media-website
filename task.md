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

### Player Refinement Round 7

Coordinator-only rule:
- Coordinator may define scope, update task docs, dispatch agents, review ownership, and merge accepted work.
- Coordinator must not directly implement files owned by Planner, UI Shell, Data Catalog, Media Ingest, Search Filter, Detail Player, or Reviewer unless the user explicitly authorizes an exception.

Required execution order for this task:
1. Planner writes the implementation breakdown and acceptance criteria
2. Reviewer audits the current regressions, prepares the runtime QA inventory, and confirms the acceptance checklist
3. Detail Player implements only within owned files
4. Reviewer validates the result in-browser before merge
5. User review remains authoritative for visual and interaction acceptance; a user-rejected candidate is not accepted even if code review passes

Scope for this refinement:
- Route: `/media/[slug]`
- Owned surfaces: `app/media/`, `components/player/`, `components/detail/`
- No changes to unrelated UI shell, search, or data architecture unless explicitly approved

Acceptance criteria:
- The progress track and the draggable thumb must share the same vertical center line in the rendered UI
- The thumb must visually sit on the track center rather than appearing above it
- The fix must address the structural mismatch between the custom-rendered track and the native range thumb, not just nudge one side with another offset that remains browser-fragile
- Runtime sign-off must include interactive browser verification and close-up visual inspection of the progress control
- This focused round must not introduce unrelated changes to volume, speed, fullscreen, tooltip, or other accepted Round 6 behavior

Current user-requested improvement to implement:
1. Resolve the remaining structural alignment problem between the custom progress track and the native range thumb so both render on the same vertical center line.

Round 6 outcome:
- The broader Round 6 player-polish changes were accepted and merged.
- Round 7 isolates the one remaining progress-rail geometry defect so it can be fixed and reviewed independently.
