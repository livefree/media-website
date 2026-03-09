# `reference-assets` Mapping

Use this file when translating the HTML reference into reusable data contracts.

## Homepage signals from `reference-assets/main.html`

- Top nav and route split imply first-class media types: movie, series, anime.
- Search dropdown implies a reusable hot-search dataset with title, type, year, rating, and route target.
- Filter controls imply shared facets for sort, media type, genre, and year.
- Poster cards imply each media record needs:
  - slug
  - poster artwork
  - title
  - year
  - type
  - rating
  - short availability summary

## Detail-page signals from `reference-assets/page.html`

- Hero block implies:
  - canonical title
  - alternate title
  - year
  - country
  - genre list
  - summary/description
  - director and cast
- Player section implies:
  - one title can have multiple playback sources
  - a source can expand into episode-specific URLs
  - watch progress must be stored by title and optional episode
- Download section implies:
  - a title can have multiple download mirrors
  - each mirror needs provider, quality, url, masked display string, and report count
  - invalid-resource feedback must be trackable

## Behavior tables implied by the reference

- Search dropdown and search form: `SearchQuery`
- Detail page visits: `BrowseEvent`
- Player start/pause/end and resume: `PlaybackSession` and `WatchProgress`
- Resource open/copy/QR/report: `ResourceEvent`
