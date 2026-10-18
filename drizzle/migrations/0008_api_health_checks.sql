CREATE TABLE public.api_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  api_ok boolean NOT NULL,
  product_ok boolean NOT NULL,
  latency_ms integer,
  detail text,
  checked_by uuid
);
GRANT SELECT, INSERT ON public.api_health_checks TO authenticated;
GRANT ALL ON public.api_health_checks TO service_role;
ALTER TABLE public.api_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read health checks" ON public.api_health_checks FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins record health checks" ON public.api_health_checks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND checked_by = auth.uid());
CREATE INDEX api_health_checks_checked_at_idx ON public.api_health_checks (checked_at DESC);