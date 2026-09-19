import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { validationRequestSchema } from "@/lib/license-schemas";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/api/public/v1/licenses")({
  server: { handlers: { POST: async ({ request }) => {
    const parsed = validationRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ valid: false, status: "invalid_request" }, { status: 400 });
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) return Response.json({ valid: false, status: "unavailable" }, { status: 503 });
    const client = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { hashValue } = await import("@/lib/license-crypto.server");
    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    const { data, error } = await client.rpc("public_license_operation", {
      _operation: parsed.data.operation,
      _key_hash: hashValue(parsed.data.licenseKey.toUpperCase()),
      _product_identifier: parsed.data.productIdentifier,
      _device_hash: hashValue(parsed.data.deviceIdentifier),
      _bucket_key: hashValue(`${ip}:${parsed.data.licenseKey.slice(0, 9)}`),
    });
    if (error) return Response.json({ valid: false, status: "unavailable" }, { status: 503 });
    const result = data as { valid?: boolean; status?: string; expiresAt?: string };
    return Response.json(result, { status: result.status === "rate_limited" ? 429 : 200, headers: { "Cache-Control": "no-store" } });
  } } },
});