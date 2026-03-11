import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { BackendError } from "../errors";
import { createDefaultProviderRegistry } from "../provider/default-registry";
import {
  executeScheduledSourceProbeJob,
  executeScheduledSourceRefreshJob,
} from "./source-jobs";

import type { RepairQueueEntryRecord, SourceProbeRunRecord } from "../health";
import type { ProviderHttpClient } from "../provider";
import type {
  IngestJobCreateInput,
  IngestJobStatusUpdateInput,
  IngestRunCreateInput,
  IngestRunStatusUpdateInput,
  PersistedIngestJobRecord,
  PersistedIngestRunRecord,
  PersistedProviderRegistryRecord,
} from "../../db/repositories/staging/types";

async function loadFixture() {
  const fixtureUrl = new URL("../provider/__fixtures__/jszyapi-page.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as Record<string, unknown>;
}

function createTarget() {
  return {
    sourceId: "src_123",
    providerItemId: "1001",
    sourceKind: "stream" as const,
    providerLineKey: "jsm3u8",
    urls: ["https://cdn.example.com/qianxingzhe/master.m3u8"],
  };
}

function createSourceJobDouble() {
  const calls = {
    upsertProviderRegistry: [] as Array<Record<string, unknown>>,
    createIngestJob: [] as IngestJobCreateInput[],
    updateIngestJobStatus: [] as Array<{ jobId: string; input: IngestJobStatusUpdateInput }>,
    createIngestRun: [] as IngestRunCreateInput[],
    updateIngestRunStatus: [] as Array<{ runId: string; input: IngestRunStatusUpdateInput }>,
    recordSourceRefreshHealth: [] as Array<Record<string, unknown>>,
    recordSourceProbeHealth: [] as Array<Record<string, unknown>>,
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
    id: "job-2",
    providerId: provider.id,
    mode: "incremental",
    status: "pending",
    requestId: "req-source-job",
    actorId: "codex",
    attemptCount: 0,
    startedAt: null,
    finishedAt: null,
    lastErrorSummary: null,
  };

  const run: PersistedIngestRunRecord = {
    id: "run-2",
    ingestJobId: job.id,
    providerId: provider.id,
    mode: "incremental",
    scope: "source_refresh",
    status: "pending",
    providerItemId: "1001",
    requestId: "req-source-job",
    actorId: "codex",
    itemCount: 0,
    rawPayloadCount: 0,
    warningCount: 0,
    startedAt: new Date("2026-03-11T08:00:00.000Z"),
    finishedAt: null,
    lastErrorSummary: null,
  };

  const probeRun: SourceProbeRunRecord = {
    id: "probe-run-1",
    resourceId: "resource-1",
    providerId: provider.id,
    providerItemId: "provider-item-1001",
    providerLineKey: "jsm3u8",
    probeKind: "metadata_refresh",
    maintenanceReason: "scheduled",
    status: "succeeded",
    requestId: "req-source-job",
    actorId: "codex",
    observedState: "healthy",
    summary: "ok",
    failureSummary: null,
    payloadCount: 1,
    evidence: null,
    startedAt: new Date("2026-03-11T08:00:00.000Z"),
    completedAt: new Date("2026-03-11T08:00:00.000Z"),
    createdAt: new Date("2026-03-11T08:00:00.000Z"),
    updatedAt: new Date("2026-03-11T08:00:00.000Z"),
  };

  const repairQueue: RepairQueueEntryRecord[] = [];

  return {
    calls,
    persistence: {
      async upsertProviderRegistry(input: Record<string, unknown>) {
        calls.upsertProviderRegistry.push(input);
        return provider;
      },
      async createIngestJob(input: IngestJobCreateInput) {
        calls.createIngestJob.push(input);
        return {
          ...job,
          mode: input.mode,
          status: input.status ?? "pending",
          requestId: input.requestId ?? null,
          actorId: input.actorId ?? null,
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
          scope: input.scope,
          status: input.status ?? "pending",
          providerItemId: input.providerItemId ?? null,
          requestId: input.requestId ?? null,
          actorId: input.actorId ?? null,
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
    },
    health: {
      async recordSourceRefreshHealth(request: Record<string, unknown>) {
        calls.recordSourceRefreshHealth.push(request);
        return {
          probeRun,
          repairQueue,
        };
      },
      async recordSourceProbeHealth(request: Record<string, unknown>) {
        calls.recordSourceProbeHealth.push(request);
        return {
          probeRun: {
            ...probeRun,
            probeKind: "manifest",
          },
          repairQueue,
        };
      },
    },
  };
}

test("executeScheduledSourceRefreshJob uses durable queued/running/succeeded state", async () => {
  const payload = await loadFixture();
  const registry = createDefaultProviderRegistry();
  const { calls, persistence, health } = createSourceJobDouble();
  const http: ProviderHttpClient = {
    async fetchJson() {
      return payload;
    },
    async fetchText() {
      throw new Error("refresh job should not call fetchText.");
    },
  };

  const result = await executeScheduledSourceRefreshJob(
    persistence,
    health,
    registry,
    {
      providerKey: "jszyapi_vod_json",
      reason: "scheduled",
      requestId: "req-source-job",
      actorId: "codex",
      target: createTarget(),
    },
    {
      http,
      now: () => new Date("2026-03-11T08:00:00.000Z"),
    },
  );

  assert.equal(calls.createIngestJob[0]?.status, "pending");
  assert.equal(calls.createIngestRun[0]?.status, "pending");
  assert.equal(calls.updateIngestJobStatus[0]?.input.status, "running");
  assert.equal(calls.updateIngestRunStatus[0]?.input.status, "running");
  assert.equal(calls.updateIngestJobStatus.at(-1)?.input.status, "succeeded");
  assert.equal(calls.updateIngestRunStatus.at(-1)?.input.status, "succeeded");
  assert.equal(calls.recordSourceRefreshHealth.length, 1);
  assert.equal(result.ingest.findingCount, 1);
  assert.equal(result.health.probeRun.id, "probe-run-1");
  assert.equal(
    (calls.createIngestJob[0]?.metadata as { jobType?: string })?.jobType,
    "scheduled_source_refresh",
  );
});

test("executeScheduledSourceProbeJob persists health and durable state", async () => {
  const registry = createDefaultProviderRegistry();
  const { calls, persistence, health } = createSourceJobDouble();
  const http: ProviderHttpClient = {
    async fetchJson() {
      throw new Error("probe job should not call fetchJson.");
    },
    async fetchText() {
      return "#EXTM3U\n#EXT-X-VERSION:3";
    },
  };

  const result = await executeScheduledSourceProbeJob(
    persistence,
    health,
    registry,
    {
      providerKey: "jszyapi_vod_json",
      reason: "scheduled",
      probeKind: "manifest",
      requestId: "req-source-job",
      actorId: "codex",
      target: createTarget(),
    },
    {
      http,
      now: () => new Date("2026-03-11T08:00:00.000Z"),
    },
  );

  assert.equal(calls.recordSourceProbeHealth.length, 1);
  assert.equal(calls.updateIngestJobStatus[0]?.input.status, "running");
  assert.equal(calls.updateIngestRunStatus[0]?.input.status, "running");
  assert.equal(calls.updateIngestJobStatus.at(-1)?.input.status, "succeeded");
  assert.equal(calls.updateIngestRunStatus.at(-1)?.input.status, "succeeded");
  assert.equal(result.ingest.probeKind, "manifest");
  assert.equal(result.ingest.findingCount, 1);
  assert.equal(
    (calls.createIngestRun[0]?.metadata as { jobType?: string; probeKind?: string })?.probeKind,
    "manifest",
  );
});

test("executeScheduledSourceProbeJob marks durable failure state when probing throws", async () => {
  const registry = createDefaultProviderRegistry();
  const { calls, persistence, health } = createSourceJobDouble();
  const http: ProviderHttpClient = {
    async fetchJson() {
      throw new Error("probe job should not call fetchJson.");
    },
    async fetchText() {
      throw new BackendError("Probe transport failed.", {
        status: 502,
        code: "provider_request_failed",
      });
    },
  };

  await assert.rejects(
    () =>
      executeScheduledSourceProbeJob(
        persistence,
        health,
        registry,
        {
          providerKey: "jszyapi_vod_json",
          reason: "scheduled",
          probeKind: "manifest",
          requestId: "req-source-job",
          actorId: "codex",
          target: createTarget(),
        },
        {
          http,
          now: () => new Date("2026-03-11T08:00:00.000Z"),
        },
      ),
    (error: unknown) => {
      assert.ok(error instanceof BackendError);
      assert.equal(error.code, "provider_request_failed");
      return true;
    },
  );

  assert.equal(calls.recordSourceProbeHealth.length, 0);
  assert.equal(calls.updateIngestJobStatus.at(-1)?.input.status, "failed");
  assert.equal(calls.updateIngestRunStatus.at(-1)?.input.status, "failed");
});
