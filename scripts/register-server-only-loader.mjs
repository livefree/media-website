import { registerHooks } from "node:module";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const shimUrl = pathToFileURL(resolve(currentDir, "server-only-shim.mjs")).href;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return {
        shortCircuit: true,
        url: shimUrl,
      };
    }

    if ((specifier.startsWith(".") || specifier.startsWith("/")) && !extname(specifier)) {
      try {
        return nextResolve(`${specifier}.ts`, context);
      } catch {
        return nextResolve(`${specifier}/index.ts`, context);
      }
    }

    return nextResolve(specifier, context);
  },
});
