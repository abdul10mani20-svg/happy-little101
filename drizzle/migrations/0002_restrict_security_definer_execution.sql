REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_first_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_first_admin(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_create_license(text,text,text,text,text,text,text,text,text,public.license_type,bigint,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_license(text,text,text,text,text,text,text,text,text,public.license_type,bigint,numeric,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_license_action(uuid,text,bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_license_action(uuid,text,bigint) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.admin_update_customer(uuid,text,text,text,text,text,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_customer(uuid,text,text,text,text,text,numeric,text,text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.public_license_operation(text,text,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_license_operation(text,text,text,text,text) TO service_role;