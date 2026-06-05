# Compliance Connectors

Government integrations are represented by interfaces and stub adapters until official credentials, endpoint access, and submission rules are confirmed.

## SatuSehat

- Scope: pharmacy-service (`Pelayanan Kefarmasian`) events via FHIR R4.
- Auth: OAuth2 client credentials.
- Runtime behavior: enqueue per dispensing event, retry transient failures, dead-letter permanent failures.
- MVP status: contract and connector stub exist; no production submission without Kemenkes credentials.

## BPOM e-MESO

- Scope: adverse-event capture during or after dispensing.
- MVP behavior: capture structured data, validate consent, prepare submission payload.
- Open point: confirm API availability versus portal-assisted submission. The current scaffold supports portal-assisted mode by default.

## BPOM Product Verification / TTAC

- Scope: read/verify 2D DataMatrix at goods receipt.
- MVP behavior: parse raw DataMatrix and call a verification adapter.
- Out of MVP: generating serialization codes or distributor-side TTAC serialization.

## Coretax/e-Faktur

- Scope: invoice clearance model: XML generation, upload, validation, QR + NSFP tracking.
- Route: licensed ASP/PJAP or host-to-host provider.
- Edge case: preserve support for buyer NITKU invalid / NIK-NPWP mismatch by using a National-ID export workaround when required.

## QRIS

- Scope: QRIS payment abstraction.
- MVP route: Midtrans or Xendit aggregator to avoid direct BI SNAP implementation complexity.
- Security: provider signatures must use SNAP/HMAC-SHA512 verification before state transitions.
