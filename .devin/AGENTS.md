# ApoTech Agent Notes

- Use `pnpm` for all package management.
- Run commands from the repo root unless a package-specific command is required.
- Core verification: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm prisma:validate`.
- Keep government connector implementations behind interfaces until official credentials/specs are confirmed.
- Never commit real patient data, production secrets, or government API credentials.
- Health-data writes must include audit logging and consent-aware flows.

## Cursor Cloud specific instructions

Setup references: `README.md` and `docs/local-development.md`. Use `pnpm` from the repo root unless a package-specific command is required.

Per session:

- Ensure local env exists: `cp -n .env.example .env`. The example config uses Postgres on `localhost:5433`, Redis on `localhost:6379`, API on `4000`, compliance on `4100`, and backoffice on `3000`.
- Start datastores with Docker Compose: `docker compose up -d`. Compose runs Postgres and Redis with the ports expected by `.env.example`; do not assume native `pg_ctlcluster` or `redis-server` are installed in Cursor Cloud.
- Generate the Prisma client after installs or schema changes: `pnpm prisma:generate`.
- Apply schema and seed with environment variables loaded, for example: `set -a; . ./.env; set +a; pnpm prisma migrate deploy --schema prisma/schema.prisma && pnpm db:seed`. For local migration authoring, use `pnpm prisma:migrate`.

Non-obvious gotchas:

- Turbo runs in strict env mode unless configured otherwise. Tasks that need `DATABASE_URL`, `REDIS_URL`, or `NEXT_PUBLIC_API_BASE_URL` may need env loaded directly in the package command or Turbo run with loose env forwarding.
- Services and ports: `services/api` (NestJS, `:4000`, Prisma/Postgres), `services/compliance` (NestJS, `:4100`, BullMQ/Redis), `apps/backoffice` (Next.js, `:3000`, uses `NEXT_PUBLIC_API_BASE_URL`).
