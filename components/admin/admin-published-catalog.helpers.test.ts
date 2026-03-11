import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAdminCatalogPath,
  buildAdminCatalogDetailPath,
  buildPublishedSourceReplacementOptions,
  normalizeAdminCatalogReturnTo,
  parseAdminPublishedCatalogDetailSearch,
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
    flashMessage: undefined,
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
    flashMessage: undefined,
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

test("parseAdminPublishedCatalogDetailSearch keeps catalog return paths and flash state", () => {
  assert.deepEqual(
    parseAdminPublishedCatalogDetailSearch({
      from: "/admin/catalog?q=harbor&page=2",
      flash: "Saved",
    }),
    {
      backHref: "/admin/catalog?q=harbor&page=2",
      flashMessage: "Saved",
    },
  );
});

test("buildAdminCatalogDetailPath keeps bounded returnTo and flash params", () => {
  assert.equal(
    buildAdminCatalogDetailPath("med_public_1", {
      returnTo: "/admin/catalog?q=harbor&page=2",
      flashMessage: "Sources updated.",
    }),
    "/admin/catalog/med_public_1?from=%2Fadmin%2Fcatalog%3Fq%3Dharbor%26page%3D2&flash=Sources+updated.",
  );
  assert.equal(buildAdminCatalogDetailPath("med_public_1"), "/admin/catalog/med_public_1");
});

test("buildPublishedSourceReplacementOptions excludes the current resource and keeps compact labels", () => {
  const options = buildPublishedSourceReplacementOptions(
    [
      {
        id: "resource-1",
        publicId: "src_public_1",
        mediaPublicId: "med_public_1",
        kind: "stream",
        provider: "m3u8",
        format: "hls",
        label: "Primary",
        status: "online",
        healthState: "healthy",
        priority: 20,
        mirrorOrder: 0,
        isPreferred: true,
        isUsable: true,
        url: "https://example.com/one.m3u8",
        canonicalWatchHref: "/watch?v=med_public_1&r=src_public_1",
        watchQuery: {
          mediaPublicId: "med_public_1",
          resourcePublicId: "src_public_1",
        },
        openRepairCount: 0,
        providerDisplayName: "Northline",
        isPublic: true,
      },
      {
        id: "resource-2",
        publicId: "src_public_2",
        mediaPublicId: "med_public_1",
        kind: "stream",
        provider: "m3u8",
        format: "hls",
        label: "Backup",
        quality: "1080p",
        status: "online",
        healthState: "healthy",
        priority: 10,
        mirrorOrder: 1,
        isPreferred: false,
        isUsable: true,
        url: "https://example.com/two.m3u8",
        canonicalWatchHref: "/watch?v=med_public_1&r=src_public_2",
        watchQuery: {
          mediaPublicId: "med_public_1",
          resourcePublicId: "src_public_2",
        },
        openRepairCount: 0,
        providerDisplayName: "Southline",
        isPublic: true,
      },
    ] as never,
    "src_public_1",
  );

  assert.deepEqual(options, [
    {
      value: "src_public_2",
      label: "Backup · Southline · 1080p",
    },
  ]);
});
