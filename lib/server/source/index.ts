import "server-only";

import { defineServerModule } from "../module";

export const sourceModule = defineServerModule({
  id: "source",
  description: "Source management boundary for playback, download, subtitle inventory, ordering, and replacement hooks.",
  owns: ["source ordering", "line replacement", "temporary disable and override hooks", "source inventory contracts"],
  dependsOn: ["config", "catalog"],
});

export * from "./types";
export * from "./service";
