import test from "node:test";
import assert from "node:assert/strict";

import { BackendError } from "../errors";

import {
  getPublishedCatalogMigrationPreflight,
  getPublishedCatalogPage,
} from "./service";

function createCatalogDependencies(options: { allowRuntime?: boolean } = {}) {
  const calls = {
    assertPublishedCatalogRuntimeReady: 0,
    getPublishedCatalogMigrationPreflight: 0,
    queryPublishedCatalog: 0,
  };

  const dependencies = {
    repository: {
      async queryPublishedCatalog() {
        calls.queryPublishedCatalog += 1;
        return {
          scope: "all",
          q: "",
          page: 1,
          pageSize: 24,
          totalItems: 0,
          totalPages: 0,
          items: [],
          facets: {
            genres: [],
            years: [],
            regions: [],
          },
        };
      },
      async queryAdminPublishedCatalog() {
        throw new Error("not needed");
      },
      async hidePublishedCatalogRecord() {
        throw new Error("not needed");
      },
      async restorePublishedCatalogVisibility() {
        throw new Error("not needed");
      },
      async getPublishedDetailBySlug() {
        throw new Error("not needed");
      },
      async getPublishedDetailByPublicId() {
        throw new Error("not needed");
      },
      async getAdminPublishedCatalogDetailByPublicId() {
        throw new Error("not needed");
      },
      async resolvePublishedWatch() {
        throw new Error("not needed");
      },
      async getPublishedListByPublicId() {
        throw new Error("not needed");
      },
      async getPublishedListDirectory() {
        throw new Error("not needed");
      },
      async getPublishedFeaturedLists() {
        throw new Error("not needed");
      },
    },
    migration: {
      async assertPublishedCatalogRuntimeReady() {
        calls.assertPublishedCatalogRuntimeReady += 1;

        if (options.allowRuntime === false) {
          throw new BackendError("Backend runtime is blocked by migration safety preflight.", {
            status: 503,
            code: "migration_preflight_blocked",
            details: {
              reasonCode: "schema_digest_mismatch",
            },
          });
        }

        return {
          target: "published_catalog_runtime",
          status: "ready",
          reasonCode: "ready",
          summary: "Ready.",
          expectedSchemaDigest: "digest-123",
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          metadata: null,
        };
      },
      async getPublishedCatalogMigrationPreflight() {
        calls.getPublishedCatalogMigrationPreflight += 1;
        return {
          target: "published_catalog_runtime",
          status: options.allowRuntime === false ? "blocked" : "ready",
          reasonCode: options.allowRuntime === false ? "schema_digest_mismatch" : "ready",
          summary: options.allowRuntime === false ? "Schema mismatch." : "Ready.",
          expectedSchemaDigest: "digest-123",
          checkedAt: new Date("2026-03-11T12:00:00.000Z"),
          metadata: null,
        };
      },
    },
  };

  return { calls, dependencies };
}

test("published catalog page proceeds when migration preflight passes", async () => {
  const { calls, dependencies } = createCatalogDependencies();
  const page = await getPublishedCatalogPage({ scope: "all" }, dependencies);

  assert.equal(calls.assertPublishedCatalogRuntimeReady, 1);
  assert.equal(calls.queryPublishedCatalog, 1);
  assert.equal(page.totalItems, 0);
});

test("published catalog page fails closed when migration preflight blocks runtime", async () => {
  const { calls, dependencies } = createCatalogDependencies({ allowRuntime: false });

  await assert.rejects(() => getPublishedCatalogPage({ scope: "all" }, dependencies), {
    message: "Backend runtime is blocked by migration safety preflight.",
  });

  assert.equal(calls.assertPublishedCatalogRuntimeReady, 1);
  assert.equal(calls.queryPublishedCatalog, 0);
});

test("published catalog migration preflight visibility stays available as a narrow contract", async () => {
  const { calls, dependencies } = createCatalogDependencies({ allowRuntime: false });
  const preflight = await getPublishedCatalogMigrationPreflight(dependencies);

  assert.equal(calls.getPublishedCatalogMigrationPreflight, 1);
  assert.equal(preflight.status, "blocked");
  assert.equal(preflight.reasonCode, "schema_digest_mismatch");
});
