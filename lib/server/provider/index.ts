import "server-only";

import { defineServerModule } from "../module";

export const providerModule = defineServerModule({
  id: "provider",
  description:
    "Provider adapter boundary for external catalogs, playback lines, downloads, subtitles, manual submissions, and provider-specific source refresh/probe logic.",
  owns: ["adapter contracts", "provider-specific fetchers", "provider normalization helpers", "provider refresh hooks", "provider probe hooks"],
  dependsOn: ["config"],
});

export * from "./types";
export * from "./http";
export * from "./registry";
export * from "./adapter";
