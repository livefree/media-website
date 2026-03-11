import "server-only";

import { defineServerModule } from "../module";

export const reviewModule = defineServerModule({
  id: "review",
  description: "Review and publish gate boundary separating staged candidates from canonical published catalog data.",
  owns: ["review queue", "approve reject merge decisions", "publish preparation", "review audit trail"],
  dependsOn: ["config", "normalize", "catalog"],
});
