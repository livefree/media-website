import "server-only";

import { defineServerModule } from "../module";

export const providerModule = defineServerModule({
  id: "provider",
  description: "Provider adapter boundary for external catalogs, playback lines, downloads, subtitles, and manual submissions.",
  owns: ["adapter contracts", "provider-specific fetchers", "provider normalization helpers"],
  dependsOn: ["config"],
});
