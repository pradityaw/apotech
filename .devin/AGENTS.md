# ApoTech Agent Notes

- Use `pnpm` for all package management.
- Run commands from the repo root unless a package-specific command is required.
- Core verification: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm prisma:validate`.
- Keep government connector implementations behind interfaces until official credentials/specs are confirmed.
- Never commit real patient data, production secrets, or government API credentials.
- Health-data writes must include audit logging and consent-aware flows.
