import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createProviderFetchContext, createProviderRuntimeContext } from "./adapter";
import { BackendError } from "../errors";
import { buildJszyapiVodUrl, jszyapiVodJsonProviderAdapter } from "./jszyapi";

import type { ProviderHttpClient } from "./types";

async function loadFixture() {
  const fixtureUrl = new URL("./__fixtures__/jszyapi-page.json", import.meta.url);
  return JSON.parse(await readFile(fixtureUrl, "utf8")) as Record<string, unknown>;
}

function createContext(http: ProviderHttpClient, now: Date) {
  return {
    ...createProviderRuntimeContext({
      http,
      now: () => now,
    }),
    ...createProviderFetchContext({
      requestedAt: now.toISOString(),
      requestId: "req-jszyapi-test",
      actorId: "codex",
    }),
  };
}

test("buildJszyapiVodUrl assembles bounded page requests", () => {
  const now = new Date("2026-03-10T12:00:00.000Z");
  const url = buildJszyapiVodUrl(
    {
      page: 2,
      updatedAfter: "2026-03-10T06:30:00.000Z",
    },
    now,
  );

  assert.equal(url, "https://jszyapi.com/api.php/provide/vod/at/json?ac=videolist&pg=2&h=6");
});

test("jszyapi page fetch parses staging-safe items and keeps raw payload separate", async () => {
  const payload = await loadFixture();
  let requestedUrl = "";
  const http: ProviderHttpClient = {
    async fetchJson(url) {
      requestedUrl = url;
      return payload;
    },
    async fetchText() {
      throw new Error("fetchText should not be called in json provider tests.");
    },
  };

  const result = await jszyapiVodJsonProviderAdapter.fetchPage(
    {
      page: 2,
      updatedAfter: "2026-03-10T06:30:00.000Z",
    },
    createContext(http, new Date("2026-03-10T12:00:00.000Z")),
  );

  assert.equal(requestedUrl, "https://jszyapi.com/api.php/provide/vod/at/json?ac=videolist&pg=2&h=6");
  assert.equal(result.providerKey, "jszyapi_vod_json");
  assert.equal(result.items.length, 2);
  assert.equal(result.rawPayloads.length, 1);
  assert.equal(result.nextCheckpoint?.page, 3);
  assert.equal(result.items[0]?.title, "潜行者");
  assert.equal(result.items[0]?.releaseYear, 2024);
  assert.equal(result.items[0]?.typeHint, "movie");
  assert.equal(result.items[0]?.sourceFragments.length, 3);
  assert.equal(result.items[1]?.typeHint, "anime");
  assert.equal(result.items[1]?.sourceFragments.length, 3);
  assert.equal(result.items[0]?.summary, "卧底行动升级，必须在失控前完成潜入任务。");
  assert.equal(Reflect.has(result.items[0] as object, "vod_score"), false);
  assert.equal(((result.rawPayloads[0]?.body as { list?: Array<{ vod_score?: string }> }).list ?? [])[0]?.vod_score, "8.4");
});

test("jszyapi page fetch rejects malformed payloads predictably", async () => {
  const http: ProviderHttpClient = {
    async fetchJson() {
      return {
        code: "1",
        list: {},
      };
    },
    async fetchText() {
      throw new Error("fetchText should not be called in json provider tests.");
    },
  };

  await assert.rejects(
    () =>
      jszyapiVodJsonProviderAdapter.fetchPage(
        {
          page: 1,
        },
        createContext(http, new Date("2026-03-10T12:00:00.000Z")),
      ),
    (error: unknown) => {
      assert.ok(error instanceof BackendError);
      assert.equal(error.code, "provider_payload_invalid");
      return true;
    },
  );
});
