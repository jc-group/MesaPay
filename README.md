# MesaPay Monorepo

Estructura base full-stack para MesaPay con frontend en Next.js + Tailwind CSS, backend en FastAPI y base de datos PostgreSQL, todo orquestado con Docker Compose.

## Estructura

```text
.
├── MesaPayApp/            # Frontend Next.js (App Router + TypeScript)
├── MesaPayClient/         # Backend FastAPI (Python)
├── MesaPayDB/             # Scripts de inicializacion de PostgreSQL
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

### MesaPayClient

- Desarrollo (hot reload): `uvicorn src.server:app --host 0.0.0.0 --port 3001 --reload`
- Produccion: `uvicorn src.server:app --host 0.0.0.0 --port 3001`

Dependencias backend:

- `pip install -r requirements.txt`

## Notas

- El frontend usa `NEXT_PUBLIC_API_BASE_URL` para consultar `GET /health`.
- Los scripts SQL en `MesaPayDB/init` se ejecutan automaticamente al iniciar PostgreSQL por primera vez.
