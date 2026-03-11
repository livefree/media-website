import "server-only";

import { defineServerModule } from "../module";

export const healthModule = defineServerModule({
  id: "health",
  description: "Health boundary for source probes, degradation transitions, repair queue creation, and refresh scheduling.",
  owns: ["health probes", "availability transitions", "repair queue signals", "refresh scheduling hooks"],
  dependsOn: ["config", "source"],
});

export * from "./types";
export * from "./service";
