import "server-only";

import { defineServerModule } from "../module";

export const ingestModule = defineServerModule({
  id: "ingest",
  description: "Ingest orchestration boundary for backfill, incremental sync, raw payload capture, retries, and checkpoints.",
  owns: ["ingest jobs", "raw payload intake", "sync checkpoints", "retry and throttle policy"],
  dependsOn: ["config", "provider"],
});

export * from "./types";
export * from "./service";
