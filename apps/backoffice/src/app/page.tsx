import type { ComplianceConnector, ComplianceStatus } from "@apotech/shared";

type ComplianceRow = {
  connector: ComplianceConnector;
  label: string;
  status: ComplianceStatus;
  count: number;
};

const complianceRows: ComplianceRow[] = [
  { connector: "SATUSEHAT", label: "SatuSehat kefarmasian events", status: "REPORTED", count: 184 },
  { connector: "EMESO", label: "e-MESO adverse event assists", status: "PENDING", count: 2 },
  { connector: "BPOM_VERIFY", label: "BPOM DataMatrix verifications", status: "REPORTED", count: 57 },
  { connector: "CORETAX", label: "Coretax/e-Faktur clearances", status: "FAILED", count: 1 }
];

const statusClass: Record<ComplianceStatus, string> = {
  PENDING: "warn",
  QUEUED: "info",
  REPORTED: "ok",
  FAILED: "fail",
  DEAD_LETTER: "fail",
  SKIPPED: "info"
};

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav" aria-label="Primary navigation">
        <div className="brand">ApoTech</div>
        <div className="nav-links">
          <span>POS</span>
          <a href="/inventory" style={{ color: "inherit", textDecoration: "none" }}>Inventory</a>
          <span>Compliance</span>
          <span>Privacy</span>
        </div>
      </nav>

      <section className="hero">
        <div className="panel hero-copy">
          <div className="eyebrow">Indonesia-first pharmacy ops</div>
          <h1>Compliance is the product, not paperwork.</h1>
          <p className="lede">
            Dispense, track batches, accept QRIS, and keep SatuSehat, e-MESO, BPOM, and Coretax work visible in one operational command center.
          </p>
          <div className="cta-row">
            <button className="cta">Review pending reports</button>
            <a href="/goods-receipt" style={{ textDecoration: "none" }}>
              <button className="cta secondary">Receive stock</button>
            </a>
          </div>
        </div>

        <aside className="panel compliance-card" aria-label="Compliance status">
          <div>
            <div className="eyebrow">Today</div>
            <h2>Compliance queue</h2>
          </div>
          {complianceRows.map((row) => (
            <div className="status-line" key={row.connector}>
              <div>
                <strong>{row.label}</strong>
                <p>{row.count} records</p>
              </div>
              <span className={`badge ${statusClass[row.status]}`}>{row.status.replace("_", " ")}</span>
            </div>
          ))}
        </aside>
      </section>

      <section className="grid" aria-label="MVP workstreams">
        <div className="panel tile">
          <h2>Dispensing + POS</h2>
          <p>Offline-first contract is reserved for the counter app.</p>
          <strong>0</strong>
        </div>
        <div className="panel tile">
          <h2>Inventory batches</h2>
          <p>Batch, lot, expiry, and reorder tracking are core entities.</p>
          <strong>312</strong>
        </div>
        <div className="panel tile">
          <h2>Dead letters</h2>
          <p>Failed government submissions stay actionable.</p>
          <strong>1</strong>
        </div>
        <div className="panel tile">
          <h2>Consent events</h2>
          <p>UU PDP auditability starts at registration.</p>
          <strong>96%</strong>
        </div>
      </section>
    </main>
  );
}
