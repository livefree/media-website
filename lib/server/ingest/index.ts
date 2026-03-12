import "server-only";

import { defineServerModule } from "../module";

export const ingestModule = defineServerModule({
  id: "ingest",
  description:
    "Ingest orchestration boundary for backfill, incremental sync, source refresh/probe intake, raw payload capture, retries, and checkpoints.",
  owns: ["ingest jobs", "raw payload intake", "sync checkpoints", "source refresh intake", "repair-intake handoff", "retry and throttle policy"],
  dependsOn: ["config", "provider"],
});

export * from "./types";
export * from "./service";
export * from "./execution";
export * from "./page-worker";
export * from "./sync-scheduler";
export * from "./sync-orchestration";
export * from "./source-jobs";
export * from "./worker";
export * from "./launch-validation";
