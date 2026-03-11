import "server-only";

import { defineServerModule } from "../module";

export const catalogModule = defineServerModule({
  id: "catalog",
  description: "Canonical catalog boundary for published titles, seasons, episodes, public identity, and read models.",
  owns: ["published catalog reads", "public identity resolution", "catalog read contracts", "catalog write boundaries"],
  dependsOn: ["config"],
});
