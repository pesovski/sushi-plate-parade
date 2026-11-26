// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type ConfigEnv } from "vite";
import path from "node:path";

const appConfig = defineConfig({
  vite: {
    resolve: { alias: [
      { find: "entities/lib/decode.js", replacement: path.resolve("node_modules/entities/lib/decode.js") },
      { find: "entities/lib/encode.js", replacement: path.resolve("node_modules/entities/lib/encode.js") },
      { find: /^entities$/, replacement: path.resolve("node_modules/entities") },
    ] },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});

export default (env: ConfigEnv) => {
  Object.assign(process.env, loadEnv(env.mode, process.cwd(), ""));
  return appConfig(env);
};
