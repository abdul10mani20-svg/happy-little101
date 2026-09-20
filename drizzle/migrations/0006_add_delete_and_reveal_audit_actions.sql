ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'license_deleted';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'licenses_bulk_deleted';
ALTER TYPE public.audit_action ADD VALUE IF NOT EXISTS 'license_key_revealed';