# ApoTech Agent Notes

- Use `pnpm` for all package management.
- Run commands from the repo root unless a package-specific command is required.
- Core verification: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm prisma:validate`.
- Keep government connector implementations behind interfaces until official credentials/specs are confirmed.
- Never commit real patient data, production secrets, or government API credentials.
- Health-data writes must include audit logging and consent-aware flows.

## Cursor Cloud specific instructions

Setup reference: `README.md` and `docs/local-development.md`. The startup update script already runs `pnpm install` + `pnpm prisma:generate`. Postgres and Redis are installed natively (not Docker) in the VM image, and the `apotech`/`apotech` role + `apotech` database already exist.

Per session (services are not auto-started):

- Start datastores: `sudo pg_ctlcluster 16 main start` and `sudo redis-server --daemonize yes --port 6379`. Postgres listens on port **5433** (configured to match `.env.example`), Redis on 6379.
- Ensure `.env` exists: `cp -n .env.example .env`. NestJS services and Prisma read config from `.env`/`process.env`.
- Apply schema + seed (idempotent enough; seed appends): `pnpm prisma migrate deploy` then `pnpm db:seed` (both need `DATABASE_URL` exported, e.g. `set -a; . ./.env; set +a`).

Non-obvious gotchas:

- Turbo runs in strict env mode and does NOT forward `DATABASE_URL` to tasks. `pnpm dev`, `pnpm test`, and `pnpm build` will fail to reach Postgres unless you either pass `--env-mode=loose` (e.g. `pnpm dev -- --env-mode=loose`) or run a service/test directly inside its package with `.env` loaded (e.g. `cd services/api && set -a; . /workspace/.env; set +a; pnpm exec vitest run`).
- Vitest configs do not load `.env`; export env vars before running tests.
- Services and ports: `services/api` (NestJS, :4000, Prisma/Postgres), `services/compliance` (NestJS, :4100, BullMQ/Redis; logs SatuSehat 401s on startup — expected without real connector credentials), `apps/backoffice` (Next.js, :3000; inventory page fetches live data from the API via `NEXT_PUBLIC_API_BASE_URL`).
- The `feature/stok-obat-list-view` branch is incomplete: it references backoffice components (`src/components/icons.tsx`, `src/components/page-header.tsx`, etc.) that exist on `main` but are missing here. As a result the `/stok-obat` route and the backoffice `lint`/`typecheck`/`build` fail. The `/` and `/inventory` routes and the `api`/`compliance`/`shared`/`pos` packages build and run fine. This is a code gap on the branch, not an environment issue.
