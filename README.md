# MesaPay

MesaPay es una experiencia mobile-first para restaurantes: menu por QR, cuenta compartida, pagos parciales y PWA offline-ready. Este repo es un monorepo full-stack con frontend en Next.js, backend en FastAPI y PostgreSQL, todo orquestado con Docker Compose.

## Highlights

- Menu por QR y mesa virtual colaborativa
- Cuenta compartida con pagos parciales
- PWA con modo offline y prompt de instalacion
- Backend con FastAPI + SQLAlchemy + Alembic
- Entorno completo con Docker Compose

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
- Node.js 20+ (solo si corres el frontend local fuera de Docker)
- Python 3.12+ (solo si corres el backend local fuera de Docker)

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

## Quickstart (dev)

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
- UI principal: `http://localhost:3000`

Smoke test local:

```bash
./smoke-dev.sh
```

## Produccion (local)

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Para detener:

```bash
docker compose -f docker-compose.prod.yml down
```

## Frontend (MesaPayApp)

Scripts:

- `npm run dev`: Next.js con hot reload
- `npm run build`: build de produccion
- `npm run start`: servidor Next.js de produccion
- `npm run prod`: build + start

PWA:

- Manifest: `MesaPayApp/src/app/manifest.ts`
- Service Worker: `MesaPayApp/public/sw.js`
- Offline page: `MesaPayApp/src/app/offline/page.tsx`
- Iconos: `MesaPayApp/public/icons/icon-192.png`, `MesaPayApp/public/icons/icon-512.png`
- Prompt de instalacion: `MesaPayApp/src/components/pwa-install-prompt.tsx`

Estrategia de cache PWA:

- Navegacion: network-first con fallback a `/offline`
- API publica: network-first con cache de respaldo
- Assets estaticos: stale-while-revalidate

## Backend (MesaPayClient)

Scripts:

- Desarrollo: `uvicorn src.server:app --host 0.0.0.0 --port 3001 --reload`
- Produccion: `uvicorn src.server:app --host 0.0.0.0 --port 3001`
- Migraciones: `alembic upgrade head`
- Nueva migracion: `alembic revision --autogenerate -m "tu_mensaje"`

Endpoints publicos clave:

- `GET /api/v1/public/tables/{qr_token}/menu`
- `POST /api/v1/public/tables/{qr_token}/join`
- `GET /api/v1/public/tables/{qr_token}/bill`
- `POST /api/v1/public/tables/{qr_token}/items`
- `POST /api/v1/public/tables/{qr_token}/checkout`

## Notas

- El frontend usa `NEXT_PUBLIC_API_BASE_URL` para consultar `GET /health`.
- El backend usa SQLAlchemy (code-first) y Alembic para versionar el esquema.
- En Docker (dev/prod), el backend ejecuta `alembic upgrade head` al iniciar.
