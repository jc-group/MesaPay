DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_tables_restaurant_table_number'
  ) THEN
    ALTER TABLE public.tables
      ADD CONSTRAINT uq_tables_restaurant_table_number UNIQUE (restaurant_id, table_number);
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.menu_categories (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menu_items (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  price_mxn NUMERIC(10,2) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.session_members (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  guest_name VARCHAR(80) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON public.menu_categories (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items (category_id);
CREATE INDEX IF NOT EXISTS idx_session_members_session_id ON public.session_members (session_id);

INSERT INTO public.restaurants (name)
SELECT 'MesaPay Demo - Taqueria Centro'
WHERE NOT EXISTS (
  SELECT 1 FROM public.restaurants WHERE name = 'MesaPay Demo - Taqueria Centro'
);

INSERT INTO public.tables (restaurant_id, table_number, qr_token)
SELECT r.id, '12', 'mesa-12-demo'
FROM public.restaurants r
WHERE r.name = 'MesaPay Demo - Taqueria Centro'
  AND NOT EXISTS (
    SELECT 1 FROM public.tables t WHERE t.qr_token = 'mesa-12-demo'
  );

INSERT INTO public.menu_categories (restaurant_id, name, display_order)
SELECT r.id, 'Tacos', 1
FROM public.restaurants r
WHERE r.name = 'MesaPay Demo - Taqueria Centro'
  AND NOT EXISTS (
    SELECT 1
    FROM public.menu_categories c
    WHERE c.restaurant_id = r.id AND c.name = 'Tacos'
  );

INSERT INTO public.menu_categories (restaurant_id, name, display_order)
SELECT r.id, 'Bebidas', 2
FROM public.restaurants r
WHERE r.name = 'MesaPay Demo - Taqueria Centro'
  AND NOT EXISTS (
    SELECT 1
    FROM public.menu_categories c
    WHERE c.restaurant_id = r.id AND c.name = 'Bebidas'
  );

INSERT INTO public.menu_items (category_id, name, description, price_mxn, display_order)
SELECT c.id, 'Taco al pastor', 'Tortilla de maiz con pastor y pina.', 32.00, 1
FROM public.menu_categories c
INNER JOIN public.restaurants r ON r.id = c.restaurant_id
WHERE r.name = 'MesaPay Demo - Taqueria Centro'
  AND c.name = 'Tacos'
  AND NOT EXISTS (
    SELECT 1 FROM public.menu_items m
    WHERE m.category_id = c.id AND m.name = 'Taco al pastor'
  );

INSERT INTO public.menu_items (category_id, name, description, price_mxn, display_order)
SELECT c.id, 'Gringa especial', 'Tortilla de harina, queso y pastor.', 79.00, 2
FROM public.menu_categories c
INNER JOIN public.restaurants r ON r.id = c.restaurant_id
WHERE r.name = 'MesaPay Demo - Taqueria Centro'
  AND c.name = 'Tacos'
  AND NOT EXISTS (
    SELECT 1 FROM public.menu_items m
    WHERE m.category_id = c.id AND m.name = 'Gringa especial'
  );

INSERT INTO public.menu_items (category_id, name, description, price_mxn, display_order)
SELECT c.id, 'Agua de horchata', 'Vaso de 500 ml.', 35.00, 1
FROM public.menu_categories c
INNER JOIN public.restaurants r ON r.id = c.restaurant_id
WHERE r.name = 'MesaPay Demo - Taqueria Centro'
  AND c.name = 'Bebidas'
  AND NOT EXISTS (
    SELECT 1 FROM public.menu_items m
    WHERE m.category_id = c.id AND m.name = 'Agua de horchata'
  );
