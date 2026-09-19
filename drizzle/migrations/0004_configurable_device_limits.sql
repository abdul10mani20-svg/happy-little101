ALTER TABLE public.licenses
  ADD COLUMN IF NOT EXISTS device_limit integer NOT NULL DEFAULT 1
  CHECK (device_limit BETWEEN 1 AND 100);

DROP FUNCTION IF EXISTS public.admin_create_license(text,text,text,text,text,text,text,text,text,public.license_type,bigint,numeric,text,text);

CREATE OR REPLACE FUNCTION public.admin_create_license(
  _product_identifier text, _customer_name text, _phone text, _email text, _handle text,
  _customer_notes text, _key_hash text, _key_ciphertext text, _key_preview text,
  _license_type public.license_type, _duration_seconds bigint, _amount_paid numeric,
  _payment_reference text, _license_notes text, _device_limit integer
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _uid uuid := auth.uid(); _customer_id uuid; _license_id uuid; _limit integer := coalesce(_device_limit, 1);
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _duration_seconds <= 0 THEN RAISE EXCEPTION 'Duration must be positive'; END IF;
  IF _limit < 1 OR _limit > 100 THEN RAISE EXCEPTION 'Device limit must be between 1 and 100'; END IF;
  INSERT INTO public.customers(name, phone, email, handle, notes)
  VALUES(trim(_customer_name), nullif(trim(_phone), ''), nullif(lower(trim(_email)), ''), nullif(trim(_handle), ''), nullif(trim(_customer_notes), ''))
  RETURNING id INTO _customer_id;
  INSERT INTO public.licenses(product_id, customer_id, key_hash, key_ciphertext, key_preview, license_type, duration_seconds, amount_paid, payment_reference, notes, created_by, device_limit)
  SELECT id, _customer_id, _key_hash, _key_ciphertext, _key_preview, _license_type, _duration_seconds, _amount_paid, nullif(trim(_payment_reference), ''), nullif(trim(_license_notes), ''), _uid, _limit
  FROM public.products WHERE identifier = _product_identifier
  RETURNING id INTO _license_id;
  IF _license_id IS NULL THEN RAISE EXCEPTION 'Unknown product'; END IF;
  INSERT INTO public.audit_logs(administrator_id, action, license_id, after_data)
  VALUES(_uid, 'license_created', _license_id, jsonb_build_object('license_type', _license_type, 'duration_seconds', _duration_seconds, 'customer_id', _customer_id, 'device_limit', _limit));
  RETURN _license_id;
END; $fn$;

REVOKE ALL ON FUNCTION public.admin_create_license(text,text,text,text,text,text,text,text,text,public.license_type,bigint,numeric,text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_license(text,text,text,text,text,text,text,text,text,public.license_type,bigint,numeric,text,text,integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_device_limit(_license_id uuid, _device_limit integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE _uid uuid := auth.uid(); _before integer;
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _device_limit < 1 OR _device_limit > 100 THEN RAISE EXCEPTION 'Device limit must be between 1 and 100'; END IF;
  SELECT device_limit INTO _before FROM public.licenses WHERE id = _license_id FOR UPDATE;
  IF _before IS NULL THEN RAISE EXCEPTION 'License not found'; END IF;
  UPDATE public.licenses SET device_limit = _device_limit, updated_at = now() WHERE id = _license_id;
  INSERT INTO public.audit_logs(administrator_id, action, license_id, before_data, after_data)
  VALUES(_uid, 'device_limit_updated', _license_id, jsonb_build_object('device_limit', _before), jsonb_build_object('device_limit', _device_limit));
  RETURN jsonb_build_object('id', _license_id, 'device_limit', _device_limit);
END; $fn$;

REVOKE ALL ON FUNCTION public.admin_set_device_limit(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_device_limit(uuid, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.public_license_operation(
  _operation text, _key_hash text, _product_identifier text, _device_hash text, _bucket_key text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  _window timestamptz := date_trunc('minute', now());
  _attempts integer; _license public.licenses%ROWTYPE;
  _existing public.license_activations%ROWTYPE;
  _active_count integer; _status text; _valid boolean := false;
BEGIN
  INSERT INTO public.validation_rate_limits(bucket_key, window_start, attempt_count)
  VALUES(_bucket_key, _window, 1)
  ON CONFLICT(bucket_key, window_start) DO UPDATE SET attempt_count = public.validation_rate_limits.attempt_count + 1
  RETURNING attempt_count INTO _attempts;
  IF _attempts > 30 THEN RETURN jsonb_build_object('valid', false, 'status', 'rate_limited'); END IF;

  SELECT l.* INTO _license FROM public.licenses l
  JOIN public.products p ON p.id = l.product_id
  WHERE l.key_hash = _key_hash AND p.identifier = _product_identifier AND l.archived_at IS NULL
  FOR UPDATE OF l;
  IF NOT FOUND THEN RETURN jsonb_build_object('valid', false, 'status', 'invalid'); END IF;
  IF _license.state = 'revoked' THEN RETURN jsonb_build_object('valid', false, 'status', 'revoked'); END IF;
  IF _license.expires_at IS NOT NULL AND _license.expires_at <= now() THEN
    RETURN jsonb_build_object('valid', false, 'status', 'expired', 'expiresAt', _license.expires_at);
  END IF;

  SELECT * INTO _existing FROM public.license_activations
  WHERE license_id = _license.id AND device_hash = _device_hash;

  IF _operation = 'activate' THEN
    IF _existing.id IS NULL OR _existing.deactivated_at IS NOT NULL THEN
      SELECT count(*) INTO _active_count FROM public.license_activations
      WHERE license_id = _license.id AND deactivated_at IS NULL;
      IF _active_count >= _license.device_limit THEN
        RETURN jsonb_build_object('valid', false, 'status', 'device_limit_reached');
      END IF;
    END IF;
    IF _license.activated_at IS NULL THEN
      UPDATE public.licenses
      SET activated_at = now(), expires_at = now() + make_interval(secs => duration_seconds::double precision), updated_at = now()
      WHERE id = _license.id RETURNING * INTO _license;
      INSERT INTO public.audit_logs(action, license_id, after_data)
      VALUES('license_activated', _license.id, jsonb_build_object('expires_at', _license.expires_at));
    END IF;
    INSERT INTO public.license_activations(license_id, device_hash, product_identifier)
    VALUES(_license.id, _device_hash, _product_identifier)
    ON CONFLICT(license_id, device_hash) DO UPDATE SET last_seen_at = now(), deactivated_at = NULL,
      activated_at = CASE WHEN public.license_activations.deactivated_at IS NULL THEN public.license_activations.activated_at ELSE now() END;
    _valid := true; _status := 'active';

  ELSIF _operation = 'check' THEN
    IF _existing.id IS NULL OR _existing.deactivated_at IS NOT NULL THEN
      RETURN jsonb_build_object('valid', false, 'status', 'device_mismatch');
    END IF;
    UPDATE public.license_activations SET last_seen_at = now()
    WHERE license_id = _license.id AND device_hash = _device_hash;
    _valid := true; _status := 'active';

  ELSIF _operation = 'deactivate' THEN
    IF _existing.id IS NULL OR _existing.deactivated_at IS NOT NULL THEN
      RETURN jsonb_build_object('valid', false, 'status', 'device_mismatch');
    END IF;
    UPDATE public.license_activations SET deactivated_at = now()
    WHERE license_id = _license.id AND device_hash = _device_hash AND deactivated_at IS NULL;
    INSERT INTO public.audit_logs(action, license_id, after_data)
    VALUES('license_deactivated', _license.id, jsonb_build_object('at', now()));
    _status := 'deactivated';
  ELSE
    RETURN jsonb_build_object('valid', false, 'status', 'invalid_operation');
  END IF;

  RETURN jsonb_build_object('valid', _valid, 'status', _status, 'expiresAt', _license.expires_at);
END; $fn$;

REVOKE ALL ON FUNCTION public.public_license_operation(text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.public_license_operation(text,text,text,text,text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.public_license_operation(text,text,text,text,text) TO service_role;