CREATE TABLE public.orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','expired','failed')),
 currency text NOT NULL DEFAULT 'usd' CHECK (currency = 'usd'),
 total_cents integer NOT NULL CHECK (total_cents > 0),
 items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array'),
 stripe_session_id text UNIQUE,
 stripe_payment_intent_id text,
 created_at timestamptz NOT NULL DEFAULT now(),
 paid_at timestamptz
);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers read their orders" ON public.orders FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
CREATE INDEX orders_customer_created_idx ON public.orders (user_id, created_at DESC);
CREATE TABLE public.stripe_events (
 id text PRIMARY KEY,
 event_type text NOT NULL,
 processed_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.stripe_events TO service_role;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;