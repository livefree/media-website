import test from "node:test";
import assert from "node:assert/strict";

import { BackendError } from "../errors";

import { requireFuturePublishAt } from "./scheduling";

test("requireFuturePublishAt accepts valid future timestamps", () => {
  const result = requireFuturePublishAt("2026-03-12T15:00:00.000Z", () => new Date("2026-03-11T12:00:00.000Z").getTime());
  assert.equal(result, "2026-03-12T15:00:00.000Z");
});

test("requireFuturePublishAt rejects invalid timestamps", () => {
  assert.throws(
    () => requireFuturePublishAt("not-a-date"),
    (error: unknown) =>
      error instanceof BackendError &&
      error.code === "review_publish_schedule_invalid" &&
      error.status === 400,
  );
});

test("requireFuturePublishAt rejects non-future timestamps", () => {
  assert.throws(
    () => requireFuturePublishAt("2026-03-11T12:00:00.000Z", () => new Date("2026-03-11T12:00:00.000Z").getTime()),
    (error: unknown) =>
      error instanceof BackendError &&
      error.code === "review_publish_schedule_not_future" &&
      error.status === 400,
  );
});
