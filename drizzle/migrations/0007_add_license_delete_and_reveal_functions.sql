CREATE OR REPLACE FUNCTION public.admin_delete_license(_license_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _lic record; _customer uuid; _remaining integer;
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT l.id, l.key_preview, l.state, l.customer_id, l.license_type, l.expires_at, l.archived_at
    INTO _lic FROM public.licenses l WHERE l.id = _license_id FOR UPDATE;
  IF _lic.id IS NULL THEN RAISE EXCEPTION 'License not found'; END IF;
  _customer := _lic.customer_id;

  INSERT INTO public.audit_logs(administrator_id, action, license_id, before_data, after_data)
  VALUES(_uid, 'license_deleted', NULL,
    jsonb_build_object('license_id', _lic.id, 'key_preview', _lic.key_preview, 'state', _lic.state,
                       'license_type', _lic.license_type, 'expires_at', _lic.expires_at, 'archived_at', _lic.archived_at),
    jsonb_build_object('deleted', true));

  UPDATE public.audit_logs SET license_id = NULL WHERE license_id = _license_id;
  DELETE FROM public.licenses WHERE id = _license_id;

  SELECT count(*) INTO _remaining FROM public.licenses WHERE customer_id = _customer;
  IF _remaining = 0 THEN DELETE FROM public.customers WHERE id = _customer; END IF;

  RETURN jsonb_build_object('deleted', 1, 'license_id', _license_id);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_delete_licenses_bulk(_scope text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _ids uuid[]; _previews jsonb; _customers uuid[]; _count integer;
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _scope NOT IN ('expired', 'revoked') THEN RAISE EXCEPTION 'Unsupported scope'; END IF;

  SELECT coalesce(array_agg(l.id), '{}'), coalesce(jsonb_agg(l.key_preview), '[]'::jsonb), coalesce(array_agg(DISTINCT l.customer_id), '{}')
    INTO _ids, _previews, _customers
  FROM public.licenses l
  WHERE l.archived_at IS NULL
    AND (
      (_scope = 'revoked' AND l.state = 'revoked')
      OR (_scope = 'expired' AND l.state = 'active' AND l.activated_at IS NOT NULL
          AND l.expires_at IS NOT NULL AND l.expires_at <= now())
    );

  _count := coalesce(array_length(_ids, 1), 0);
  IF _count = 0 THEN RETURN jsonb_build_object('deleted', 0, 'scope', _scope); END IF;

  INSERT INTO public.audit_logs(administrator_id, action, license_id, before_data, after_data)
  VALUES(_uid, 'licenses_bulk_deleted', NULL,
    jsonb_build_object('scope', _scope, 'count', _count, 'key_previews', _previews),
    jsonb_build_object('deleted', _count));

  UPDATE public.audit_logs SET license_id = NULL WHERE license_id = ANY(_ids);
  DELETE FROM public.licenses WHERE id = ANY(_ids);
  DELETE FROM public.customers c
   WHERE c.id = ANY(_customers)
     AND NOT EXISTS (SELECT 1 FROM public.licenses l WHERE l.customer_id = c.id);

  RETURN jsonb_build_object('deleted', _count, 'scope', _scope);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_reveal_license_key(_license_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _cipher text;
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT key_ciphertext INTO _cipher FROM public.licenses WHERE id = _license_id;
  IF _cipher IS NULL THEN RAISE EXCEPTION 'License not found'; END IF;
  INSERT INTO public.audit_logs(administrator_id, action, license_id, before_data, after_data)
  VALUES(_uid, 'license_key_revealed', _license_id, NULL, jsonb_build_object('revealed', true));
  RETURN _cipher;
END; $$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_license(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_licenses_bulk(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_reveal_license_key(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_license(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_licenses_bulk(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reveal_license_key(uuid) TO authenticated;