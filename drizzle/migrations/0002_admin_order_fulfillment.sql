CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role public.app_role NOT NULL,
 UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
ALTER TABLE public.orders ADD COLUMN fulfillment_status text NOT NULL DEFAULT 'awaiting_acceptance' CHECK (fulfillment_status IN ('awaiting_acceptance','accepted','delivered'));
ALTER TABLE public.orders ADD COLUMN accepted_at timestamptz;
ALTER TABLE public.orders ADD COLUMN delivered_at timestamptz;
CREATE POLICY "Admins read all orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), 'admin'));
CREATE FUNCTION public.set_order_fulfillment(_order_id uuid, _status text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_order public.orders;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501'; END IF;
 IF _status NOT IN ('accepted','delivered') OR _status IS NULL THEN RAISE EXCEPTION 'Invalid fulfillment status'; END IF;
 SELECT * INTO current_order FROM public.orders WHERE id = _order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
 IF current_order.status <> 'paid' THEN RAISE EXCEPTION 'Only paid orders can be fulfilled'; END IF;
 IF current_order.fulfillment_status = _status THEN RETURN; END IF;
 IF (_status = 'accepted' AND current_order.fulfillment_status <> 'awaiting_acceptance') OR (_status = 'delivered' AND current_order.fulfillment_status <> 'accepted') THEN RAISE EXCEPTION 'Invalid fulfillment transition'; END IF;
 UPDATE public.orders SET fulfillment_status = _status,
 accepted_at = CASE WHEN _status = 'accepted' THEN now() ELSE accepted_at END,
 delivered_at = CASE WHEN _status = 'delivered' THEN now() ELSE delivered_at END WHERE id = _order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.set_order_fulfillment(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_order_fulfillment(uuid,text) TO authenticated;
