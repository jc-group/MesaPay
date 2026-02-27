CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.restaurants (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tables (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number VARCHAR(32) NOT NULL,
  qr_token VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id BIGSERIAL PRIMARY KEY,
  table_id BIGINT NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables (restaurant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_tables_qr_token ON public.tables (qr_token);
CREATE INDEX IF NOT EXISTS idx_sessions_table_id ON public.sessions (table_id);
