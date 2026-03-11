import test from "node:test";
import assert from "node:assert/strict";

const {
  buildAdminManualSourceSubmissionPath,
  buildAdminManualTitleSubmissionPath,
  buildAdminModerationPath,
  normalizeAdminManualSourceSubmissionReturnTo,
  normalizeAdminManualTitleSubmissionReturnTo,
  normalizeAdminModerationReturnTo,
  parseAdminManualSourceSubmissionSearch,
  parseAdminManualTitleSubmissionSearch,
  parseAdminModerationSearch,
} = await import(new URL("./admin-workstream3.helpers.ts", import.meta.url).href);

test("parseAdminModerationSearch keeps only supported moderation filters", () => {
  const result = parseAdminModerationSearch({
    q: "northline",
    kind: "broken_source",
    status: "in_review",
    flash: "Updated.",
  });

  assert.deepEqual(result.query, {
    q: "northline",
    kinds: ["broken_source"],
    statuses: ["in_review"],
  });
  assert.equal(result.searchState.kind, "broken_source");
  assert.equal(result.searchState.status, "in_review");
  assert.equal(result.returnTo, "/admin/moderation?q=northline&kind=broken_source&status=in_review");
  assert.equal(result.flashMessage, "Updated.");
});

test("parseAdminManualTitleSubmissionSearch normalizes unsupported values", () => {
  const result = parseAdminManualTitleSubmissionSearch({
    q: "glass harbor",
    status: "invalid",
    typeHint: "wrong",
    submission: "mts_public_1",
  });

  assert.deepEqual(result.query, {
    q: "glass harbor",
  });
  assert.deepEqual(result.searchState, {
    q: "glass harbor",
    status: "",
    typeHint: "",
    submission: "mts_public_1",
  });
  assert.equal(result.returnTo, "/admin/manual-titles?q=glass+harbor&submission=mts_public_1");
});

test("parseAdminManualSourceSubmissionSearch keeps valid kind and status only", () => {
  const result = parseAdminManualSourceSubmissionSearch({
    q: "main line",
    status: "accepted",
    kind: "stream",
    submission: "mss_public_1",
  });

  assert.deepEqual(result.query, {
    q: "main line",
    statuses: ["accepted"],
    kinds: ["stream"],
  });
  assert.equal(result.returnTo, "/admin/manual-sources?q=main+line&status=accepted&kind=stream&submission=mss_public_1");
});

test("admin workstream 3 path builders omit empty values", () => {
  assert.equal(buildAdminModerationPath({}), "/admin/moderation");
  assert.equal(buildAdminManualTitleSubmissionPath({ q: "glass harbor" }), "/admin/manual-titles?q=glass+harbor");
  assert.equal(
    buildAdminManualSourceSubmissionPath({ status: "submitted", kind: "download" }),
    "/admin/manual-sources?status=submitted&kind=download",
  );
});

test("admin workstream 3 returnTo helpers reject unrelated routes", () => {
  assert.equal(normalizeAdminModerationReturnTo("/watch?v=med_public_1"), "/admin/moderation");
  assert.equal(normalizeAdminManualTitleSubmissionReturnTo("/admin/manual-titles?submission=mts_public_1"), "/admin/manual-titles?submission=mts_public_1");
  assert.equal(normalizeAdminManualSourceSubmissionReturnTo("/admin/catalog"), "/admin/manual-sources");
});
