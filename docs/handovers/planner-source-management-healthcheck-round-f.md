# Planner Handoff: Source Management And Healthcheck Round F

## Task summary

Round F establishes the first operable source-management and healthcheck layer on top of the accepted published-catalog foundation.

This round must make sources into first-class managed entities that can:

- exist in an explicit inventory
- be ordered within a title or episode
- carry health and availability state
- trigger repair-oriented backend workflow
- influence watch-page source resolution without breaking canonical public URL behavior

This round must also preserve the core separation between:

- canonical title metadata lifecycle
- source lifecycle

Title identity must not be rewritten just because a source becomes degraded, broken, replaced, or offline.

## Execution order

1. `planner`
- publish this handoff

2. `media-ingest`
- implement source-refresh, probe-intake, and repair-intake workflow pieces in provider/ingest boundaries

3. `data-catalog`
- implement source inventory, source ordering, source state, repair queue, and published source contracts in Prisma/repositories/server modules

4. `detail-player`
- integrate watch-page source preference and health-aware published source resolution while preserving canonical `/watch?...&r=...` behavior

5. `reviewer`
- validate source-state isolation, health/repair workflow discipline, watch/runtime correctness, and ownership boundaries before merge

## Implementation scope

Round F covers:

- source inventory and explicit source ordering
- source health and availability state
- health probes and refresh workflow
- repair queue creation
- health-aware published source resolution for watch pages
- metadata/source lifecycle decoupling

Recommended health/availability states:

- `healthy`
- `degraded`
- `broken`
- `replaced`
- `offline`

Equivalent naming is acceptable if the semantics remain clear.

## Explicit non-goals

- no auth or session work
- no admin redesign beyond narrow backend state needed for repair/health boundaries
- no player redesign beyond source-state integration
- no public browse/search redesign
- no staging/review/rejected leakage into public source contracts
- no new provider adapter redesign
- no full operator dashboard or repair UI workflow beyond backend state and minimal hooks if strictly needed

## Architectural intent for Round F

Round F is where published source records become operational rather than static.

The system should now support:

- a published source inventory per title or episode
- an ordering model for candidate playback lines
- a health model that reflects runtime conditions
- a repair queue or repair-needed state fed by probes/refresh logic
- a watch-page resolution policy that can prefer healthy sources while keeping public identity stable

The system should still **not** allow:

- staging or rejected source state to surface publicly
- health workflow to silently rewrite canonical media identity
- route-local source status shortcuts outside server-side source/health boundaries

## Ownership split

## Media Ingest owns

Round F `media-ingest` should own:

- `lib/server/provider/`
- `lib/server/ingest/`
- related ingest-side workflow files used for source refresh, probe intake, or repair intake
- `scripts/`
- `import-data/`
- `package.json` only for safe job/script entries if needed

Responsibilities:

- define or extend ingest/provider workflows that refresh source data from providers
- implement probe ingestion or refresh orchestration that can feed source status updates
- create repair-intake boundaries when probes or refresh runs detect broken lines
- keep provider-specific refresh logic inside provider/ingest boundaries

`media-ingest` must **not**:

- own the published source inventory schema
- own public watch resolution rules
- directly expose probe/raw refresh state to public routes
- bypass repository/service boundaries with route-local logic

## Data Catalog owns

Round F `data-catalog` should own:

- `prisma/`
- `lib/db/`
- `lib/server/source/`
- `lib/server/health/`
- `lib/server/catalog/` where published-source serving needs health-aware read boundaries
- related shared backend contracts for source-state and health-aware published reads

Responsibilities:

- implement explicit source inventory persistence
- implement source ordering persistence
- implement health/availability state persistence
- implement repair queue persistence and server-side boundaries
- implement published source contracts that Detail Player can consume
- preserve metadata/source lifecycle decoupling

`data-catalog` must **not**:

- leak staging, review, or rejected state into public source contracts
- redesign public browse/search behavior
- move health logic into player components directly

## Detail Player owns

Round F `detail-player` should own:

- `app/media/`
- `app/watch`
- `components/player/`
- `components/detail/`
- related watch/detail source-selection integration points

Responsibilities:

- integrate health-aware source selection against published source contracts
- preserve current canonical `/watch?...&r=...` behavior
- prefer healthy published sources when no explicit `r` is selected or when a requested source is no longer a valid healthy candidate according to the accepted backend contract
- keep list/watch identity semantics intact

`detail-player` must **not**:

- redesign the player UI beyond what source-state integration strictly requires
- pull staging/review/rejected source data into watch routes
- implement source-health backend persistence itself

## Reviewer owns

Reviewer owns:

- acceptance and findings docs only
- runtime/browser validation of watch-page source behavior where needed

Reviewer should validate both:

- backend state discipline
- visible watch/runtime behavior

## Metadata/source lifecycle decoupling rule

Round F must preserve this rule:

- titles, seasons, episodes, and canonical metadata live on one lifecycle
- playback/download/subtitle sources live on a separate lifecycle

Source updates may:

- change ordering
- change health state
- mark a source as replaced
- remove a source from public serving

Source updates must not:

- change canonical title identity
- rewrite public media identity
- bypass publish/source boundaries through staging shortcuts

## Public source contract rule

Public-facing source contracts used by detail/watch may include:

- published source identity
- ordering
- provider label or source label if already public-safe
- health-aware availability suitable for runtime selection

Public-facing source contracts must not include:

- staging-only source fragments
- rejected or in-review source records
- raw probe logs
- internal repair notes
- operator-only audit state

## Health-aware watch resolution rule

Round F should preserve canonical `/watch?...&r=...` semantics while adding health awareness.

Recommended behavior:

1. if `r` points to a published and currently usable source, keep using it
2. if `r` points to a published source that is no longer usable under the accepted health state policy, resolve to the next best published healthy source according to source ordering rules
3. if no explicit `r` exists, choose the highest-priority usable published source
4. keep the canonical watch/list public identity intact even when backend resolution chooses a better source

This round may decide whether the fallback stays implicit or normalizes the URL on navigation, but it must not break the existing public identity model.

## Recommended source/state persistence concepts

Round F does not require exact final table names, but it should leave explicit persisted state for:

### SourceInventoryItem

Represents a published playback/download/subtitle source attached to a title or episode.

Useful fields:

- canonical media or episode ref
- public source identity
- provider/source label
- source type
- ordering / priority
- active flag
- replacement target if replaced

### SourceHealthState

Represents current health/availability state for a published source.

Useful fields:

- source ref
- current state
- last checked at
- last successful check at
- failure count
- degradation reason summary

### SourceProbeRun

Represents one probe or refresh execution.

Useful fields:

- source ref or provider ref
- probe kind
- status
- started/completed timestamps
- failure summary

### RepairQueueEntry

Represents a source that needs follow-up because probes or refresh workflow found a problem.

Useful fields:

- source ref
- problem type
- severity
- created at
- current repair status
- related probe/run refs

### SourceOrderingRule or priority fields

Represents how the system chooses among multiple published sources.

Useful fields:

- source ref
- priority index
- preferred flag
- manual override or automatic ordering marker if needed

## Media Ingest implementation checklist

### 1. Add source refresh/probe intake boundaries

- add or extend workflow entrypoints that can request source refresh and source probing from provider/ingest boundaries
- keep provider-specific refresh logic isolated from published serving

### 2. Feed repair-oriented workflow state

- ensure broken or degraded findings can create or update repair-intake signals rather than disappearing into logs
- do not mutate public contracts directly from provider scripts

### 3. Respect staging/published separation

- if refresh logic sees provider-side changes, keep the workflow within accepted backend boundaries
- do not leak raw provider state into public runtime serving

## Data Catalog implementation checklist

### 1. Add source inventory persistence

- extend schema for published source inventory and ordering
- allow multiple sources per title or episode
- keep source identity separate from title identity

### 2. Add health and availability state

- extend schema and repositories for explicit health/availability state such as healthy, degraded, broken, replaced, and offline
- keep state transitions queryable and durable

### 3. Add repair queue boundaries

- persist repair-needed workflow state
- keep it in backend source/health modules rather than route-local helpers

### 4. Expose health-aware published source contracts

- provide public-safe published source reads for detail/watch serving
- expose only the source state that public runtime resolution needs
- do not leak probe internals or operator-only notes

### 5. Preserve metadata/source decoupling

- do not encode source-health state as title-health state
- do not make canonical media identity depend on line availability

## Detail Player implementation checklist

### 1. Integrate health-aware source resolution

- consume published source contracts that include health-aware usability/order information
- preserve current explicit `r` preference behavior where the selected source is still usable

### 2. Preserve canonical watch behavior

- keep canonical `/watch?...&r=...` behavior and public identity rules intact
- preserve list-aware watch context if present

### 3. Avoid redesign

- limit changes to source-state integration only
- do not broaden this round into new player UX work

## Reviewer acceptance checklist

## 1. Source inventory is explicit

- confirm the backend now has explicit published source inventory and source ordering state
- confirm multiple lines can be represented without rewriting title identity

## 2. Health state is explicit and durable

- confirm health/availability states such as healthy, degraded, broken, replaced, and offline are represented explicitly
- confirm these are persisted, not inferred only from transient logs

## 3. Repair workflow exists

- confirm probe/refresh outcomes can feed repair-oriented backend workflow state
- confirm repair state is explicit rather than silently mutating public behavior

## 4. Metadata/source decoupling is preserved

- confirm source lifecycle changes do not rewrite canonical title identity
- confirm source state remains distinct from staging/review/rejected content state

## 5. Public contracts are clean

- confirm public detail/watch source contracts contain only published source state
- confirm staging-only, normalized-only, review-only, or rejected records do not leak into public source contracts

## 6. Watch-page behavior is health-aware and URL-safe

- confirm watch-page source resolution can prefer healthy published sources
- confirm canonical `/watch?...&r=...` behavior and public identity rules remain intact
- confirm the result does not break explicit source selection when the requested source is still valid

## 7. No out-of-scope drift

- confirm no auth/session work was added
- confirm no public browse/search redesign was added
- confirm no player redesign beyond source-state integration was added
- confirm no broad admin redesign was introduced

## 8. Buildability and integration sanity

- confirm the project remains buildable if tooling is available
- confirm Round F fits the accepted Round A-E backend flow instead of bypassing it

## Acceptance gate

Round F passes only if:

- source inventory and source ordering are explicit
- health/availability state is explicit and durable
- health probes or refresh workflow feed repair-oriented backend state
- watch-page source resolution becomes health-aware while preserving canonical `/watch?...&r=...` behavior
- metadata/source lifecycle decoupling is preserved
- no staging/review/rejected leakage appears in public source contracts
- the project remains buildable

Round F fails if:

- source state is hidden inside route-local logic or transient helpers
- source-health changes rewrite canonical title identity
- watch-page integration breaks canonical source URL behavior
- staging or rejected source state leaks into public runtime contracts
