CREATE TABLE public.push_devices (
 token text PRIMARY KEY CHECK (length(token) BETWEEN 20 AND 4096),
 user_id uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.push_devices TO authenticated;
GRANT ALL ON public.push_devices TO service_role;
ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read own push devices" ON public.push_devices FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Customers remove own push devices" ON public.push_devices FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX push_devices_owner_idx ON public.push_devices(user_id);
CREATE FUNCTION public.register_push_device(_token text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 IF length(_token) < 20 OR length(_token) > 4096 OR _token IS NULL THEN RAISE EXCEPTION 'Invalid device'; END IF;
 INSERT INTO public.push_devices(token,user_id) VALUES (_token, auth.uid()) ON CONFLICT (token) DO UPDATE SET user_id=auth.uid(),updated_at=now();
END;
$$;
REVOKE ALL ON FUNCTION public.register_push_device(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_push_device(text) TO authenticated;
ALTER TABLE public.orders ADD COLUMN accepted_push_attempted_at timestamptz;
COMMENT ON COLUMN public.orders.accepted_push_attempted_at IS 'Server-owned claim for accepted-order push; prevents repeated admin requests from sending duplicate alerts.';