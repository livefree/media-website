# Development Log

2026-03-08

Initial project scaffold created.

Planner:
- Expanded `docs/architecture.md` with the route map, ownership boundaries, shared component system, suggested project tree, milestone order, and explicit UI Shell handoff
- Expanded `docs/roadmap.md` into phased delivery milestones from planning through review
- Added `docs/handovers/planner-init.md` to capture the planner handoff for downstream agents

UI Shell:
- Created the initial Next.js App Router shell in `app/layout.tsx`, `app/page.tsx`, and `app/globals.css`
- Added shared homepage components in `components/` for the navbar, search box, filter bar, media grid, media cards, and pagination shell
- Added `styles/homepage.css` with the homepage visual system, gradients, card treatments, and responsive layout rules
- Refined the homepage shell semantics and interaction polish, including a search form shell, pressed filter states, list-based media grid markup, and richer pagination chips

Coordinator:
- Ran the Planner phase first to lock architecture and roadmap docs, then handed the homepage shell to the UI Shell agent for UI-owned files only
- Reviewed the agent outputs and kept delivery scoped to `/` plus shared homepage components, with `/search` and `/media/[slug]` still deferred to their owning agents
- Updated collaboration docs so each agent can perform its own git status, branch, add, and commit workflow inside its assigned scope
- Standardized the commit convention to `<type>(<agent-scope>): <summary>` for all future agent commits
- Added branch synchronization rules so downstream agents must start from the latest `codex/coordinator-baseline` and accepted work is integrated before the next dependent task begins
- Audited all module skills against the current streaming-platform roadmap and upgraded them from placeholder notes to project-specific workflows with scope, rules, and deliverables
- Standardized agent orchestration so Planner, UI Shell, Data Catalog, Search Filter, Detail Player, and Reviewer now run as Coordinator-managed sub-agents by default
- Added the missing Next.js runtime scaffold (`package.json`, TypeScript config, Next config, and ignore rules), installed dependencies, and fixed the remaining typecheck/build blockers so the project can be run locally

Reviewer:
- Performed a final integrated review across browse, search, and detail surfaces against the planner docs and `reference-assets` references
- Fixed a mobile layout regression in `styles/homepage.css` so the poster grid keeps the intended 2-column browse layout on very small screens instead of collapsing to a single column

Planner update:
- Refreshed `docs/architecture.md` into the requested planning format with an explicit project tree, routing structure, component tree, and integration notes
- Expanded the target file map to include detail/player subcomponents and shared library utility boundaries
- Updated `docs/roadmap.md` and `docs/handovers/planner-init.md` to reflect the current repository state and the next handoff sequence
- Refined the planner docs again around the canonical delivery order `planner -> data-catalog -> ui-shell -> search-filter -> detail-player -> reviewer` and added `reference-assets`-informed layout expectations for homepage, category, search, and detail routes
- Reframed the planner docs from a UI-demo sequence into a productionization roadmap, clearly separating the current implemented state from the launch target and documenting the missing backend, auth, admin, playback, and ops capabilities
- Added the planning handoff for `Player Refinement Round 2`, including task summary, owned-file boundaries, execution order, implementation checklist, and reviewer verification matrix
- Added the planning handoff for `Player Refinement Round 3`, tightening the runtime-focused implementation checklist and requiring interactive reviewer QA for slider drag, overlay geometry, control-bar hide/show, and speed-panel placement
- Added the planning handoff for `Player Refinement Round 4`, explicitly treating the Round 3 candidate as user-rejected and reframing acceptance around observable UI outcomes and user-visible reviewer validation
- Added the planning handoff for `Player Refinement Round 5`, focusing the next pass on lower-right speed panel placement, compact control-bar geometry, richer speed/volume affordances, keyboard-and-mouse-compatible volume behavior, and cursor auto-hide validation
- Added the planning handoff for `Player Refinement Round 6`, translating the six remaining player-polish requests into Detail Player outcomes and Reviewer runtime/browser checks
- Added the planning handoff for `Player Refinement Round 8`, isolating the post-Round-7 fill-containment regression and requiring the rail-local fill fix to preserve the accepted thumb/track center-line alignment
- Added the planning handoff for `Public URL Identity Round 1`, defining the opaque public-ID strategy, canonical `/watch` URL shape, Prisma identity changes, migration path away from slug-based playback links, and phased acceptance boundaries

UI Shell update:
- Reworked the homepage shell in `app/page.tsx` to match the `/reference-assets` hierarchy more closely with a compact navbar, dedicated search area, filter controls, poster-first grid, and static pagination shell
- Updated `components/Navbar.tsx`, `components/SearchBox.tsx`, `components/FilterBar.tsx`, `components/MediaCard.tsx`, and `components/MediaGrid.tsx` to stay presentation-only while using placeholder homepage data
- Rewrote `styles/homepage.css` around the reference layout with denser cards, badge overlays, responsive nav and filter behavior, and 2:3 poster treatments
- Replaced homepage-local placeholders with shared catalog helpers and expanded the same browsing shell to `/movie`, `/series`, and `/anime` through shared UI components
- Refit the shared top browse layout so the desktop search lives in the navbar, hot-search treatment is compact, and the filter row sits much closer to the grid in the `reference-assets/main.html` style
- Tightened the top browse hierarchy again so the navbar is calmer, intro copy is shorter, hot searches are inline beneath the intro, and the filter block matches the screenshot-style quick-chip plus labeled-select layout more closely
- Rebuilt the shared browse shell with fidelity-first priority against `reference-assets/main.html`, flattening the navbar, simplifying the intro/results header structure, and shifting poster cards toward the reference page's lighter border-box density
- Tightened the fidelity pass further by restoring the MA badge and two-line brand block, sharpening the search/filter/header geometry, and pushing browse cards closer to the target screenshot's spacing and badge rhythm

Data Catalog:
- Rebuilt `skills/data-catalog/` into a reusable skill for streaming-platform schema design, mock catalog generation, and browse/watch analytics modeling
- Added `prisma/schema.prisma` with a PostgreSQL-ready relational schema covering media titles, episodic hierarchy, resources, users, preferences, search history, browse events, playback sessions, progress tracking, lists, and rating snapshots
- Added shared contracts in `types/media.ts` and `types/platform.ts` for catalog, resource, user, and behavior data
- Added shared seed-ready data in `data/categories.ts`, `data/media.ts`, and `data/platform.ts` to cover movie, series, anime, user state, and browse/resource activity
- Added reusable catalog helpers in `lib/media-catalog.ts` and `lib/media-utils.ts` for downstream search, detail, and homepage integration

Search Filter:
- Added URL-backed search state helpers in `lib/search-params.ts`, `lib/search-filter.ts`, and `lib/pagination.ts`
- Built `app/search/page.tsx` to reuse the shared browse shell with query, type, sort, genre, region, year, and page state reflected in the URL
- Narrowly upgraded shared shell components so the search box, filters, navbar search action, and pagination can submit or link into the real search route
- Wired the browse routes and `/search` to the same URL-backed facet state model so `Sort`, `Type`, `Genre`, `Region`, and `Year` now update results live, keep pagination/counts in sync, and preserve state across refresh and navigation
- Refined the shared catalog contracts around browse-card, search-seed, detail, playback-source, episode, and download-resource projections so downstream UI, Search, and Detail agents can consume one stable media shape
- Expanded category config and mock catalog records to cover route targets, region facets, multi-source playback cases, episode-level downloads, and related-media/detail helper needs

Detail Player:
- Added `/media/[slug]` in `app/media/[slug]/page.tsx`, driven by `getMediaDetail()` and query-param selection for active source, episode, and download provider
- Added owned detail and player components in `components/detail/` and `components/player/` for the metadata header, actions area, synopsis, source tabs, player shell, episode selector, and download resource section
- Added local CSS-module styling in `components/detail/detail-page.module.css` so the detail route can ship without modifying shared browsing styles
- Rebuilt the detail page again for higher fidelity to `reference-assets/page.html` and the three reference screenshots, including denser metadata, flatter dark panels, a black player viewport, colorful netdisk actions, and a related-poster strip
- Replaced the shell player with a real client-side video player using `hls.js`, custom keyboard-first controls, next-episode routing, volume and speed panels, theater/fullscreen modes, and stable public demo HLS/MP4 sources for `/media/the-dinosaurs`
- Refined the player again for Round 5 by tightening the control bar density, showing playback rate directly on the speed button, adding four-state volume icon feedback, temporarily revealing the volume rail on keyboard changes, lifting the speed panel above the compact control row, and auto-hiding the cursor during idle playback
- Patched the Round 5 follow-up by making mute/unmute update the live video element immediately, strengthening the volume button's visible state markers, and raising the speed panel farther above the compact control bar
- Patched the remaining Round 5 QA failures by allowing `M` mute/unmute to work even when a player range control keeps focus, and by lifting the speed panel farther above the compact control bar to avoid overlap
- Refined the player again for Round 4 by isolating source loading from volume/rate changes, converting volume into an inline expanding rail that visibly shifts the time label, restoring a black auto-hiding control bar, and moving the speed panel into the lower-right control area
- Patched the Round 4 follow-up by making the speed panel conditional on the speed toggle and moving the black/hidden control-bar state onto `.playerChrome` itself so the remaining runtime QA failures can be observed directly
- Refined the real player again for Round 2 by restoring media+episode resume keys, fixing hover-only volume rail geometry, tightening the compact speed panel behavior, and preserving watched/scroll continuity on the detail route
- Refined the player interactions with hover-only tooltips, inline hover volume control, smaller auto-closing speed panel, click-to-toggle video surface, resume-from-breakpoint persistence, watched-episode dimming, and non-jumping episode/source query transitions
- Refined the player for Round 6 by removing the redundant volume meter, matching the volume thumb to the progress thumb, correcting progress-thumb alignment, centering fullscreen playback, moving the speed popup to the player edge, and preventing play-tooltip clipping
- Refined the player for Round 7 by restructuring the progress rail so the custom track and native range input share one grid-aligned center line instead of relying on separate offset math
- Refined the player for Round 8 by restoring a rail-local positioning context for the played and buffered fill layers so progress fill stays clipped inside the track without disturbing the Round 7 center-line alignment
- Added the first opaque public watch runtime by introducing `/watch?v=...` resolution via shared public IDs, converting detail-page owned watch entry points to canonical watch URLs, and turning `/media/[slug]` into a compatibility redirect that maps legacy slug/source/download params into opaque media, episode, and resource IDs

Coordinator foundation:
- Added the first productionization slice with `.env.example`, Prisma/NPM database scripts, server-side env helpers, and a reusable Prisma client singleton
- Added minimal read-only API surfaces at `/api/health`, `/api/catalog`, and `/api/media/[slug]` so the app now has a real server boundary to build on beyond route-local rendering

Media ingest enrichment:
- Added a second-stage enrichment scaffold that converts local ingest entries into deterministic metadata lookup candidates with provider-specific placeholder slots
- Added a reviewed metadata overlay in `import-data/media-metadata-reviewed.json` with first-pass verified or manual-review outcomes for the current local library sample
- Added a third-stage import seed generator and a fourth-stage Prisma payload generator so local library assets can now move from raw scan -> reviewed metadata -> import seed -> Prisma-friendly staging payload
- Added a safe Prisma import runner that defaults to dry-run summary mode and only writes to the database when called with `--apply` and a configured `DATABASE_URL`

Media Ingest:
- Added a new Media Ingest role and ownership boundaries in `AGENTS.md`, plus README notes and an `ingest:scan` script entry for local library scanning
- Implemented `scripts/media-ingest-scan.mjs` as a deterministic local ingest pass that recursively scans `import-video/`, classifies asset types, infers conservative title/year/type/episode clues, and runs `ffprobe` on video files when available
- Generated the first staging artifact at `import-data/media-ingest-manifest.json` for review before later metadata enrichment or catalog import work
- Added `scripts/media-enrich-candidates.mjs` and an `ingest:enrich` script entry to turn the ingest manifest into deterministic metadata candidate review records without performing live scraping
- Generated `import-data/media-metadata-candidates.json` with normalized local title/year/type data, provider-specific lookup placeholders, review statuses, confidence scores, and uncertainty notes for later human or automated enrichment
- Added `scripts/media-generate-import-seed.mjs` and an `ingest:seed` script entry to merge the local ingest manifest with the reviewed metadata overlay into a DB-import-friendly staging seed
- Generated `import-data/media-import-seed.json` with title identity, local source directories, review status, artwork candidates, movie vs episodic breakdowns, episode file references, ffprobe metadata, and pending provider/resource mapping placeholders

Reviewer:
- Audited `/media/[slug]` against the active `Player Refinement Round 2` checklist and wrote `docs/handovers/reviewer-player-refinement-round-2.md` with blocking findings, pass/fail acceptance criteria, and follow-up validation steps for Detail Player
- Baseline-reviewed `Player Refinement Round 3` from the updated task and planner handoff, and wrote `docs/handovers/reviewer-player-refinement-round-3.md` with runtime QA inventory, explicit pass/fail checks, and pre-implementation code risks for Detail Player
- Baseline-reviewed `Player Refinement Round 4` from the updated task and AGENTS rules, treating the user rejection as authoritative evidence that the player regressions remain open, and wrote `docs/handovers/reviewer-player-refinement-round-4.md` with observable QA checks and reimplementation risks
- Baseline-reviewed `Player Refinement Round 5` from the updated task and current player baseline, and wrote `docs/handovers/reviewer-player-refinement-round-5.md` with visible acceptance checks, keyboard and mode QA inventory, and pre-implementation UI/runtime risks
- Baseline-reviewed `Player Refinement Round 6` from the latest `main` task state and wrote `docs/handovers/reviewer-player-refinement-round-6.md` with runtime-visible acceptance checks, mode-aware QA coverage, and remaining geometry/alignment risks
- Baseline-reviewed `Player Refinement Round 8` from the latest `main` task state and wrote `docs/handovers/reviewer-player-refinement-round-8.md` with a narrow runtime checklist focused on rail-local fill containment while preserving the accepted Round 7 center-line alignment
- Accepted candidate `1c83c75` for `Catalog Filter Round 1` after runtime QA confirmed the duplicate quick-filter row and Apply button were gone, filters updated live on browse and search routes, and the expanded 21-title dataset exercised meaningful facet combinations
- Accepted candidate `8e2ff77` for `Player Refinement Round 8` after runtime QA confirmed the played/buffered fill is clipped to the rail again and the accepted Round 7 thumb/track alignment remains intact
- Accepted candidate `1c27f60` for `Player Refinement Round 7` after runtime close-up QA evidence confirmed the progress track and native thumb now share one structural vertical center line in the rendered UI
- Reviewed candidate `0e9ca92` for `Player Refinement Round 6`, wrote `docs/handovers/reviewer-player-refinement-round-6-acceptance.md`, and withheld merge acceptance pending the required runtime QA pass
- Reassessed candidate `0e9ca92` using completed runtime QA evidence and updated `docs/handovers/reviewer-player-refinement-round-6-acceptance.md` to accept the Round 6 candidate as mergeable

Coordinator:
- Escalated the player work into `Player Refinement Round 3`, adding explicit runtime QA requirements in `task.md` and clarifying in `AGENTS.md` that Reviewer owns interactive browser validation while Coordinator stays out of Detail Player implementation scope
- Rejected the Round 3 player candidate after user review reported no observable improvement, and escalated the work into `Player Refinement Round 4` with explicit rules that unvalidated or user-rejected UI candidates must remain unmerged
- Opened `Player Refinement Round 5` to focus the next pass on control-density redesign, speed/volume button affordances, volume-memory behavior, and auto-hiding mouse cursor behavior after the major Round 4 regressions were cleared
- Established project versioning rules, set the current baseline to `0.6.0`, and documented how future Coordinator integrations must bump versions consistently
- Bumped the project version to `0.7.0` after Catalog Filter Round 1 because the prototype now has real URL-backed live facets and materially broader catalog coverage rather than placeholder-only browse controls
- Added `docs/current-state-overview.md` to summarize the current frontend, backend, database, ingest pipeline, implemented capability set, and the primary missing functions still blocking a launch-ready platform
- Opened `Player Refinement Round 6` to focus the next pass on residual player polish: removing redundant volume meter UI, tightening slider/thumb geometry, fixing fullscreen vertical centering, aligning the speed popup to the player edge, and preventing tooltip clipping
- Opened `Player Refinement Round 7` as a single-issue follow-up focused only on the structural alignment defect between the custom progress track and the native range thumb so planner, detail-player, and reviewer can isolate and verify one geometry fix at a time
- Opened `Player Refinement Round 8` as a containment-only follow-up after Round 7, isolating the regression where the custom played/buffered fill layers escaped the rail and rendered as a large red block across the left side of the control bar
- Opened `Catalog Filter Round 1` to convert the homepage/search filter section from placeholder chrome into a real live-filtering surface, remove the redundant quick-filter chip row, and expand catalog coverage data for more realistic facet testing
- Opened `Public URL Identity Round 1` to introduce an opaque public-ID and watch-URL scheme so the site can stop exposing media slugs, episode slugs, and provider details in clear text while still supporting future playlist/list contexts

2026-03-09

Data Catalog:
- Expanded the shared catalog dataset from 7 to 21 titles across movie, series, and anime, adding older years, more regions, and denser genre overlaps so Catalog Filter Round 1 has meaningful type/genre/region/year/sort/pagination combinations to exercise
- Added a reusable coverage summary helper in `lib/media-catalog.ts` so downstream search/review work can verify total pages and type/genre/region/year pair counts without relying on UI-only inspection
- Added stable opaque `med_/ep_/res_` public IDs across shared catalog data, introduced canonical `/watch?v=...` identity helpers and public-ID lookup utilities in `lib/media*`, and extended Prisma planning for `MediaTitle`, `Episode`, `Resource`, `UserList`, and `UserListItem` while keeping slug routes as compatibility-only identifiers for the next Detail Player round

UI Shell:
- Removed the redundant browse/search quick-filter chip row and the visible Apply button from the shared filter presentation, keeping the facet controls balanced and ready for Search Filter to wire live updates next

Reviewer:
- Baseline-reviewed `Public URL Identity Round 1` from the latest `main` task state and wrote `docs/handovers/reviewer-public-url-round-1.md` with acceptance checks for opaque `/watch` URLs, public-ID coverage, slug-route compatibility, and first-slice runtime validation
- Accepted candidate `004da1e` for `Public URL Identity Round 1` after runtime QA confirmed legacy `/media/[slug]` playback URLs canonicalize to opaque `/watch?v=...&e=...&r=...` URLs without leaking media slugs, episode slugs, or provider details
