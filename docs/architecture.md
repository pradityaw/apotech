# Architecture

ApoTech is a TypeScript monorepo designed around compliance-native pharmacy operations for Indonesian apotek.

## Packages

- `apps/backoffice`: Next.js owner/admin app for inventory, compliance, pharmacy settings, and operational review.
- `apps/pos`: Deferred POS placeholder. The eventual POS should be Android-first React Native or a robust PWA with local SQLite/IndexedDB.
- `services/api`: NestJS domain API for pharmacy, product, stock, dispensing, payment records, consent, and audit.
- `services/compliance`: Isolated NestJS connector service for government integrations and resilient job processing.
- `packages/shared`: Zod schemas and TypeScript contracts shared by frontend, API, POS, and compliance workers.
- `prisma`: Postgres schema for the MVP domain.

## Core Data Flow

1. A dispensing event is created by POS or backoffice.
2. Inventory movements decrement the selected batch/lot and preserve expiry traceability.
3. The API records audit logs for health-data writes and compliance submissions.
4. Compliance jobs are queued by connector: SatuSehat, e-MESO, BPOM verify, Coretax, and QRIS.
5. The compliance service retries transient failures and keeps dead-letter jobs visible in the dashboard.

## Offline POS Direction

The POS must eventually complete a sale offline without requiring network access. A local-first client should emit idempotent sync envelopes with a client ID, device ID, logical clock, and immutable dispensing payload. The server should reconcile conflicts using deterministic rules and preserve audit history.

## Deployment Direction

Production data must be hosted in Indonesia-aligned infrastructure. Candidate targets include AWS Asia Pacific Jakarta, GCP Jakarta, or compliant local IDC partners. PSE registration and operational procedures are part of the compliance baseline, not launch afterthoughts.
