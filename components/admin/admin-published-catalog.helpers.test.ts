import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminCatalogPath,
  normalizeAdminCatalogReturnTo,
  parseAdminPublishedCatalogSearch,
} from "./admin-published-catalog.helpers.ts";

test("parseAdminPublishedCatalogSearch keeps only supported filters and pagination", () => {
  const { query, searchState, returnTo } = parseAdminPublishedCatalogSearch({
    q: " northline ",
    type: "series",
    status: "completed",
    year: "2025",
    region: "JP",
    sort: "updated_at",
    page: "3",
    ignored: "noop",
  });

  assert.deepEqual(query, {
    q: "northline",
    type: "series",
    status: "completed",
    year: 2025,
    region: "JP",
    sort: "updated_at",
    page: 3,
  });
  assert.deepEqual(searchState, {
    q: "northline",
    type: "series",
    status: "completed",
    year: "2025",
    region: "JP",
    sort: "updated_at",
    page: 3,
  });
  assert.equal(returnTo, "/admin/catalog?q=northline&type=series&status=completed&year=2025&region=JP&sort=updated_at&page=3");
});

test("parseAdminPublishedCatalogSearch normalizes invalid values back to safe defaults", () => {
  const { query, searchState, returnTo } = parseAdminPublishedCatalogSearch({
    type: "unknown",
    status: "other",
    year: "1500",
    sort: "bogus",
    page: "-2",
  });

  assert.deepEqual(query, {
    page: 1,
  });
  assert.deepEqual(searchState, {
    q: "",
    type: "",
    status: "",
    year: "",
    region: "",
    sort: "published_at",
    page: 1,
  });
  assert.equal(returnTo, "/admin/catalog");
});

test("buildAdminCatalogPath omits empty filters and first-page pagination", () => {
  assert.equal(
    buildAdminCatalogPath({
      q: "harbor",
      sort: "published_at",
      page: 1,
    }),
    "/admin/catalog?q=harbor",
  );
});

test("normalizeAdminCatalogReturnTo rejects non-catalog paths", () => {
  assert.equal(normalizeAdminCatalogReturnTo("/admin/catalog?q=northline&page=2"), "/admin/catalog?q=northline&page=2");
  assert.equal(normalizeAdminCatalogReturnTo("/admin/repair?q=northline"), "/admin/catalog");
  assert.equal(normalizeAdminCatalogReturnTo("https://example.com/admin/catalog"), "/admin/catalog");
});
