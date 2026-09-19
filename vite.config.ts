// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The Cloud URL and publishable key are public values. Preview builds receive them through
// VITE_*/server-style environment variables, but the publish builder does not always provide
// them, which previously shipped a bundle that could not initialise the client at all.
// supabase.public.json is a committed, non-secret fallback so every build has them.
function publicCloudConfig() {
  try {
    const path = fileURLToPath(new URL("./supabase.public.json", import.meta.url));
    return JSON.parse(readFileSync(path, "utf8")) as { url?: string; publishableKey?: string };
  } catch {
    return {};
  }
}

const fallback = publicCloudConfig();
const publicCloudUrl =
  process.env["VITE_SUPABASE_URL"] ?? process.env["SUPABASE_URL"] ?? fallback.url;
const publicCloudKey =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  process.env["SUPABASE_PUBLISHABLE_KEY"] ??
  fallback.publishableKey;

export default defineConfig({
  vite: {
    define: {
      ...(publicCloudUrl
        ? { "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(publicCloudUrl) }
        : {}),
      ...(publicCloudKey
        ? { "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(publicCloudKey) }
        : {}),
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
