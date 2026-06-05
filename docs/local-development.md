# Local Development

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker Desktop or compatible Docker runtime

## Setup

```bash
pnpm install
cp .env.example .env
docker compose up -d
pnpm prisma:generate
```

## Run

```bash
pnpm dev
```

Default ports:

- Backoffice: `http://localhost:3000`
- API: `http://localhost:4000`
- Compliance: `http://localhost:4100`
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## Verify

```bash
pnpm prisma:validate
pnpm lint
pnpm typecheck
pnpm build
docker compose config
```

If government connector credentials are unavailable, keep connectors in stub mode. Do not place real secrets in `.env.example` or committed files.
