# Planner Handoff: Public URL Identity Round 5

## Task summary

Public URL Identity Round 5 is the first broader product slice after the accepted Round 3/4 baseline.

Current baseline already provides:

- canonical opaque `/watch?...` playback URLs
- a real `/list/[publicId]` page
- a visible homepage featured-list entry surface
- list-aware watch playback with previous/next item context

What is still missing is the richer public list product layer:

- broader public list discovery beyond one homepage section
- share-ready public list surfaces
- a stronger playlist-style queue experience once playback has started

Round 5 should solve those three gaps only.

## Round 5 objective

Deliver one realistic public-list product slice that improves:

1. public list discovery
2. share-readiness of public list surfaces
3. playlist-style queue UX inside `/watch`

This round should make public lists feel more discoverable and more usable without crossing into authenticated authoring or full playlist-system complexity.

## Explicit out of scope

Round 5 must explicitly not implement:

- authenticated list authoring or editing
- admin workflows
- full queue management systems
- list reordering
- list creation forms
- per-user saved queue state
- collaboration or moderation workflows
- any regression of opaque canonical URL rules
- any return to slug-based canonical list or watch URLs

## Execution order

1. `planner`
- publish this Round 5 handoff

2. `data-catalog`
- extend shared public-list discovery, sharing, and queue contracts

3. `ui-shell`
- build broader public list discovery surfaces and share-ready list pages

4. `detail-player`
- extend `/watch` with a stronger read-only playlist-style queue experience using the shared list data

5. `reviewer`
- validate discovery flow, share surfaces, queue behavior, canonical URL rules, and adherence to scope

## Ownership boundaries

### Data Catalog owned scope

- `data/`
- `types/`
- `lib/media*`
- `prisma/schema.prisma`
- import payload/planning artifacts only if needed for public-list discovery or sharing planning

Data Catalog owns the shared list-discovery and queue contracts that UI Shell and Detail Player consume.

### UI Shell owned scope

- `app/`
- `components/`
- `styles/`

UI Shell owns public list discovery surfaces and share-ready public list page presentation.

### Detail Player owned scope

- `app/media/`
- `app/watch/`
- `components/player/`
- `components/detail/`

Detail Player owns the stronger playlist-style queue UX inside `/watch`.

### Reviewer scope

- docs and runtime/browser validation only
- no implementation takeover of Data Catalog, UI Shell, or Detail Player files

## In scope

### 1. Broader public list discovery

Round 5 must move beyond a single homepage featured-lists block.

Minimum acceptable slice:

- one broader public discovery surface in addition to the existing homepage feature module

Recommended direction:

- a dedicated public list index or directory page such as `/lists`
- plus a clear shared public entry path into it

Acceptable entry examples:

- navbar or browse-shell link into the public list directory
- a browse-shell section that links into the directory
- a richer list-discovery section that exposes more than the single current homepage module

The key requirement is that users can discover public lists from more than one thin homepage-only surface.

### 2. Share-ready public list surfaces

The public list page must become share-ready in visible user terms.

Minimum expectations:

- canonical public list URL is clear and stable
- the page exposes copy/share affordances for that canonical list URL
- the list identity shown to the user remains public-ID based at the URL layer, not slug-based
- share actions do not fall back to compatibility slug URLs

This does not require a full social sharing platform. It does require user-facing list sharing readiness.

### 3. Stronger playlist-style queue UX inside `/watch`

The current previous/next list-item affordance is a start, but Round 5 should feel more like a lightweight queue.

Minimum expectations:

- visible queue context for the active public list
- current item clearly marked
- nearby/upcoming items visible in a small queue presentation
- queue items link through canonical list-aware `/watch?...&list=...&li=...` URLs
- transitions through that queue keep the active list context intact

This should remain a read-only queue experience derived from the public list order, not a mutable queue-management system.

## Data Catalog implementation checklist

### Discovery contracts

- Extend shared public-list summary shapes so UI Shell can render a broader discovery surface, not just a single featured section.
- Support a public list directory/index record if needed.
- Keep canonical list href generation centralized in shared helpers.

Recommended additions if useful:

- `PublicListDirectoryRecord`
- `PublicListDiscoveryCard`
- discovery grouping or ranking metadata

### Share-ready contracts

- Ensure public list page records expose a canonical list href as first-class data.
- Provide any page-level fields needed for sharing surfaces, such as:
  - canonical list href
  - share title
  - share description
  - cover artwork

### Queue contracts

- Extend list-page or resolved-playback contracts so `/watch` can render a stronger queue slice without recomputing list structure ad hoc in the page component.
- Provide queue-friendly fields such as:
  - current item identity
  - total item count
  - surrounding items window or ordered item list
  - next-up metadata

Important constraint:

- queue data must still derive from the existing public list model and canonical watch-context rules
- do not invent a separate mutable queue system in Round 5

## UI Shell implementation checklist

### Broader discovery

- Add one broader public list discovery surface beyond the existing homepage featured-lists section.
- Preferred implementation: a real public list directory page plus a visible entry point into it.
- Keep the discovery flow driven by shared list data and canonical list hrefs.

### Share-ready public list page

- Upgrade the `/list/[publicId]` experience so it feels share-ready.
- Expose clear copy/share affordances for the canonical public list URL.
- Keep the canonical public list identity opaque at the URL layer.

### Scope control

- Do not turn this into a total browse redesign.
- Do not build list editing or authoring controls.
- Do not implement logged-in personalization for list discovery in this round.

## Detail Player implementation checklist

### Stronger queue UX

- Extend `/watch` so the active public list feels like a small playlist queue, not just previous/next buttons.
- Show the active item and nearby items clearly enough that a user understands the current queue context.
- Make queue items clickable through canonical list-aware watch URLs.

### List-context preservation

- Queue navigation must preserve `list` and update `li` correctly.
- Episode/resource/source transitions that remain within the same active queue item must preserve `list` / `li`.
- Share/copy URLs inside the watch page must remain canonical and list-aware.

### Scope control

- This is not a full queue manager.
- Do not implement remove/reorder/drag/drop/history-based queue mutation.
- Do not regress the accepted Round 3/4 list-context behavior.

## Reviewer validation sequence

Reviewer sign-off must validate the Round 5 slice end to end.

### 1. Broader discovery check

- Confirm there is now a broader public list discovery flow beyond the existing homepage section.
- Confirm a user can discover multiple public lists through a real shared surface.

### 2. Canonical list identity check

- Confirm list discovery and list pages still use opaque canonical public identity.
- Confirm no readable slug URL becomes the canonical public list route.

### 3. Share-ready list-page check

- Open a public list page and verify there are user-visible share/copy affordances.
- Confirm those affordances use the canonical public list URL, not a compatibility slug URL.

### 4. Queue UX check

- Enter `/watch` from a public list flow.
- Verify the queue experience is visibly stronger than simple previous/next navigation.
- Confirm current item, nearby/upcoming items, and queue navigation are understandable in the rendered UI.

### 5. List-aware transition check

- Trigger queue item navigation and verify `list` / `li` are preserved correctly.
- Trigger source/resource/episode transitions and verify in-scope state still preserves list context.

### 6. Scope guard

- Confirm no authenticated authoring/editing UI appeared.
- Confirm no admin workflow surfaced.
- Confirm no full queue-management system was added.
- Confirm canonical opaque URL rules did not regress.

## Acceptance criteria

Round 5 passes only if:

- a broader public list discovery flow exists beyond the single homepage section
- public list surfaces are share-ready with canonical public list URLs
- `/watch` exposes a stronger playlist-style queue experience for active public lists
- queue-driven and in-scope watch transitions preserve canonical list-aware URL state
- no canonical opaque URL rule regresses
- no authenticated authoring/editing, admin workflow, or full queue-management system is introduced

Round 5 fails if:

- public list discovery still depends on only one thin homepage surface
- share affordances fall back to readable slug URLs or compatibility paths
- the watch queue experience is still effectively only previous/next with no stronger visible queue context
- queue navigation drops `list` / `li`
- the work drifts into authoring, admin, or full queue-management scope
- canonical `/watch?...` and opaque public-ID rules regress

## Recommended realistic Round 5 slice

To keep this round realistic, the recommended implementation slice is:

### Data Catalog

- add shared list-directory and queue-ready contracts

### UI Shell

- add a public list directory or equivalent broader discovery surface
- add visible share/copy affordances on the public list page

### Detail Player

- upgrade `/watch` from previous/next list navigation to a compact read-only queue panel

This is enough to make public lists feel meaningfully more productized without crossing into full playlist-system complexity.

## Recommendation summary

Round 5 should be treated as a public-list experience round:

- broader discovery
- share-ready list pages
- stronger read-only queue UX in `/watch`

It must remain explicitly below the threshold of authenticated editing, admin tooling, or a full queue-management system.
