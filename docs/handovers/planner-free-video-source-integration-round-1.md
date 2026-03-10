# Planner Handoff: Free Video Source Integration Planning Round 1

## Task summary

This round does not add runtime playback code. It defines the lawful production workflow for replacing the old local demo-video dependency with a real free-video onboarding and publishing system.

The plan must stay inside authorized free-to-publish sources only:

- public-domain catalogs
- Creative Commons libraries
- direct creator or rightsholder uploads
- explicitly licensed free catalogs or partner feeds

This round does **not** authorize scraping, bypassing protected hosts, or importing assets with unclear rights.

## Current baseline

The repository now has:

- canonical public watch URLs centered on `/watch?v=...&e=...&r=...`
- Prisma models for `MediaTitle`, `Episode`, `Resource`, lists, progress, and playback sessions
- a shared media catalog contract that can resolve media, episodes, resources, and list playback context
- placeholder playback resources after the local `/demo/...` dependency was removed

The repository does **not** yet have:

- a lawful intake pipeline for external free-video sources
- provenance or rights-verification records
- ingest-job orchestration
- hosted mezzanine/transcode/package outputs
- object-storage or CDN asset management
- moderation and takedown workflow
- automated resource-health monitoring for real hosted playback

## Planning principles

1. Public URL identity stays opaque.
   Existing canonical `/watch` public-ID semantics stay intact in this planning round.

2. Rights come before ingest.
   No asset should enter the transcode or publication pipeline without a recorded source class, provenance record, and review outcome.

3. Internal hosting becomes the default publish target.
   Authorized external resources may remain as transitional or fallback references, but the durable target architecture is internally hosted packaged playback.

4. Editorial metadata and media operations are separate concerns.
   Title matching and episode structure can happen before the asset is approved for publish, but publish cannot occur before rights verification and technical validation succeed.

5. Takedown and auditability are first-class.
   Every published asset must be traceable back to source, license evidence, review decisions, and publication history.

## Execution order

1. `planner`
- publish this handoff

2. `data-catalog`
- define the shared app-facing data-contract changes for hosted assets, rights state, health state, and internal-versus-external playback resources
- prepare Prisma/schema and seed-data planning from this handoff

3. `detail-player`
- adapt `/watch` resource resolution to prefer hosted internal playback assets while preserving canonical public URL composition
- keep fallback behavior explicit when a requested resource is degraded, pending, geo-blocked, window-closed, or taken down

4. `reviewer`
- validate that the implementation rounds follow the lawful-source-only scope, preserve canonical watch/list URL rules, and expose correct user-visible fallback states

## Ownership boundaries

### Planner owned scope

- `docs/handovers/`
- `docs/roadmap.md`
- `docs/architecture.md`
- `docs/dev-log.md`

### Data Catalog owned scope

- `data/`
- `types/`
- `lib/media*`
- `prisma/`

### Detail Player owned scope

- `app/watch/`
- `app/media/`
- `components/player/`
- `components/detail/`

### Reviewer scope

- runtime/browser checks
- docs findings and acceptance notes
- no implementation takeover outside reviewer-owned reporting docs

## 1. Source intake model

## Allowed source classes

Every inbound video source should be labeled with one explicit source class:

- `PUBLIC_DOMAIN_ARCHIVE`
- `CC_LIBRARY`
- `DIRECT_CREATOR_UPLOAD`
- `LICENSED_FREE_CATALOG`
- `INSTITUTIONAL_OPEN_COLLECTION`

Each class must require a concrete origin URL or uploader identity, not just a free-text note.

## Rights verification and provenance capture

Every source asset must carry a provenance and rights packet before it can be marked ingestable:

- source URL or partner feed identifier
- acquisition method
- uploader or partner identity
- license type
- license version if applicable
- allowed territories
- allowed availability window
- whether monetization is allowed, disallowed, or unknown
- whether derivative transcodes and poster extraction are allowed
- evidence attachments
  - license page snapshot or archived capture
  - uploaded agreement or partner contract ref
  - creator attestation record
- reviewer identity and decision timestamp

Minimum rights states:

- `UNVERIFIED`
- `VERIFIED_ALLOWED`
- `VERIFIED_RESTRICTED`
- `REJECTED`
- `TAKEDOWN_PENDING`
- `TAKEN_DOWN`

No asset should advance to publishable state while rights remain `UNVERIFIED`.

## Editorial review checkpoints

Editorial review should happen in three checkpoints:

### Intake triage

- confirm the source is from an allowed class
- reject obvious unauthorized mirrors, fan reuploads, or unclear provenance
- decide whether the asset maps to an existing title or needs a new media record

### Metadata review

- confirm canonical title and alternate-title matching
- confirm media type, release year, language, country, season/episode structure
- confirm artwork, synopsis, subtitle, and track metadata quality

### Publish review

- confirm rights state is publishable
- confirm technical validation and transcode outputs succeeded
- confirm territory/window restrictions are encoded
- confirm player-facing fallback behavior exists if the asset later goes unhealthy

## 2. Metadata workflow

## Title matching

Source intake must distinguish between:

- exact match to an existing `MediaTitle`
- probable match requiring editor confirmation
- new title creation

Matching should not rely on one field alone. The intake workflow should compare:

- canonical title
- alternate titles
- original title
- release year
- media type
- runtime or episode count
- source language and region

Every match decision should be recorded as:

- `MATCHED_EXISTING`
- `CREATED_NEW`
- `ESCALATED_FOR_REVIEW`
- `REJECTED_DUPLICATE_SOURCE`

## Alternate titles

The system should capture source-facing aliases separately from the canonical display title:

- source-supplied title
- localized title
- original title
- community or legacy title if editorially approved

This should map naturally onto the existing `MediaAlternateTitle` direction, but source provenance should record where each alternate title came from.

## Seasons and episodes

For episodic media, intake must support:

- season number
- episode number
- source episode title
- canonical episode title
- air or publish date
- runtime
- season-level or episode-level artwork
- per-episode subtitles and audio tracks

The workflow should permit:

- one source asset linked to a movie-level `MediaTitle`
- one source asset linked to a specific `Episode`
- multiple source assets for the same episode when mirrors or replacement masters exist

## Posters, backdrops, subtitles, and tracks

Metadata intake should treat these as separate managed assets:

- poster artwork
- backdrop artwork
- thumbnail or stills
- subtitle files by language and format
- audio-track descriptors
- caption quality or accessibility notes

Each should support:

- provenance
- rights or reuse permission
- technical validation
- status

Poster and backdrop capture can originate from:

- provided creator assets
- licensed catalog artwork
- editorial upload

Automatic frame grabs should be allowed only if the verified rights policy explicitly allows derivative asset generation.

## 3. Media pipeline

## Ingest

Recommended flow:

1. register source record and rights packet
2. create ingest job
3. fetch or accept uploaded mezzanine asset
4. checksum and size validation
5. malware and file-type validation
6. media probe for codec, duration, bitrate, audio tracks, subtitle tracks, and dimensions
7. write normalized source-asset record

Accepted ingest modes:

- partner feed pull from authorized endpoints
- signed direct upload from creator or editor
- controlled fetch from a verified public-domain or CC asset URL

Do not design generic web scraping or player extraction.

## Validation

Every source asset should pass:

- MIME and extension validation
- checksum dedupe
- codec/container inspection
- duration sanity checks
- audio/video track presence checks
- subtitle manifest validation if supplied
- frame-sample inspection for corruption

Validation outcomes:

- `PASSED`
- `PASSED_WITH_WARNINGS`
- `FAILED`
- `QUARANTINED`

## Transcode and package

Recommended production target:

- store the original authorized source as a mezzanine object
- transcode into adaptive HLS ladders first
- optionally add MP4 progressive fallback exports for constrained clients or reviewer QA

Recommended package outputs:

- HLS master manifest
- HLS variant playlists
- segmented video and audio renditions
- subtitle sidecars or WebVTT assets
- poster and thumbnail derivatives if permitted

Each transcode profile should record:

- ladder preset
- output codecs
- audio variants
- subtitle attachment behavior
- packaging version
- encryption mode if introduced later

This round does not require DRM planning because the source scope is free-to-publish content, but packaging should leave room for signed delivery and tokenized CDN access later.

## Object storage and manifest layout

Recommended logical storage layout:

```text
media/
  <mediaPublicId>/
    artwork/
    movie/
      source/
      mezzanine/
      packaged/
        <resourcePublicId>/
          master.m3u8
          video/
          audio/
          subtitles/
    episodes/
      <episodePublicId>/
        source/
        mezzanine/
        packaged/
          <resourcePublicId>/
            master.m3u8
            video/
            audio/
            subtitles/
```

Guidelines:

- key storage by opaque public IDs where practical
- keep source and packaged outputs distinct
- never overwrite old packaged output in place without version tracking
- make it possible to atomically switch the active published package

## CDN strategy

Recommended rollout:

- origin in object storage
- CDN in front of packaged manifests, segments, subtitles, and posters
- immutable asset paths for versioned packages
- short-cache manifests, long-cache media segments
- signed or tokenized delivery optional in later rounds if abuse requires it

Operational needs:

- manifest and segment availability probes from multiple regions
- CDN cache purge support for takedown or repackage events
- per-resource traffic and error metrics

## 4. Playback and resource model changes

## Canonical watch URL behavior

The canonical public entry stays:

- `/watch?v=<mediaPublicId>`
- optional `e`, `r`, `list`, `li`, and `t` remain query-driven playback context

This round should not change the public URL contract.

## Internal hosted assets vs external authorized resources

The resource model should evolve to distinguish:

- internal hosted playback asset
- external authorized stream resource
- external authorized download resource
- subtitle asset
- trailer or promo asset

Recommended runtime rule:

- `/watch` resolves a requested `r` if it is valid, online, and allowed for the current territory and availability window
- if no explicit `r` is requested, prefer the primary internal hosted playback resource
- if internal hosted playback is unavailable, fall back to an authorized external playback resource only if it is explicitly approved for user playback
- if no playable authorized resource exists, render a clear unavailable state rather than silently degrading to a broken host

## Health checks and fallback behavior

Every publishable playback resource should carry health state driven by automated probes and editorial reports:

- `HEALTHY`
- `DEGRADED`
- `BROKEN`
- `WINDOW_CLOSED`
- `BLOCKED`
- `TAKEDOWN`
- `PENDING_PUBLISH`

Reviewer-visible fallback behavior should cover:

- requested `r` is broken
  - fall back to another healthy approved resource for the same media or episode if allowed
- all playback resources are unavailable
  - show a clear unavailable message and keep metadata page context intact
- subtitles missing
  - keep playback available without subtitle controls that claim a missing asset exists
- list playback context exists
  - preserve `list` and `li` in fallback navigation without changing canonical URL rules

## 5. Database and schema evolution

## Extend current models

### `Resource`

Keep `publicId` as the public selection token, but add operational fields so a resource can represent hosted packaged playback rather than just a loose URL:

- `originType`
  - internal hosted
  - external authorized
  - download
  - subtitle
  - trailer
- `deliveryKind`
  - HLS
  - MP4
  - external embed
  - file download
- `publicationStatus`
  - pending
  - published
  - degraded
  - blocked
  - taken down
- `storageKey` or package pointer
- `manifestPath`
- `availabilityStartAt`
- `availabilityEndAt`
- `geoAllowList`
- `geoBlockList`
- `healthStatus`
- `lastProbeAt`
- `lastProbeError`
- `rightsRecordId`
- `activeOutputId`

### `Artwork`

Add provenance-oriented fields:

- `sourceAssetId`
- `licenseState`
- `reviewStatus`

### `MediaTitle` and `Episode`

Add publication workflow fields as needed:

- editorial review status
- current publish status
- default playback resource pointers if useful

## New tables

### `SourceAsset`

Represents the authorized inbound file or feed item.

Suggested fields:

- internal id
- source class
- source URL or upload reference
- uploader or partner ref
- checksum
- file size
- detected container and codecs
- duration
- language
- ingest status
- quarantine status
- linked `mediaId` and optional `episodeId`

### `RightsRecord`

Represents the legal basis for publishing the asset.

Suggested fields:

- internal id
- source asset id
- rights state
- license type
- license URL
- contract or agreement ref
- attribution requirements
- derivative permission
- monetization permission
- allowed territories
- restricted territories
- availability start/end
- reviewer id
- approved at
- revoked at

### `IngestJob`

Tracks intake processing.

Suggested fields:

- job id
- source asset id
- job type
- status
- attempt count
- started/finished timestamps
- failure reason
- triggered by user/system

### `TranscodeOutput`

Tracks each packaged or fallback output.

Suggested fields:

- output id
- source asset id
- resource id
- profile name
- packaging version
- manifest path
- storage prefix
- resolution ladder metadata
- bitrate metadata
- output status
- is active publish candidate

### `SubtitleAsset`

Separate table if subtitle management becomes deeper than generic resources.

Suggested fields:

- language
- format
- storage key
- source asset id
- validation status
- review status

### `AvailabilityWindow`

Optional dedicated table if rights windows become more complex than a pair of timestamps on `Resource`.

Suggested fields:

- start/end
- territory scope
- platform scope
- related rights record

### `ModerationCase`

Tracks suspected rights issues, abuse, or policy review.

Suggested fields:

- target resource or media
- case type
- opened by
- status
- findings
- resolution

### `TakedownRequest`

Tracks inbound takedown or correction requests.

Suggested fields:

- reporter identity
- basis
- target media/resource
- received at
- SLA state
- decision
- executed at

### `ResourceProbe`

Stores health-check results.

Suggested fields:

- resource id
- probe region
- probe result
- status code
- latency
- manifest parse result
- segment-fetch result
- checked at

## New enums and states

Recommended enum additions:

- `SourceClass`
- `RightsState`
- `IngestStatus`
- `ValidationStatus`
- `TranscodeStatus`
- `HealthStatus`
- `ModerationState`
- `TakedownState`

The schema does not need every enum immediately in Round 2, but the handoff should preserve these state boundaries.

## 6. Ops and compliance

## Takedown and reporting

The platform should support:

- public reporting of broken or unauthorized media
- internal takedown intake queue
- immediate resource-disable ability without deleting audit history
- takedown propagation to CDN cache purge and watch-surface unavailability state

Takedown execution should:

- disable the resource from player resolution
- preserve the original provenance and decision records
- update list or watch fallbacks cleanly if alternate approved resources still exist

## Audit trail

Every major workflow step should be logged:

- who created or edited source metadata
- who approved rights
- who approved publish
- what asset version was published
- when a resource was replaced, degraded, blocked, or removed

This should be queryable per resource and per title.

## Broken-stream monitoring

Operational monitoring should cover:

- manifest fetch failures
- segment fetch failures
- abnormal startup failure rates
- playback-session abandonment spikes
- subtitle fetch failures
- region-specific CDN issues

Monitoring should drive:

- automatic `DEGRADED` or `BROKEN` status suggestions
- editor alerts
- player fallback selection when alternates exist

## Abuse control

Even for lawful free content, abuse controls are still needed:

- hotlink protection or signed access if traffic abuse appears
- rate limiting on report forms and playback probes
- upload validation and quarantine for creator submissions
- admin/editor permission boundaries on publish and takedown actions

## 7. Phased implementation roadmap

## Round 2: schema and intake foundation

Primary goal:

- introduce the schema and shared-contract foundation for lawful source intake and hosted playback resources

Expected work:

- add Prisma models and enums for source assets, rights records, ingest jobs, transcode outputs, and moderation state
- extend shared media contracts to distinguish hosted internal playback from external authorized resources
- define editorial intake states and reviewer-visible unavailable states
- seed a small number of lawful-source example records without enabling full ingest automation yet

Round 2 exit criteria:

- schema supports lawful source provenance and rights records
- shared app-facing resource contracts can represent hosted packaged assets plus external approved fallbacks
- no public URL change is required for the new model

## Round 3: ingest, packaging, and hosted playback MVP

Primary goal:

- stand up a minimal end-to-end hosted playback pipeline for a small approved catalog slice

Expected work:

- create ingest job execution flow
- validate source assets
- generate packaged HLS outputs
- publish manifests and segments to object storage and CDN
- let `/watch` resolve a healthy internal hosted resource as the default playback target

Round 3 exit criteria:

- at least one movie and one episodic title can play from internally hosted packaged assets
- resource health state and package pointers are stored in the database
- player fallback behavior for unavailable requested resources is implemented

## Round 4: moderation, health monitoring, and operational readiness

Primary goal:

- make the hosted free-video workflow supportable in production

Expected work:

- add takedown and moderation workflow
- add probe-based resource health monitoring
- wire alerts and degraded-state handling
- add audit logging and CDN purge workflow
- refine availability-window and territory enforcement

Round 4 exit criteria:

- broken resources can be detected and surfaced
- takedown requests can disable assets quickly without corrupting history
- audit trail exists for intake, approval, publish, and takedown events
- watch playback behaves predictably when resources are blocked, degraded, or out of window

## Reviewer focus for downstream rounds

Reviewer should verify:

- only authorized source classes are represented
- no implementation introduces scraping or protected-host bypass logic
- canonical `/watch` public-ID and `/list` URL rules remain unchanged
- runtime fallbacks are explicit and user-visible when hosted or external resources are unhealthy
- audit, moderation, and takedown states are reflected in implementation rather than left as comments only

## Acceptance criteria for this planning round

Planning Round 1 passes only if the handoff:

- explicitly limits source scope to lawful authorized free-video sources
- defines source intake, rights verification, provenance capture, and editorial checkpoints
- defines metadata normalization for titles, alternates, seasons/episodes, artwork, subtitles, and tracks
- defines ingest, validation, transcode, packaging, storage, and CDN architecture
- explains how `/watch` and public IDs continue to work with internal hosted assets and approved external resources
- identifies the needed schema evolution for ingest jobs, source assets, transcode outputs, rights records, moderation, takedown state, and availability windows
- defines ops and compliance workflow including takedown, audit trail, broken-stream monitoring, and abuse control
- lays out concrete follow-up rounds for implementation

Planning Round 1 fails if:

- the doc suggests scraping or bypassing unauthorized sources
- canonical public URL rules are replaced rather than preserved
- rights and provenance are treated as optional afterthoughts
- the plan stops at metadata only and omits storage, packaging, health, or takedown workflow
