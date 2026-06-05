# ApoTech

Compliance-native SaaS for independent Indonesian pharmacies. ApoTech treats SatuSehat, BPOM e-MESO, BPOM product verification, Coretax/e-Faktur, and QRIS compliance as first-class workflows instead of after-the-fact reporting.

## Workspace

- `apps/backoffice` - Next.js admin, inventory, and compliance dashboard.
- `apps/pos` - Deferred offline-first POS package placeholder and contracts notes.
- `services/api` - NestJS core domain API for pharmacies, inventory, dispensing, and audit.
- `services/compliance` - NestJS service for government connector adapters and resilient queues.
- `packages/shared` - Shared Zod schemas, domain types, and integration contracts.
- `prisma` - Postgres schema for the MVP foundation.
- `docs` - Architecture, connector, privacy, and local development notes.

## Local Development

```bash
pnpm install
docker compose up -d
pnpm prisma:generate
pnpm dev
```

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm prisma:validate
docker compose config
```

Government integrations are intentionally stubbed behind interfaces until official production access and submission rules are confirmed.
