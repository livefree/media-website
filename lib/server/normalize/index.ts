import "server-only";

import { defineServerModule } from "../module";

export const normalizeModule = defineServerModule({
  id: "normalize",
  description: "Normalization boundary for title matching, alias resolution, season and episode mapping, and duplicate detection.",
  owns: ["match pipeline", "alias and year resolution", "episode normalization", "duplicate signals"],
  dependsOn: ["config", "ingest"],
});

export * from "./types";
export * from "./staging";
export * from "./mappers";
export * from "./input";
export * from "./match";
export * from "./service";
