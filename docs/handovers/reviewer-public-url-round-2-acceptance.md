# Reviewer Acceptance: Public URL Identity Round 2

## Decision

Accept. Public URL Identity Round 2 is already satisfied on `main`.

## Scope Reviewed

- Active task: [task.md](/Users/livefree/projects/media-website-v2/task.md#L14)
- Planner handoff: [docs/handovers/planner-public-url-round-2.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-public-url-round-2.md#L1)
- Implementation surfaces reviewed:
  - [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L1)
  - [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L1)
  - [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L1)
  - [components/detail/RelatedRecommendations.tsx](/Users/livefree/projects/media-website-v2/components/detail/RelatedRecommendations.tsx#L1)
  - [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L1)
  - [lib/media-utils.ts](/Users/livefree/projects/media-website-v2/lib/media-utils.ts#L1)
  - [types/media.ts](/Users/livefree/projects/media-website-v2/types/media.ts#L1)
  - [types/platform.ts](/Users/livefree/projects/media-website-v2/types/platform.ts#L1)
  - [data/platform.ts](/Users/livefree/projects/media-website-v2/data/platform.ts#L1)

## Acceptance Result

### 1. Canonical public entry points now default to `/watch?...`

Pass.

Evidence:
- shared browse/search card entry links now use `item.canonicalWatchHref || item.href` in [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L6), and the shared card shape now sets both `href` and `canonicalWatchHref` to the canonical watch URL in [lib/media-utils.ts](/Users/livefree/projects/media-website-v2/lib/media-utils.ts#L188)
- related/recommendation entry links on the detail/watch surface now use `item.canonicalWatchHref` directly in [components/detail/RelatedRecommendations.tsx](/Users/livefree/projects/media-website-v2/components/detail/RelatedRecommendations.tsx#L18)
- shared search suggestions also now resolve `href` to `media.canonicalWatchHref` in [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L70)

Reviewer conclusion:
- the touched public browse, search, and recommendation surfaces now prefer canonical `/watch?...` entry URLs instead of defaulting to compatibility slug routes

### 2. Canonical watch URLs still avoid slug/provider leakage

Pass.

Evidence:
- canonical watch URLs are built centrally by [lib/media-utils.ts](/Users/livefree/projects/media-website-v2/lib/media-utils.ts#L38) using opaque `v`, `e`, `r`, `list`, and `li` parameters rather than slug or provider-label parameters
- the compatibility route in [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L70) redirects into `buildWatchHref(...)` rather than remaining the default public URL shape

Reviewer conclusion:
- Round 2 preserves the Round 1 opaque public URL requirement

### 3. Shared contracts now concretely cover future `list` and `li` watch context

Pass.

Evidence:
- `PublicWatchQuery` now includes `listPublicId` and `listItemPublicRef` in [types/media.ts](/Users/livefree/projects/media-website-v2/types/media.ts#L10)
- `PublicListContext`, `PublicMediaList`, and `PublicMediaListItem` are carried through the shared media contract layer in [types/media.ts](/Users/livefree/projects/media-website-v2/types/media.ts#L21) and [types/media.ts](/Users/livefree/projects/media-website-v2/types/media.ts#L322)
- canonical URL composition now accepts `listPublicId` and `listItemPublicRef` in [lib/media-utils.ts](/Users/livefree/projects/media-website-v2/lib/media-utils.ts#L38) and [lib/media-utils.ts](/Users/livefree/projects/media-website-v2/lib/media-utils.ts#L69)
- shared list seed data is concrete, not theoretical, via `PublicListRecord` in [types/platform.ts](/Users/livefree/projects/media-website-v2/types/platform.ts#L56) and `publicLists` in [data/platform.ts](/Users/livefree/projects/media-website-v2/data/platform.ts#L130)
- list/list-item public playback composition is resolved into app-facing records in [lib/media-catalog.ts](/Users/livefree/projects/media-website-v2/lib/media-catalog.ts#L102)

Reviewer conclusion:
- future list/list-item playback context is now a real shared-data path rather than only a planner note or schema placeholder

### 4. Existing `/media/[slug]` behavior remains compatibility-only

Pass.

Evidence:
- the compatibility page in [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L59) does not render a separate canonical experience; it resolves legacy slug inputs and redirects into canonical `/watch?...` state
- the legacy route also forwards `list`, `li`, and `t` through the redirect in [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L78)

Reviewer conclusion:
- the old slug route remains a compatibility entry point, not the preferred public URL

### 5. Detail-player implementation round requirement

No additional detail-player implementation round was required for Round 2.

Reason:
- the existing canonical `/watch` page already preserves `list` and `li` context across episode/resource transitions through `buildCanonicalWatchStateHref(...)` in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L27)
- the existing compatibility redirect already preserves the same watch context when legacy `/media/[slug]` URLs are opened in [app/media/[slug]/page.tsx](/Users/livefree/projects/media-website-v2/app/media/[slug]/page.tsx#L78)
- the detail-owned recommendation surface already points to canonical watch hrefs in [components/detail/RelatedRecommendations.tsx](/Users/livefree/projects/media-website-v2/components/detail/RelatedRecommendations.tsx#L18)

Reviewer conclusion:
- detail-player was not required this round because the current `/watch` flow and compatibility redirect behavior already preserve the needed watch context for the Round 2 scope

## Blocking Findings

None.

## Merge Recommendation

Round 2 is accepted.

The current `main` implementation satisfies the active task:
- public entry surfaces now default to canonical `/watch?...` URLs
- canonical public URLs remain opaque
- list/list-item context is concrete in shared contracts and seed-level app-facing data
- `/media/[slug]` remains compatibility-only
- no additional detail-player implementation work is required for this round
