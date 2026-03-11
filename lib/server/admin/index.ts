import "server-only";

import { defineServerModule } from "../module";

export const adminModule = defineServerModule({
  id: "admin",
  description: "Admin boundary for operator APIs and future control-plane workflows across staging, review, publish, and source management.",
  owns: ["operator api contracts", "admin workflow orchestration", "moderation hooks", "publish controls"],
  dependsOn: ["config", "catalog", "review", "source", "search"],
});
