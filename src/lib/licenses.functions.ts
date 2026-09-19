import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createLicenseSchema, durationToSeconds, licenseActionSchema, updateCustomerSchema } from "./license-schemas";

async function requireAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (error || !data) throw new Error("Administrator access required");
}

export const getAdminWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const [{ data: licenses, error }, { data: audits }, { data: profile }] = await Promise.all([
      context.supabase.from("licenses").select("*, customers(*), license_activations(*)").is("archived_at", null).order("created_at", { ascending: false }),
      context.supabase.from("audit_logs").select("*, admin_profiles(display_name)").order("created_at", { ascending: false }).limit(100),
      context.supabase.from("admin_profiles").select("display_name").eq("id", context.userId).maybeSingle(),
    ]);
    if (error) throw new Error("Unable to load licenses");
    const { decryptLicenseKey } = await import("./license-crypto.server");
    const rows = (licenses ?? []).map((license: any) => ({
      ...license,
      license_key: decryptLicenseKey(license.key_ciphertext),
      key_ciphertext: undefined,
      key_hash: undefined,
      active_device: license.license_activations?.find((item: any) => !item.deactivated_at) ?? null,
    }));
    return { licenses: rows, audits: audits ?? [], profile: profile ?? null, now: new Date().toISOString() };
  });

export const createLicense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createLicenseSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { encryptLicenseKey, generateLicenseKey, hashValue } = await import("./license-crypto.server");
    const key = generateLicenseKey();
    const { data: id, error } = await context.supabase.rpc("admin_create_license", {
      _product_identifier: "browser-extension-core",
      _customer_name: data.customerName,
      _phone: data.phone,
      _email: data.email,
      _handle: data.handle,
      _customer_notes: data.customerNotes,
      _key_hash: hashValue(key),
      _key_ciphertext: encryptLicenseKey(key),
      _key_preview: `${key.slice(0, 9)}••••${key.slice(-5)}`,
      _license_type: data.licenseType,
      _duration_seconds: durationToSeconds(data.duration),
      _amount_paid: data.amountPaid,
      _payment_reference: data.paymentReference,
      _license_notes: data.licenseNotes,
    });
    if (error || !id) throw new Error(error?.message ?? "Unable to create license");
    return { id, licenseKey: key };
  });

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateCustomerSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase.rpc("admin_update_customer", {
      _license_id: data.licenseId, _name: data.customerName, _phone: data.phone,
      _email: data.email, _handle: data.handle, _notes: data.customerNotes,
      _amount_paid: data.amountPaid, _payment_reference: data.paymentReference, _license_notes: data.licenseNotes,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const performLicenseAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => licenseActionSchema.parse(input))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    if (data.action === "extend" && !data.seconds) throw new Error("Enter an extension duration");
    const { data: result, error } = await context.supabase.rpc("admin_license_action", {
      _license_id: data.licenseId, _action: data.action, _seconds: data.seconds,
    });
    if (error) throw new Error(error.message);
    return result;
  });