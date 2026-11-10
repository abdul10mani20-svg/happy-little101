ALTER TABLE public.licenses DROP CONSTRAINT licenses_device_limit_check;
ALTER TABLE public.licenses ADD CONSTRAINT licenses_device_limit_check CHECK (device_limit >= 1 AND device_limit <= 1000000);

CREATE OR REPLACE FUNCTION public.admin_create_license(_product_identifier text, _customer_name text, _phone text, _email text, _handle text, _customer_notes text, _key_hash text, _key_ciphertext text, _key_preview text, _license_type license_type, _duration_seconds bigint, _amount_paid numeric, _payment_reference text, _license_notes text, _device_limit integer)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _customer_id uuid; _license_id uuid; _limit integer := coalesce(_device_limit, 1);
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _duration_seconds <= 0 THEN RAISE EXCEPTION 'Duration must be positive'; END IF;
  IF _limit < 1 OR _limit > 1000000 THEN RAISE EXCEPTION 'Device limit must be at least 1'; END IF;
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
END; $function$;

CREATE OR REPLACE FUNCTION public.admin_set_device_limit(_license_id uuid, _device_limit integer)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _before integer;
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF _device_limit < 1 OR _device_limit > 1000000 THEN RAISE EXCEPTION 'Device limit must be at least 1'; END IF;
  SELECT device_limit INTO _before FROM public.licenses WHERE id = _license_id FOR UPDATE;
  IF _before IS NULL THEN RAISE EXCEPTION 'License not found'; END IF;
  UPDATE public.licenses SET device_limit = _device_limit, updated_at = now() WHERE id = _license_id;
  INSERT INTO public.audit_logs(administrator_id, action, license_id, before_data, after_data)
  VALUES(_uid, 'device_limit_updated', _license_id, jsonb_build_object('device_limit', _before), jsonb_build_object('device_limit', _device_limit));
  RETURN jsonb_build_object('id', _license_id, 'device_limit', _device_limit);
END; $function$;

-- Change time: positive seconds adds, negative removes. Set exact date when _expires_at given.
CREATE OR REPLACE FUNCTION public.admin_change_license_time(_license_id uuid, _seconds bigint DEFAULT NULL, _expires_at timestamptz DEFAULT NULL)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _b public.licenses%ROWTYPE; _new_exp timestamptz; _new_dur bigint;
BEGIN
  IF NOT public.has_role(_uid, 'admin') THEN RAISE EXCEPTION 'Forbidden'; END IF;
  SELECT * INTO _b FROM public.licenses WHERE id = _license_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'License not found'; END IF;
  IF _expires_at IS NOT NULL THEN
    IF _b.activated_at IS NULL THEN
      _new_dur := greatest(1, floor(extract(epoch FROM (_expires_at - now())))::bigint);
      IF _expires_at <= now() THEN RAISE EXCEPTION 'For an unactivated license, choose a future date'; END IF;
      _new_exp := NULL;
    ELSE
      _new_exp := _expires_at;
      _new_dur := greatest(1, floor(extract(epoch FROM (_expires_at - _b.activated_at)))::bigint);
    END IF;
  ELSIF _seconds IS NOT NULL AND _seconds <> 0 THEN
    IF _b.activated_at IS NULL THEN
      _new_dur := _b.duration_seconds + _seconds;
      IF _new_dur <= 0 THEN RAISE EXCEPTION 'Duration cannot go below zero'; END IF;
      _new_exp := NULL;
    ELSE
      _new_exp := coalesce(_b.expires_at, now()) + make_interval(secs => _seconds::double precision);
      _new_dur := greatest(1, _b.duration_seconds + _seconds);
    END IF;
  ELSE
    RAISE EXCEPTION 'Enter an amount of time or a date';
  END IF;
  UPDATE public.licenses SET expires_at = _new_exp, duration_seconds = _new_dur, updated_at = now() WHERE id = _license_id;
  INSERT INTO public.audit_logs(administrator_id, action, license_id, before_data, after_data)
  VALUES(_uid, 'license_extended', _license_id, jsonb_build_object('expires_at', _b.expires_at, 'duration_seconds', _b.duration_seconds), jsonb_build_object('expires_at', _new_exp, 'duration_seconds', _new_dur, 'seconds', _seconds, 'set_to', _expires_at));
  RETURN jsonb_build_object('id', _license_id, 'expires_at', _new_exp, 'duration_seconds', _new_dur);
END; $function$;
REVOKE ALL ON FUNCTION public.admin_change_license_time(uuid, bigint, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_change_license_time(uuid, bigint, timestamptz) TO authenticated;