# ApoTech POS Placeholder

The POS implementation is intentionally deferred for the first scaffold. This package keeps offline-first contracts visible while the core API, compliance service, data model, and backoffice app are established.

Target capabilities for the eventual app:

- Complete sales fully offline.
- Persist to local SQLite or IndexedDB.
- Reconcile inventory and dispensing events on reconnect.
- Resolve conflicts with deterministic server-side policies.
- Preserve local receipt and QRIS state transitions for audit.
