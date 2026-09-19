REVOKE ALL ON FUNCTION public.admin_create_license(text,text,text,text,text,text,text,text,text,public.license_type,bigint,numeric,text,text,integer) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_device_limit(uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_create_license(text,text,text,text,text,text,text,text,text,public.license_type,bigint,numeric,text,text,integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_device_limit(uuid, integer) TO authenticated;