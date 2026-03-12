import test from "node:test";
import assert from "node:assert/strict";

import { PublishedCatalogRepository } from "./catalog";
import { createRepositoryContext } from "./types";

test("queryPublishedCatalog restricts public serving to visible published titles", async () => {
  const capturedWhere: Array<Record<string, unknown>> = [];

  const repository = new PublishedCatalogRepository(
    createRepositoryContext({
      mediaTitle: {
        async count(input: { where: Record<string, unknown> }) {
          capturedWhere.push(input.where);
          return 0;
        },
        async findMany(input: { where: Record<string, unknown> }) {
          capturedWhere.push(input.where);
          return [];
        },
      },
    } as never),
  );

  const page = await repository.queryPublishedCatalog({
    scope: "series",
    sort: "latest",
    q: "northline",
  });

  assert.equal(page.totalItems, 0);
  assert.equal(capturedWhere.length, 3);

  for (const where of capturedWhere) {
    assert.deepEqual(where.publishedAt, { not: null });
    assert.equal(where.visibilityState, "VISIBLE");
  }
});
