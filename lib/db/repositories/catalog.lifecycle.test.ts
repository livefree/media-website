import test from "node:test";
import assert from "node:assert/strict";

import { BackendError } from "../../server/errors";

import { createRepositoryContext } from "./types";
import { PublishedCatalogRepository } from "./catalog";

interface MediaRow {
  id: string;
  publicId: string;
  title: string;
  status: "COMPLETED" | "ARCHIVED";
  isFeatured: boolean;
  publishedAt: Date | null;
  visibilityState: "VISIBLE" | "HIDDEN";
}

function createMediaRow(overrides: Partial<MediaRow> = {}): MediaRow {
  return {
    id: overrides.id ?? "media-1",
    publicId: overrides.publicId ?? "med_public_1",
    title: overrides.title ?? "Northline Station",
    status: overrides.status ?? "COMPLETED",
    isFeatured: overrides.isFeatured ?? true,
    publishedAt:
      Object.prototype.hasOwnProperty.call(overrides, "publishedAt")
        ? (overrides.publishedAt ?? null)
        : new Date("2026-03-11T10:00:00.000Z"),
    visibilityState: overrides.visibilityState ?? "VISIBLE",
  };
}

function createRepository(seedRows: MediaRow[]) {
  const rows = [...seedRows];
  const audits: Array<Record<string, unknown>> = [];

  const db = {
    mediaTitle: {
      async findUnique(input: { where: { publicId: string } }) {
        const row = rows.find((candidate) => candidate.publicId === input.where.publicId);
        return row ? { ...row } : null;
      },
      async update(input: { where: { id: string }; data: Record<string, unknown> }) {
        const row = rows.find((candidate) => candidate.id === input.where.id);

        if (!row) {
          throw new Error(`Missing media row '${input.where.id}'.`);
        }

        Object.assign(row, input.data);

        return {
          id: row.id,
          publicId: row.publicId,
          status: row.status,
          visibilityState: row.visibilityState,
        };
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
    repository: new PublishedCatalogRepository(createRepositoryContext(db as never)),
  };
}

test("unpublishPublishedCatalogRecord archives the published title and records an audit", async () => {
  const { rows, audits, repository } = createRepository([createMediaRow()]);

  const result = await repository.unpublishPublishedCatalogRecord({
    mediaPublicId: "med_public_1",
    actorId: "operator-1",
    requestId: "unpublish-1",
    notes: "Withdraw until source review completes.",
  });

  assert.equal(result.auditId, "audit-1");
  assert.equal(result.status, "archived");
  assert.equal(rows[0]?.status, "ARCHIVED");
  assert.equal(rows[0]?.isFeatured, false);
  assert.equal(rows[0]?.publishedAt, null);
  assert.equal(rows[0]?.visibilityState, "HIDDEN");
  assert.equal(audits[0]?.action, "CATALOG_UNPUBLISHED");
});

test("unpublishPublishedCatalogRecord rejects already-unpublished titles", async () => {
  const { repository } = createRepository([
    createMediaRow({
      publicId: "med_public_2",
      status: "ARCHIVED",
      isFeatured: false,
      publishedAt: null,
    }),
  ]);

  await assert.rejects(
    () =>
      repository.unpublishPublishedCatalogRecord({
        mediaPublicId: "med_public_2",
      }),
    (error: unknown) =>
      error instanceof BackendError &&
      error.code === "catalog_unpublish_already_unpublished" &&
      error.status === 409,
  );
});

test("hidePublishedCatalogRecord hides visible published titles and records an audit", async () => {
  const { rows, audits, repository } = createRepository([createMediaRow()]);

  const result = await repository.hidePublishedCatalogRecord({
    mediaPublicId: "med_public_1",
    actorId: "operator-1",
    requestId: "hide-1",
    notes: "Temporarily suppress from public serving.",
  });

  assert.equal(result.auditId, "audit-1");
  assert.equal(result.visibilityState, "hidden");
  assert.equal(rows[0]?.visibilityState, "HIDDEN");
  assert.equal(rows[0]?.isFeatured, false);
  assert.equal(audits[0]?.action, "CATALOG_HIDDEN");
});

test("restorePublishedCatalogVisibility restores hidden published titles and records an audit", async () => {
  const { rows, audits, repository } = createRepository([
    createMediaRow({
      visibilityState: "HIDDEN",
    }),
  ]);

  const result = await repository.restorePublishedCatalogVisibility({
    mediaPublicId: "med_public_1",
    actorId: "operator-1",
    requestId: "restore-1",
    notes: "Restore public serving after review.",
  });

  assert.equal(result.auditId, "audit-1");
  assert.equal(result.visibilityState, "visible");
  assert.equal(rows[0]?.visibilityState, "VISIBLE");
  assert.equal(audits[0]?.action, "CATALOG_RESTORED");
});
