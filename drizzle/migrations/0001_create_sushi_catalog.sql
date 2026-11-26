CREATE TABLE public.products (
 id text PRIMARY KEY,
 name text NOT NULL,
 description text NOT NULL,
 price_cents integer NOT NULL CHECK (price_cents > 0),
 tier integer NOT NULL CHECK (tier BETWEEN 1 AND 5),
 image text NOT NULL,
 details text[] NOT NULL DEFAULT '{}',
 position integer NOT NULL DEFAULT 0,
 active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Available dishes are public" ON public.products FOR SELECT TO anon, authenticated USING (active);
COMMENT ON TABLE public.stripe_events IS 'Reserved; unused because this integration verifies Checkout sessions on return and order history without webhooks.';