// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  nitro: {
    // GitHub → Vercel deploys (media uploads go to Cloudflare R2 via presigned PUT)
    preset: "vercel",
  },
  vite: {
    resolve: {
      alias: {
        // Legacy stub if a transitive dep still resolves @vercel/cli-config
        "@vercel/cli-config": path.resolve(root, "src/lib/stubs/vercel-cli-config.ts"),
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
