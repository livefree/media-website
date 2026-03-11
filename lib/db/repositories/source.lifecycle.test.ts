import test from "node:test";
import assert from "node:assert/strict";

import { BackendError } from "../../server/errors";

import { createRepositoryContext } from "./types";
import { SourceInventoryRepository } from "./source";

interface SourceRow {
  id: string;
  publicId: string;
  mediaId: string;
  episodeId: string | null;
  providerId: string | null;
  providerItemId: string | null;
  providerLineKey: string | null;
  kind: "STREAM" | "DOWNLOAD" | "SUBTITLE" | "TRAILER";
  provider: "M3U8" | "MP4" | "OTHER";
  format: string;
  label: string;
  quality: string | null;
  url: string;
  maskedUrl: string | null;
  accessCode: string | null;
  status: "ONLINE" | "DEGRADED" | "OFFLINE" | "REPORTED" | "PENDING";
  healthState: "HEALTHY" | "DEGRADED" | "BROKEN" | "REPLACED" | "OFFLINE";
  healthSummary: string | null;
  priority: number;
  mirrorOrder: number;
  isPreferred: boolean;
  orderingOrigin: "AUTOMATED" | "MANUAL";
  isActive: boolean;
  isPublic: boolean;
  replacementResourceId: string | null;
  lastCheckedAt: Date | null;
  lastHealthyAt: Date | null;
  failureCount: number;
  createdAt: Date;
  updatedAt: Date;
}

function createSourceRow(overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    id: overrides.id ?? "resource-1",
    publicId: overrides.publicId ?? "src_public_1",
    mediaId: overrides.mediaId ?? "media-1",
    episodeId: overrides.episodeId ?? "episode-1",
    providerId: overrides.providerId ?? "provider-1",
    providerItemId: overrides.providerItemId ?? "provider-item-1",
    providerLineKey: overrides.providerLineKey ?? "main",
    kind: overrides.kind ?? "STREAM",
    provider: overrides.provider ?? "M3U8",
    format: overrides.format ?? "HLS",
    label: overrides.label ?? "Main line",
    quality: overrides.quality ?? "1080p",
    url: overrides.url ?? "https://example.com/main.m3u8",
    maskedUrl: overrides.maskedUrl ?? null,
    accessCode: overrides.accessCode ?? null,
    status: overrides.status ?? "ONLINE",
    healthState: overrides.healthState ?? "HEALTHY",
    healthSummary: overrides.healthSummary ?? null,
    priority: overrides.priority ?? 10,
    mirrorOrder: overrides.mirrorOrder ?? 0,
    isPreferred: overrides.isPreferred ?? true,
    orderingOrigin: overrides.orderingOrigin ?? "MANUAL",
    isActive: overrides.isActive ?? true,
    isPublic: overrides.isPublic ?? true,
    replacementResourceId: overrides.replacementResourceId ?? null,
    lastCheckedAt: overrides.lastCheckedAt ?? new Date("2026-03-11T10:00:00.000Z"),
    lastHealthyAt: overrides.lastHealthyAt ?? new Date("2026-03-11T09:00:00.000Z"),
    failureCount: overrides.failureCount ?? 0,
    createdAt: overrides.createdAt ?? new Date("2026-03-10T09:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2026-03-11T10:00:00.000Z"),
  };
}

function createRepository(seedRows: SourceRow[]) {
  const rows = [...seedRows];
  const audits: Array<Record<string, unknown>> = [];

  function withReplacement(record: SourceRow) {
    const replacement = record.replacementResourceId
      ? rows.find((candidate) => candidate.id === record.replacementResourceId) ?? null
      : null;

    return {
      ...record,
      replacementResource: replacement
        ? {
            id: replacement.id,
            publicId: replacement.publicId,
          }
        : null,
    };
  }

  const db = {
    resource: {
      async findMany(input: { where?: { id?: { in?: string[] } } }) {
        const ids = input.where?.id?.in;
        const selected = ids ? rows.filter((row) => ids.includes(row.id)) : rows;

        return [...selected]
          .sort((left, right) => {
            if (left.isPreferred !== right.isPreferred) {
              return left.isPreferred ? -1 : 1;
            }

            if (left.priority !== right.priority) {
              return right.priority - left.priority;
            }

            if (left.mirrorOrder !== right.mirrorOrder) {
              return left.mirrorOrder - right.mirrorOrder;
            }

            return left.createdAt.getTime() - right.createdAt.getTime();
          })
          .map((row) => withReplacement(row));
      },
      async findUnique(input: { where: { publicId: string } }) {
        const row = rows.find((candidate) => candidate.publicId === input.where.publicId);
        return row ? withReplacement(row) : null;
      },
      async update(input: {
        where: { id: string };
        data: Record<string, unknown>;
      }) {
        const row = rows.find((candidate) => candidate.id === input.where.id);

        if (!row) {
          throw new Error(`Missing source row '${input.where.id}'.`);
        }

        Object.assign(row, input.data, {
          updatedAt: new Date("2026-03-11T12:00:00.000Z"),
        });

        return withReplacement(row);
      },
    },
    operatorLifecycleMutationAudit: {
      async create(input: { data: Record<string, unknown> }) {
        const audit = {
          id: `audit-${audits.length + 1}`,
          createdAt: new Date("2026-03-11T12:30:00.000Z"),
          ...input.data,
        };
        audits.push(audit);
        return audit;
      },
    },
  };

  return {
    rows,
    audits,
    repository: new SourceInventoryRepository(createRepositoryContext(db as never)),
  };
}

test("reorderPublishedSources updates bounded published-source ordering and records an audit", async () => {
  const { rows, audits, repository } = createRepository([
    createSourceRow({
      id: "resource-1",
      publicId: "src_public_1",
      label: "Main line",
      priority: 10,
      mirrorOrder: 0,
      isPreferred: true,
    }),
    createSourceRow({
      id: "resource-2",
      publicId: "src_public_2",
      label: "Backup line",
      priority: 5,
      mirrorOrder: 1,
      isPreferred: false,
      url: "https://example.com/backup.m3u8",
    }),
  ]);

  const result = await repository.reorderPublishedSources({
    actorId: "operator-1",
    requestId: "reorder-1",
    notes: "Promote backup line.",
    updates: [
      {
        resourceId: "resource-2",
        priority: 20,
        mirrorOrder: 0,
        isPreferred: true,
      },
      {
        resourceId: "resource-1",
        priority: 10,
        mirrorOrder: 1,
        isPreferred: false,
      },
    ],
  });

  assert.equal(result.auditId, "audit-1");
  assert.equal(result.resources[0]?.publicId, "src_public_2");
  assert.equal(rows.find((row) => row.id === "resource-2")?.priority, 20);
  assert.equal(rows.find((row) => row.id === "resource-2")?.isPreferred, true);
  assert.equal(rows.find((row) => row.id === "resource-1")?.mirrorOrder, 1);
  assert.equal(audits[0]?.action, "SOURCE_REORDERED");
});

test("replacePublishedSource swaps the active published source and records an audit", async () => {
  const { rows, audits, repository } = createRepository([
    createSourceRow({
      id: "resource-1",
      publicId: "src_public_1",
      label: "Main line",
      priority: 20,
      mirrorOrder: 0,
      isPreferred: true,
      isActive: true,
      isPublic: true,
    }),
    createSourceRow({
      id: "resource-2",
      publicId: "src_public_2",
      label: "Backup line",
      priority: 10,
      mirrorOrder: 1,
      isPreferred: false,
      isActive: true,
      isPublic: false,
      url: "https://example.com/backup.m3u8",
    }),
  ]);

  const result = await repository.replacePublishedSource({
    sourcePublicId: "src_public_1",
    replacementPublicId: "src_public_2",
    actorId: "operator-1",
    requestId: "replace-1",
    notes: "Swap to the healthier line.",
  });

  const replaced = rows.find((row) => row.publicId === "src_public_1");
  const replacement = rows.find((row) => row.publicId === "src_public_2");

  assert.equal(result.auditId, "audit-1");
  assert.equal(replaced?.healthState, "REPLACED");
  assert.equal(replaced?.status, "OFFLINE");
  assert.equal(replaced?.isPublic, false);
  assert.equal(replacement?.isPublic, true);
  assert.equal(replacement?.isPreferred, true);
  assert.equal(audits[0]?.action, "SOURCE_REPLACED");
});

test("replacePublishedSource rejects unusable replacements before mutating state", async () => {
  const { repository } = createRepository([
    createSourceRow({
      publicId: "src_public_1",
      isPublic: true,
      isActive: true,
    }),
    createSourceRow({
      id: "resource-2",
      publicId: "src_public_2",
      healthState: "BROKEN",
      status: "OFFLINE",
      isPublic: false,
      url: "https://example.com/broken.m3u8",
    }),
  ]);

  await assert.rejects(
    () =>
      repository.replacePublishedSource({
        sourcePublicId: "src_public_1",
        replacementPublicId: "src_public_2",
      }),
    (error: unknown) =>
      error instanceof BackendError &&
      error.code === "source_replacement_unusable" &&
      error.status === 409,
  );
});
