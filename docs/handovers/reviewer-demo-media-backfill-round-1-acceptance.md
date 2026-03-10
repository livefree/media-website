# Reviewer Acceptance: Demo Media Backfill Round 1

## Decision

Accept. Demo Media Backfill Round 1 is satisfied on `main`.

## Validation Coverage

Validated in this review:
- code-path review across the listed demo-backfill, watch, poster, and detail surfaces
- deterministic playback-backfill review in the shared catalog seed
- production build validation via `npm run build`, which passed with the current `/watch`, `/list/[publicId]`, and catalog pages

Runtime/browser validation status:
- I did not complete live browser playback QA in this session
- the acceptance below is based on code/build validation plus the provided local integration context that `/demo/demo-movie.mp4`, `/demo/demo-tv.mp4`, and `/demo/demo-anime.mp4` are intended to exist through local symlinks under `public/demo/`
- direct browser-observed playback of those local demo assets remains unverified in this session

## Acceptance Result

### 1. Placeholder or empty playback now maps deterministically to local demo assets by media type

Pass.

Evidence:
- [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L16) defines a deterministic `demoPlaybackByType` map:
  - `movie -> /demo/demo-movie.mp4`
  - `series -> /demo/demo-tv.mp4`
  - `anime -> /demo/demo-anime.mp4`
- placeholder detection is centralized through `placeholderPlaybackHost = "stream.example.com"` and `isPlaceholderPlaybackUrl(...)` in [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L22) and [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L2102)
- movie resources are backfilled through `backfillMovieResources(...)` and episodic titles through `backfillEpisodeStreams(...)` in [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L2129) and [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L2142)
- the replacement resource shape is deterministic and labeled `Local demo` in [data/media.ts](/Users/livefree/projects/media-website-v2/data/media.ts#L2117)

Reviewer conclusion:
- the backfill rule is deterministic, type-based, and limited to placeholder/empty playback contexts

### 2. The visible playback source-selection UI is gone from `/watch`

Pass.

Evidence:
- [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L1) no longer imports or renders `SourceTabs`
- the player section now renders episode navigation and `PlayerShell` directly without a visible source-selection block in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L274)

Reviewer conclusion:
- the visible source chooser has been removed from the watch-page UI

### 3. Playback still resolves through simplified first-valid-source logic

Pass.

Evidence:
- [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L66) defines `isPlayableSource(...)` and [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L70) defines `resolveActiveSource(...)`
- source resolution now prefers:
  - requested playable source if valid
  - otherwise the first valid playable source
  - otherwise the requested source or first available source as fallback
- the same simplified resolution is used for current playback and next-episode handoff in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L177) and [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L229)

Reviewer conclusion:
- the watch flow keeps a stable first-valid-source selection model after removing the visible source UI

### 4. Fallback poster treatment covers missing and non-working artwork, including known fake hosts

Pass.

Evidence:
- [components/PosterArtwork.tsx](/Users/livefree/projects/media-website-v2/components/PosterArtwork.tsx#L9) treats `static.example.com` as a known broken host
- `PosterArtwork` also falls back when the source is missing or the image errors at runtime in [components/PosterArtwork.tsx](/Users/livefree/projects/media-website-v2/components/PosterArtwork.tsx#L16) and [components/PosterArtwork.tsx](/Users/livefree/projects/media-website-v2/components/PosterArtwork.tsx#L61)
- the fallback varies by media type through `variant` labels in [components/PosterArtwork.tsx](/Users/livefree/projects/media-website-v2/components/PosterArtwork.tsx#L11)
- the shared fallback is applied on browse cards, hero posters, related cards, and queue posters in [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L12), [components/detail/DetailHero.tsx](/Users/livefree/projects/media-website-v2/components/detail/DetailHero.tsx#L24), [components/detail/RelatedRecommendations.tsx](/Users/livefree/projects/media-website-v2/components/detail/RelatedRecommendations.tsx#L21), and [components/detail/ListQueuePanel.tsx](/Users/livefree/projects/media-website-v2/components/detail/ListQueuePanel.tsx#L65)

Reviewer conclusion:
- fallback artwork coverage is shared, deterministic, and broad enough for the touched poster surfaces

### 5. Canonical watch and list behavior do not regress

Pass.

Evidence:
- `/watch` still composes canonical state through `buildCanonicalWatchStateHref(...)` in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L27)
- list-aware queue rendering and canonical list/watch links remain intact in [app/watch/page.tsx](/Users/livefree/projects/media-website-v2/app/watch/page.tsx#L251) and [components/detail/ListQueuePanel.tsx](/Users/livefree/projects/media-website-v2/components/detail/ListQueuePanel.tsx#L98)
- `MediaCard` and `RelatedRecommendations` still route through canonical watch hrefs rather than compatibility slug paths in [components/MediaCard.tsx](/Users/livefree/projects/media-website-v2/components/MediaCard.tsx#L7) and [components/detail/RelatedRecommendations.tsx](/Users/livefree/projects/media-website-v2/components/detail/RelatedRecommendations.tsx#L20)

Reviewer conclusion:
- the demo-media and poster-fallback changes do not disturb the accepted canonical watch/list flow

### 6. Local demo static-entry assumptions are documented and do not pollute git

Pass.

Evidence:
- the planner handoff explicitly documents the local demo assets in `reference-assets/` and the deterministic `/demo/...` mapping expectation in [docs/handovers/planner-demo-media-backfill-round-1.md](/Users/livefree/projects/media-website-v2/docs/handovers/planner-demo-media-backfill-round-1.md#L41)
- [/.gitignore](/Users/livefree/projects/media-website-v2/.gitignore#L13) ignores `public/demo/`, which matches the intended local symlink setup and keeps the local demo-entry layer out of git

Reviewer conclusion:
- the local demo-asset assumption is explicit enough for this round and does not pollute repository history

## Residual Validation Risk

- live verification that the symlinked `/demo/demo-movie.mp4`, `/demo/demo-tv.mp4`, and `/demo/demo-anime.mp4` assets are actually served and playable in-browser remains unverified in this session
- live visual confirmation of the fallback poster treatment on the exact affected titles also remains unverified here

## Merge Recommendation

Mergeable.

Round 1 meets the requested acceptance bar from code/build review:
- placeholder playback is deterministically backfilled by media type
- the visible watch-page source selector is gone
- playback still resolves through simplified first-valid-source logic
- fallback poster artwork covers missing, fake-hosted, and runtime-failing images across the touched surfaces
- canonical watch and list behavior does not regress
- local demo symlink assumptions stay documented and ignored by git
