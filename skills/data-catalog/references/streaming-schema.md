# Streaming Schema Reference

Use this file when the task needs durable database modeling rather than only UI mock data.

## Core entities

- `User`: account, plan, locale, and ownership root for behavior data.
- `UserPreference`: autoplay, provider preference, genre preference, and content filters.
- `MediaTitle`: canonical title record for movie, series, anime, or documentary.
- `Season` and `Episode`: episodic hierarchy for series/anime. Movies can skip seasons.
- `Person` and `MediaCredit`: normalized cast and crew relations.
- `Genre`, `Tag`, `Country`: browse facets and search filters.
- `Artwork`: poster, backdrop, thumbnail, and logo assets.
- `Resource`: playable streams, download mirrors, subtitles, or trailers.
- `SearchQuery`, `BrowseEvent`, `WatchProgress`, `PlaybackSession`, `ResourceEvent`: user behavior and operational analytics.

## Invariants

- A title owns metadata; a resource owns access details and health state.
- Episodic content stores one `MediaTitle` plus child seasons/episodes.
- Search history and browse events should be append-only.
- Continue-watching state should be mutable and compact.
- Resource invalidation feedback belongs to the resource record plus a separate event trail.

## Suggested indexes

- Unique slugs on `MediaTitle`, `Person`, `Genre`, and `Tag`.
- Composite indexes for `Resource(mediaId, kind, status)` and `BrowseEvent(mediaId, eventType, createdAt)`.
- Query history indexes on `(userId, createdAt)` and normalized query text.
- Playback indexes on `(userId, startedAt)` and `(mediaId, startedAt)`.

## Data shape guidance

- UI-facing catalog records should include:
  - title, original title, type, year, genres, rating, badge, images
  - aggregate resource counts
  - enough credit data for detail pages and search enrichment
- Analytics seed data should include:
  - recent searches
  - page/detail/player events
  - continue-watching checkpoints
  - resource actions like open, copy, QR scan, and invalid-report
