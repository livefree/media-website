# Planner Handoff: Final Backend Readiness Sweep

## Task Summary

`Workstream 4 / Slice 8` is accepted. The only remaining queued backend item is the closing `Final Backend Readiness Sweep`.

This sweep is a documentation and acceptance pass, not a new implementation slice. Its job is to reconcile the accepted backend baseline against [task.md](/Users/livefree/projects/media-website-v2/task.md), [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md), [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md), and [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md), then decide whether the backend is operator-ready under the tracked scope.

Exact agent execution order:

1. `planner`
2. `reviewer`
3. `coordinator`

No implementation agent is assigned by default. If the sweep finds a tracked blocker, the sweep must stop and hand back to the Coordinator to open a new tracked blocker task before any runtime work resumes.

## Sweep Intent

The readiness sweep exists to answer one bounded question:

- given the accepted backend work through `Workstream 4 / Slice 8`, is the backend operator-ready under the tracked scope already documented in project planning docs?

The sweep must:

- reconcile accepted slices against tracked scope, exit criteria, and fixed workflow docs
- verify that required operator-facing evidence now exists for the accepted backend target
- identify any remaining tracked readiness blockers precisely, without silently broadening scope
- give the Coordinator a defensible queue-closure input grounded in accepted evidence

The sweep must not reinterpret the backend target ad hoc or invent post-hoc launch criteria outside tracked docs.

## Tracked Scope Boundary

The sweep covers only the backend target already represented in tracked docs:

- the backend-first architecture and staging-to-published catalog flow from [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- roadmap Phases 1-8 as already accepted through the fixed backend queue in [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- the fixed post-Round-F backend workflow and remaining queue in [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)
- the accepted scope and baseline recorded in [task.md](/Users/livefree/projects/media-website-v2/task.md)

Operator-ready under tracked scope means:

- one accepted provider lane is operational with durable unattended execution, resumability, bounded retry or throttle behavior, backfill or incremental orchestration, and unattended scheduling
- staged-to-normalized-to-reviewed-to-published catalog flow is accepted and remains the only public data path
- source health, repair, recovery, migration, queue-failure, and launch-validation guardrails are accepted and operator-visible
- tracked operator control-plane surfaces exist for review, source inventory, repair queue, published catalog inspection, moderation/manual submission, queue failures, recovery readiness, and final launch validation
- privileged admin boundaries are accepted and required hardening evidence is present

This does not mean the platform is feature-complete for every future provider, post-launch control-plane expansion, or deployment program.

## Exact Sweep Checklist

The reviewer should mark each item as `pass`, `blocked`, `degraded but acceptable under tracked scope`, or `out of tracked scope`.

### 1. Tracked-doc alignment

- Confirm [task.md](/Users/livefree/projects/media-website-v2/task.md) names the `Final Backend Readiness Sweep` as the active and only remaining backend queue item after accepted `Workstream 4 / Slice 8`.
- Confirm [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md) identifies this sweep as the sole remaining deliverable and defines operator-ready closure as the exit gate.
- Confirm [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md) and [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md) do not require additional tracked backend capabilities beyond the accepted slices for the scoped readiness decision.

### 2. Accepted slice inventory

- Confirm accepted coverage exists for historical backend baseline `Rounds A-F`.
- Confirm accepted coverage exists for `Workstream 1 / Slices 1-7`.
- Confirm accepted coverage exists for `Workstream 2 / Slices 1-3`.
- Confirm accepted coverage exists for `Workstream 3` and `Workstream 3 / Slice 2`.
- Confirm accepted coverage exists for `Workstream 4 / Slices 1-8`.

### 3. Intake and provider-lane readiness

- Confirm the tracked backend target only requires one operational provider lane, not broader provider coverage.
- Confirm the accepted evidence shows real-provider ingest, durable worker execution, restart-safe continuation, bounded retry/throttle behavior, deterministic backfill or incremental orchestration, and unattended repeatable sync scheduling for that lane.
- Confirm no tracked doc still requires additional provider-lane implementation before readiness can be declared under the current scope.

### 4. Staging, normalization, review, and publish readiness

- Confirm tracked docs still require staging-first intake, normalization, explicit review/publish gates, and published-catalog-only public serving.
- Confirm accepted slices cover those requirements without reopening route-local catalog logic or direct staging leakage.
- Confirm accepted golden-path validation exists for ingest -> normalize -> review -> publish -> published read -> watch or health contract behavior.

### 5. Operator control-plane readiness

- Confirm accepted operator/admin surfaces exist for:
  - source inventory
  - repair queue
  - published catalog listing and inspection
  - moderation/report handling
  - manual title/source submission
  - audited reorder / replace / unpublish lifecycle actions
  - publish scheduling and visibility control
  - queue failure monitoring
  - recovery readiness
  - final launch validation
- Confirm these surfaces are within tracked backend scope and do not still depend on direct DB edits for the accepted workflows.

### 6. Hardening and guardrail readiness

- Confirm accepted evidence exists for:
  - structured job execution telemetry and failure visibility
  - explicit privileged admin access control and `401` / `403` behavior
  - queue-failure severity and escalation signaling
  - migration preflight and fail-closed rollout guardrails
  - deterministic backend golden-path validation
  - recovery readiness with backup freshness and restore rehearsal visibility
  - final launch validation with bounded `ready` / `degraded` / `blocked` state and per-domain outcomes
- Confirm final launch validation remains evidence for readiness, not a substitute for the readiness decision itself.

### 7. Operator-ready exit decision

- Confirm the accepted baseline supports the `docs/backend-delivery-workflow.md` exit gate:
  - the backend is operator-ready under tracked scope
  - final launch-validation coverage exists
  - the readiness decision can be documented without inventing new implementation work
- If any required tracked capability is still missing, classify that as a blocker and stop the sweep.

## Operator-Ready Exit Criteria Under Tracked Scope

The readiness sweep may conclude `operator-ready under tracked scope` only if every statement below is true:

1. The accepted backend remains aligned with the adapter-first, staging-first, review-gated, published-catalog-only model defined in [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md).
2. All backend roadmap phases required by tracked scope are represented by accepted slices or accepted historical baseline work; no roadmap requirement inside the current scope remains unimplemented.
3. One provider lane is operational end to end, and tracked docs do not require broader provider coverage for this closure decision.
4. Public browse/search/detail/watch/list behavior is backed by published catalog reads only, not staging or route-local seed logic.
5. Accepted operator surfaces cover the tracked review, catalog, source, moderation, recovery, and launch-validation workflows without requiring direct DB edits.
6. Accepted hardening coverage makes failures, privileged access boundaries, migration safety, recovery posture, and launch posture visible enough for operators to act inside the tracked scope.
7. No unresolved finding in tracked docs or accepted reviewer handoffs contradicts the claim that the backend is operator-ready under the tracked scope.
8. Any remaining gaps are explicitly outside tracked scope and are recorded as residual follow-up, not hidden launch blockers.

If all eight statements cannot be supported from tracked evidence, the sweep must not declare readiness.

## Evidence Sources To Inspect

The reviewer should inspect tracked documents first, then accepted reviewer evidence, then current runtime or test evidence if needed to confirm no drift.

### Primary planning sources

- [task.md](/Users/livefree/projects/media-website-v2/task.md)
- [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md)
- [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md)
- [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md)

### Accepted reviewer handoffs to reconcile

- [docs/handovers/reviewer-provider-adapter-staging-round-b-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-provider-adapter-staging-round-b-acceptance.md)
- [docs/handovers/reviewer-normalization-dedup-round-c-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-normalization-dedup-round-c-acceptance.md)
- [docs/handovers/reviewer-review-publish-round-d-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-review-publish-round-d-acceptance.md)
- [docs/handovers/reviewer-canonical-catalog-serving-round-e-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-canonical-catalog-serving-round-e-acceptance.md)
- [docs/handovers/reviewer-source-management-healthcheck-round-f-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-source-management-healthcheck-round-f-acceptance.md)
- [docs/handovers/reviewer-workstream1-slice1-real-provider-path-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream1-slice1-real-provider-path-acceptance.md)
- [docs/handovers/reviewer-workstream1-slice2-refresh-probe-jobs-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream1-slice2-refresh-probe-jobs-acceptance.md)
- [docs/handovers/reviewer-workstream1-slice3-durable-worker-execution-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream1-slice3-durable-worker-execution-acceptance.md)
- [docs/handovers/reviewer-workstream1-slice4-resumability-checkpoint-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream1-slice4-resumability-checkpoint-acceptance.md)
- [docs/handovers/reviewer-workstream1-slice5-retry-throttling-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream1-slice5-retry-throttling-acceptance.md)
- [docs/handovers/reviewer-workstream1-slice6-sync-orchestration-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream1-slice6-sync-orchestration-acceptance.md)
- [docs/handovers/reviewer-workstream1-slice7-unattended-sync-scheduling-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream1-slice7-unattended-sync-scheduling-acceptance.md)
- [docs/handovers/reviewer-workstream2-slice1-admin-source-repair-ui-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream2-slice1-admin-source-repair-ui-acceptance.md)
- [docs/handovers/reviewer-workstream2-slice2-published-catalog-ui-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream2-slice2-published-catalog-ui-acceptance.md)
- [docs/handovers/reviewer-workstream2-slice3-rendered-ui-coverage-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream2-slice3-rendered-ui-coverage-acceptance.md)
- [docs/handovers/reviewer-workstream3-moderation-manual-submission-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream3-moderation-manual-submission-acceptance.md)
- [docs/handovers/reviewer-workstream3-slice2-publish-scheduling-visibility-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream3-slice2-publish-scheduling-visibility-acceptance.md)
- [docs/handovers/reviewer-workstream4-hardening-slice1-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-hardening-slice1-acceptance.md)
- [docs/handovers/reviewer-workstream4-slice2-admin-access-hardening-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-slice2-admin-access-hardening-acceptance.md)
- [docs/handovers/reviewer-workstream4-slice3-queue-failure-monitoring-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-slice3-queue-failure-monitoring-acceptance.md)
- [docs/handovers/reviewer-workstream4-slice4-migration-safety-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-slice4-migration-safety-acceptance.md)
- [docs/handovers/reviewer-workstream4-slice5-e2e-validation-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-slice5-e2e-validation-acceptance.md)
- [docs/handovers/reviewer-workstream4-slice6-provider-failure-alert-signaling-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-slice6-provider-failure-alert-signaling-acceptance.md)
- [docs/handovers/reviewer-workstream4-slice7-recovery-backup-guardrails-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-slice7-recovery-backup-guardrails-acceptance.md)
- [docs/handovers/reviewer-workstream4-slice8-final-launch-validation-acceptance.md](/Users/livefree/projects/media-website-v2/docs/handovers/reviewer-workstream4-slice8-final-launch-validation-acceptance.md)

### Current verification sources if drift is suspected

- [docs/dev-log.md](/Users/livefree/projects/media-website-v2/docs/dev-log.md)
- current `main` code and tests referenced by the accepted reviewer handoffs
- current build or test output only when needed to confirm the accepted behavior still matches the tracked evidence

## Non-Goals

This sweep must not:

- implement new runtime behavior
- reopen accepted slices because a reviewer prefers a different architecture
- broaden the backend target beyond tracked scope
- require broader provider coverage, deployment automation, or post-launch operations work that tracked docs explicitly defer
- create new roadmap phases, side quests, or informal hardening slices
- silently fix blockers inside the sweep
- replace the Coordinator’s separate queue-closure and versioning decision

## Exact Execution Order

### 1. Planner handoff

- Deliver this handoff.
- Define the sweep checklist, evidence sources, exit criteria, non-goals, execution order, and stop rules.

### 2. Reviewer readiness reconciliation

- Read the primary planning sources in full.
- Reconcile accepted reviewer handoffs against the checklist in this document.
- Confirm whether each readiness area is supported by accepted evidence, unsupported, or outside tracked scope.
- Produce one reviewer handoff that states either:
  - accepted readiness under tracked scope, with residual out-of-scope follow-up only, or
  - blocked readiness, with the exact missing tracked requirement and the blocker task that must be opened next

### 3. Coordinator closure decision

- Read the planner and reviewer handoffs.
- If the reviewer accepted readiness, record the readiness decision, residual non-blocking follow-up, queue closure, and any milestone/versioning action.
- If the reviewer found a blocker, stop queue closure, convert the blocker into a new tracked task before implementation resumes, and leave the backend queue open.

## Stop Rules And Blocker Escalation

The sweep must stop immediately and open a new tracked blocker task instead of silently continuing if any of the following occurs:

1. A requirement that is still inside tracked scope cannot be supported by accepted implementation or accepted reviewer evidence.
2. The only way to claim readiness would be to reinterpret tracked docs more narrowly than they are currently written.
3. A missing operator workflow still requires direct DB edits or ad hoc scripts for a tracked accepted surface.
4. A required readiness area depends on new runtime code, schema work, or UI work that is not already accepted.
5. Accepted hardening evidence is contradicted by current deterministic tests or current reviewer verification.
6. The reviewer cannot determine readiness without inventing new acceptance criteria that do not exist in tracked docs.
7. The reviewer finds that final launch validation itself is incomplete, misleading, or insufficient for a tracked readiness area.

When a stop rule triggers, the reviewer must:

- mark the readiness sweep as blocked
- identify the exact tracked requirement that remains unmet
- name the concrete blocker area using existing task language where possible
- recommend that the Coordinator open one new tracked blocker task before any specialist implementation begins

The sweep must not continue by informally patching code, drafting implementation plans for untracked work, or downgrading a blocker into a note.

## Downstream Reviewer Instructions

Reviewer instructions are exact:

1. Start from latest `main`.
2. Use this handoff plus [task.md](/Users/livefree/projects/media-website-v2/task.md), [docs/backend-spec.md](/Users/livefree/projects/media-website-v2/docs/backend-spec.md), [docs/roadmap.md](/Users/livefree/projects/media-website-v2/docs/roadmap.md), and [docs/backend-delivery-workflow.md](/Users/livefree/projects/media-website-v2/docs/backend-delivery-workflow.md) as the only authority for scope.
3. Reconcile the accepted reviewer handoffs listed above against the checklist in this document.
4. Do not implement code or edit specialist-owned runtime files.
5. Produce one reviewer handoff that gives a binary result:
   - `accepted`: backend is operator-ready under tracked scope
   - `blocked`: backend is not operator-ready under tracked scope
6. If `accepted`, identify only residual items that are explicitly out of tracked scope.
7. If `blocked`, stop immediately, cite the exact checklist item and unmet tracked requirement, and instruct the Coordinator to open a new tracked blocker task instead of continuing silently.
