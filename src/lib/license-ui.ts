export type Customer = { id: string; name: string; phone: string | null; email: string | null; handle: string | null; notes: string | null };
export type Activation = { id: string; device_hash: string; activated_at: string; last_seen_at: string; deactivated_at: string | null };
export type LicenseRow = {
  id: string; license_key: string; key_preview: string; license_type: "trial" | "paid" | "custom";
  state: "active" | "revoked"; duration_seconds: number; created_at: string; activated_at: string | null;
  expires_at: string | null; archived_at: string | null; amount_paid: number | null; payment_reference: string | null;
  notes: string | null; customers: Customer; license_activations: Activation[]; active_device: Activation | null;
};
export type AuditRow = { id: string; action: string; created_at: string; license_id: string | null; before_data: unknown; after_data: unknown; admin_profiles: { display_name: string } | null };

export function effectiveStatus(license: LicenseRow, now = Date.now()) {
  if (license.state === "revoked") return "revoked" as const;
  if (!license.activated_at) return "unactivated" as const;
  if (license.expires_at && new Date(license.expires_at).getTime() <= now) return "expired" as const;
  return "active" as const;
}

export function formatDate(value: string | null) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatDuration(total: number) {
  const parts: string[] = [];
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (seconds || !parts.length) parts.push(`${seconds}s`);
  return parts.join(" ");
}