import { parseArgs } from "node:util";

import { ingestProviderPage } from "../lib/server/ingest";
import { createDefaultProviderRegistry } from "../lib/server/provider/default-registry";

import type { IngestMode } from "../lib/server/ingest";

function parsePositiveInteger(value: string | undefined, flag: string): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} must be a positive integer.`);
  }

  return parsed;
}

function parseMode(value: string | undefined): IngestMode {
  if (value === undefined) {
    return "manual";
  }

  if (value === "backfill" || value === "incremental" || value === "manual") {
    return value;
  }

  throw new Error("--mode must be one of: backfill, incremental, manual.");
}

async function main() {
  const { values } = parseArgs({
    options: {
      page: {
        type: "string",
      },
      mode: {
        type: "string",
      },
      "updated-after": {
        type: "string",
      },
      "request-id": {
        type: "string",
      },
      "actor-id": {
        type: "string",
      },
    },
  });

  const request = {
    providerKey: "jszyapi_vod_json",
    mode: parseMode(values.mode),
    page: parsePositiveInteger(values.page, "--page") ?? 1,
    updatedAfter: values["updated-after"],
    requestId: values["request-id"],
    actorId: values["actor-id"],
  };
  const registry = createDefaultProviderRegistry();
  const result = await ingestProviderPage(registry, request);

  console.log(
    JSON.stringify(
      {
        providerKey: result.providerKey,
        itemCount: result.itemCount,
        rawPayloadCount: result.rawPayloadCount,
        page: request.page,
        checkpointPage: result.persistence.checkpoint?.page ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
