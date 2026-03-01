# MesaPay Monorepo

Estructura base full-stack para MesaPay con frontend en Next.js + Tailwind CSS, backend en FastAPI y base de datos PostgreSQL, todo orquestado con Docker Compose.

## Estructura

```text
.
├── MesaPayApp/            # Frontend Next.js (App Router + TypeScript)
├── MesaPayClient/         # Backend FastAPI (Python)
├── MesaPayDB/             # Scripts SQL de referencia
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
├── .env.dev
├── .env.prod
└── README.md
```

## Requisitos

- Docker Desktop (o Docker Engine + Compose v2)

## Variables de entorno

Se incluyen tres archivos:

- `.env.example`: plantilla de referencia
- `.env.dev`: valores para entorno de desarrollo
- `.env.prod`: valores para entorno de produccion

Variables minimas configuradas:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `BACKEND_PORT`
- `FRONTEND_PORT`
- `NEXT_PUBLIC_API_BASE_URL`

## Levantar entorno de desarrollo

```bash
docker compose -f docker-compose.dev.yml up --build
```

Servicios y puertos:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- DB: `localhost:5432`

Validaciones rapidas:

- Health backend: `http://localhost:3001/health`
- Version API: `http://localhost:3001/api/v1/version`
- Ping DB: `http://localhost:3001/api/v1/db/ping`
- Menu por QR: `http://localhost:3001/api/v1/public/tables/mesa-12-demo/menu`
- UI principal: `http://localhost:3000` (muestra estado del backend)

## Levantar entorno de produccion

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Para detener:

```bash
docker compose -f docker-compose.prod.yml down
```

## Scripts por proyecto

### MesaPayApp

- `npm run dev`: Next.js en modo desarrollo con hot reload
- `npm run build`: build de produccion
- `npm run start`: servidor Next.js de produccion
- `npm run prod`: build + start

PWA mobile-first:

- Manifest: `MesaPayApp/src/app/manifest.ts`
- Service Worker: `MesaPayApp/public/sw.js`
- Offline page: `MesaPayApp/src/app/offline/page.tsx`
- Iconos: `MesaPayApp/public/icons/icon-192.png` y `MesaPayApp/public/icons/icon-512.png`
- Prompt de instalacion: `MesaPayApp/src/components/pwa-install-prompt.tsx`

Estrategia de cache PWA:

- Navegacion: network-first con fallback a `/offline`
- API publica: network-first con cache de respaldo
- Assets estaticos: stale-while-revalidate

### MesaPayClient

- Desarrollo (hot reload): `uvicorn src.server:app --host 0.0.0.0 --port 3001 --reload`
- Produccion: `uvicorn src.server:app --host 0.0.0.0 --port 3001`
- Migraciones: `alembic upgrade head`
- Nueva migracion (code-first): `alembic revision --autogenerate -m "tu_mensaje"`

Endpoints publicos clave:

- `GET /api/v1/public/tables/{qr_token}/menu`
- `POST /api/v1/public/tables/{qr_token}/join`
- `GET /api/v1/public/tables/{qr_token}/bill` (cuenta compartida)
- `POST /api/v1/public/tables/{qr_token}/items` (agregar articulos a cuenta compartida)
- `POST /api/v1/public/tables/{qr_token}/checkout` (pagar seleccion propia o de otros)

Dependencias backend:

- `pip install -r requirements.txt`

## Notas

- El frontend usa `NEXT_PUBLIC_API_BASE_URL` para consultar `GET /health`.
- El backend usa SQLAlchemy (code-first) y Alembic para versionar el esquema.
- En Docker (dev/prod), el backend ejecuta `alembic upgrade head` al iniciar.
