// src/routes/api/public/v1/license.verify.ts
// SHIM ROUTE — accepts old lovax.net extension format, validates against new license system
// Add this file to happy-little101-main/src/routes/api/public/v1/license.verify.ts

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Old format the extension sends:
// { license_key, session_id, session_token, device_id, deviceId, heartbeat, extension_version }
// New format our system expects:
// { operation, licenseKey, productIdentifier, deviceIdentifier }
// Old format response expected by extension:
// { ok, valid, reason, message, expires_at, session_id, user_name, status }

const PRODUCT_IDENTIFIER = "browser-extension-core";

export const Route = createFileRoute("/api/public/v1/license/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: any = {};
        try { body = await request.json(); } catch { }

        const licenseKey = String(body.license_key || body.licenseKey || "").trim().toUpperCase();
        const deviceId = String(body.device_id || body.deviceId || body.session_id || "").trim();

        if (!licenseKey) {
          return Response.json(
            { ok: false, valid: false, reason: "no_key", message: "No license key provided" },
            { status: 400 }
          );
        }
        if (!deviceId) {
          return Response.json(
            { ok: false, valid: false, reason: "no_device", message: "No device identifier provided" },
            { status: 400 }
          );
        }

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
        if (!url || !key) {
          return Response.json(
            { ok: false, valid: false, reason: "server_error", message: "Server not configured" },
            { status: 503 }
          );
        }

        const client = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const { hashValue } = await import("@/lib/license-crypto.server");
        const ip = request.headers.get("cf-connecting-ip") ?? "unknown";

        const { data, error } = await client.rpc("public_license_operation", {
          _operation: "check",
          _key_hash: hashValue(licenseKey),
          _product_identifier: PRODUCT_IDENTIFIER,
          _device_hash: hashValue(deviceId),
          _bucket_key: hashValue(`${ip}:${licenseKey.slice(0, 9)}`),
        });

        if (error) {
          return Response.json(
            { ok: false, valid: false, reason: "server_error", message: "Validation error" },
            { status: 503 }
          );
        }

        const result = data as { valid?: boolean; status?: string; expiresAt?: string } | null;
        const valid = !!result?.valid;
        const status = result?.status ?? (valid ? "active" : "invalid");
        const expiresAt = result?.expiresAt ?? null;

        // map new status codes to old reason codes the extension understands
        const reasonMap: Record<string, string> = {
          invalid:        "license_not_found",
          expired:        "expired",
          revoked:        "deactivated",
          rate_limited:   "rate_limited",
          device_limit:   "device_conflict",
          active:         "active",
          ok:             "active",
        };
        const reason = reasonMap[status] ?? (valid ? "active" : "license_not_found");

        return Response.json(
          {
            ok: valid,
            valid,
            reason,
            message: valid ? "License is valid" : `License ${status}`,
            expires_at: expiresAt,
            status,
            session_id: deviceId,
            user_name: null,
          },
          {
            status: status === "rate_limited" ? 429 : 200,
            headers: { "Cache-Control": "no-store" },
          }
        );
      },
    },
  },
});
