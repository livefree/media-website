import "server-only";

import { defineServerModule } from "../module";

export const searchModule = defineServerModule({
  id: "search",
  description: "Search boundary for published catalog query documents, facets, ranking inputs, and analytics hooks.",
  owns: ["search documents", "facet inputs", "ranking inputs", "query analytics contracts"],
  dependsOn: ["config", "catalog"],
});
