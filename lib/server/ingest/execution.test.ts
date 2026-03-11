import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { BackendError } from "../errors";
import { createDefaultProviderRegistry } from "../provider/default-registry";
import { executeProviderPageIngestRun } from "./execution";

import type { PersistIngestPageInput } from "../../db/repositories/staging/types";
import type {
  IngestJobCreateInput,
  IngestJobStatusUpdateInput,
  IngestRunCreateInput,
  IngestRunStatusUpdateInput,
  PersistIngestPlanResult,
  PersistedIngestJobRecord,
  PersistedIngestRunRecord,
  PersistedProviderRegistryRecord,
} from "../../db/repositories/staging/types";
import type { ProviderHttpClient } from "../provider";

async function loadFixture() {
  const fixtureUrl = new URL("../provider/__fixtures__/jszyapi-page.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as Record<string, unknown>;
}

function createPersistenceDouble() {
  const calls = {
    upsertProviderRegistry: [] as Array<Record<string, unknown>>,
    createIngestJob: [] as IngestJobCreateInput[],
    updateIngestJobStatus: [] as Array<{ jobId: string; input: IngestJobStatusUpdateInput }>,
    createIngestRun: [] as IngestRunCreateInput[],
    updateIngestRunStatus: [] as Array<{ runId: string; input: IngestRunStatusUpdateInput }>,
    persistPagePlan: [] as PersistIngestPageInput[],
  };

  const provider: PersistedProviderRegistryRecord = {
    id: "provider-jszyapi",
    adapterKey: "jszyapi_vod_json",
    displayName: "jszyapi Base VOD JSON",
    providerType: "catalog",
    capabilities: ["catalog", "playback", "download"],
    enabled: true,
    baseUrl: "https://jszyapi.com/api.php/provide/vod/at/json",
    lastSuccessfulSyncAt: null,
  };

  const job: PersistedIngestJobRecord = {
    id: "job-1",
    providerId: provider.id,
    mode: "backfill",
    status: "running",
    requestId: "req-1",
    actorId: "codex",
    attemptCount: 0,
    startedAt: new Date("2026-03-10T12:00:00.000Z"),
    finishedAt: null,
    lastErrorSummary: null,
  };

  const run: PersistedIngestRunRecord = {
    id: "run-1",
    ingestJobId: job.id,
    providerId: provider.id,
    mode: "backfill",
    scope: "page",
    status: "running",
    providerItemId: null,
    requestId: "req-1",
    actorId: "codex",
    itemCount: 0,
    rawPayloadCount: 0,
    warningCount: 0,
    startedAt: new Date("2026-03-10T12:00:00.000Z"),
    finishedAt: null,
    lastErrorSummary: null,
  };

  const persistence = {
    async upsertProviderRegistry(input: Record<string, unknown>) {
      calls.upsertProviderRegistry.push(input);
      return provider;
    },
    async createIngestJob(input: IngestJobCreateInput) {
      calls.createIngestJob.push(input);
      return {
        ...job,
        mode: input.mode,
        requestId: input.requestId ?? null,
        actorId: input.actorId ?? null,
        startedAt: input.startedAt ? new Date(input.startedAt) : job.startedAt,
      };
    },
    async updateIngestJobStatus(jobId: string, input: IngestJobStatusUpdateInput) {
      calls.updateIngestJobStatus.push({ jobId, input });
      return {
        ...job,
        status: input.status,
        finishedAt: input.finishedAt ? new Date(input.finishedAt) : null,
        lastErrorSummary: input.lastErrorSummary ?? null,
      };
    },
    async createIngestRun(input: IngestRunCreateInput) {
      calls.createIngestRun.push(input);
      return {
        ...run,
        mode: input.mode,
        requestId: input.requestId ?? null,
        actorId: input.actorId ?? null,
        startedAt: input.startedAt ? new Date(input.startedAt) : run.startedAt,
      };
    },
    async updateIngestRunStatus(runId: string, input: IngestRunStatusUpdateInput) {
      calls.updateIngestRunStatus.push({ runId, input });
      return {
        ...run,
        status: input.status,
        itemCount: input.itemCount ?? run.itemCount,
        rawPayloadCount: input.rawPayloadCount ?? run.rawPayloadCount,
        warningCount: input.warningCount ?? run.warningCount,
        finishedAt: input.finishedAt ? new Date(input.finishedAt) : null,
        lastErrorSummary: input.lastErrorSummary ?? null,
      };
    },
    async persistPagePlan(input: PersistIngestPageInput): Promise<PersistIngestPlanResult> {
      calls.persistPagePlan.push(input);

      return {
        providerItems: input.plan.items.map((item, index) => ({
          id: `provider-item-${index + 1}`,
          providerId: input.providerId,
          externalId: item.providerItemId,
          titleSnapshot: item.title,
          originalTitleSnapshot: item.originalTitle ?? null,
          typeHint: item.typeHint ?? "unknown",
          latestStatus: "staged",
          providerUpdatedAt: null,
          lastSeenAt: new Date(input.plan.fetchedAt),
        })),
        rawPayloads: input.plan.payloads.map((payload, index) => ({
          id: `payload-${index + 1}`,
          providerId: input.providerId,
          ingestJobId: input.ingestJobId,
          ingestRunId: input.ingestRunId,
          providerItemId: payload.providerItemId ?? null,
          externalItemId: payload.providerItemId ?? null,
          fetchedAt: new Date(payload.fetchedAt),
          payloadFormat: payload.payloadFormat,
          scope: "page",
        })),
        candidates: input.plan.items.map((item, index) => ({
          id: `candidate-${index + 1}`,
          providerId: input.providerId,
          providerItemId: `provider-item-${index + 1}`,
          ingestJobId: input.ingestJobId,
          ingestRunId: input.ingestRunId,
          status: "ready_for_normalization",
          title: item.title,
          originalTitle: item.originalTitle ?? null,
          typeHint: item.typeHint ?? "unknown",
          warningCount: item.warnings.length,
          createdAt: new Date(input.plan.fetchedAt),
          updatedAt: new Date(input.plan.fetchedAt),
        })),
        checkpoint: input.plan.checkpoint
          ? {
              id: "checkpoint-1",
              providerId: input.providerId,
              ingestJobId: input.ingestJobId,
              ingestRunId: input.ingestRunId,
              cursor: input.plan.checkpoint.cursor ?? null,
              page: input.plan.checkpoint.page ?? null,
              updatedAfter: null,
              updatedBefore: null,
              providerUpdatedAt: null,
              recordedAt: new Date(input.plan.fetchedAt),
            }
          : undefined,
      };
    },
  };

  return {
    calls,
    persistence,
  };
}

test("executeProviderPageIngestRun persists a real jszyapi page through the ingest boundary", async () => {
  const payload = await loadFixture();
  const registry = createDefaultProviderRegistry();
  const { calls, persistence } = createPersistenceDouble();
  const http: ProviderHttpClient = {
    async fetchJson() {
      return payload;
    },
    async fetchText() {
      throw new Error("fetchText should not be called in json ingest tests.");
    },
  };

  const result = await executeProviderPageIngestRun(
    persistence,
    registry,
    {
      providerKey: "jszyapi_vod_json",
      mode: "backfill",
      page: 2,
      requestId: "req-1",
      actorId: "codex",
    },
    {
      http,
      now: () => new Date("2026-03-10T12:00:00.000Z"),
    },
  );

  assert.equal(calls.upsertProviderRegistry.length, 1);
  assert.equal(calls.createIngestJob.length, 1);
  assert.equal(calls.createIngestRun.length, 1);
  assert.equal(calls.persistPagePlan.length, 1);
  assert.equal(calls.updateIngestRunStatus.at(-1)?.input.status, "succeeded");
  assert.equal(calls.updateIngestJobStatus.at(-1)?.input.status, "succeeded");
  assert.equal(calls.updateIngestJobStatus.at(-1)?.input.attemptCount, 1);
  assert.equal(result.ingest.itemCount, 2);
  assert.equal(result.ingest.rawPayloadCount, 1);
  assert.equal(result.persisted.candidates.length, 2);
  assert.equal(result.persisted.rawPayloads.length, 1);
  assert.equal(result.persisted.checkpoint?.page, 3);
  const successTelemetry = (
    calls.updateIngestRunStatus.at(-1)?.input.metadata as {
      executionTelemetry?: {
        status?: string;
        attemptCount?: number;
        durationMs?: number;
        checkpoint?: { page?: number | null; cursor?: string | null } | null;
      };
    }
  )?.executionTelemetry;
  assert.equal(successTelemetry?.status, "succeeded");
  assert.equal(successTelemetry?.attemptCount, 1);
  assert.equal(successTelemetry?.durationMs, 0);
  assert.equal(successTelemetry?.checkpoint?.page, 3);
});

test("executeProviderPageIngestRun marks the run failed when provider parsing fails", async () => {
  const registry = createDefaultProviderRegistry();
  const { calls, persistence } = createPersistenceDouble();
  const http: ProviderHttpClient = {
    async fetchJson() {
      return {
        code: "0",
        msg: "provider failed",
        list: [],
      };
    },
    async fetchText() {
      throw new Error("fetchText should not be called in json ingest tests.");
    },
  };

  await assert.rejects(
    () =>
      executeProviderPageIngestRun(
        persistence,
        registry,
        {
          providerKey: "jszyapi_vod_json",
          mode: "backfill",
          page: 1,
          requestId: "req-2",
          actorId: "codex",
        },
        {
          http,
          now: () => new Date("2026-03-10T12:00:00.000Z"),
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof BackendError);
      assert.equal(error.code, "provider_payload_invalid");
      return true;
    },
  );

  assert.equal(calls.persistPagePlan.length, 0);
  assert.equal(calls.updateIngestRunStatus.at(-1)?.input.status, "failed");
  assert.equal(calls.updateIngestJobStatus.at(-1)?.input.status, "failed");
  assert.equal(calls.updateIngestJobStatus.at(-1)?.input.attemptCount, 1);
  const failureTelemetry = (
    calls.updateIngestRunStatus.at(-1)?.input.metadata as {
      executionTelemetry?: {
        status?: string;
        attemptCount?: number;
        failure?: {
          category?: string;
          code?: string;
          retryable?: boolean;
        } | null;
      };
    }
  )?.executionTelemetry;
  assert.equal(failureTelemetry?.status, "failed");
  assert.equal(failureTelemetry?.attemptCount, 1);
  assert.equal(failureTelemetry?.failure?.category, "provider_response");
  assert.equal(failureTelemetry?.failure?.code, "provider_payload_invalid");
  assert.equal(failureTelemetry?.failure?.retryable, false);
});
