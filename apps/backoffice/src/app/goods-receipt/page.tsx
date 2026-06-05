import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Goods Receipt - ApoTech",
  description: "Process supplier deliveries and verify BPOM DataMatrix codes."
};

export default function GoodsReceiptPage() {
  return (
    <main className="shell">
      <nav className="nav" aria-label="Primary navigation">
        <div className="brand">ApoTech</div>
        <div className="nav-links">
          <span>POS</span>
          <span className="active">Inventory</span>
          <span>Compliance</span>
          <span>Privacy</span>
        </div>
      </nav>

      <section className="hero">
        <div className="panel hero-copy">
          <div className="eyebrow">Goods Receipt</div>
          <h1>Verify and receive supplier deliveries</h1>
          <p className="lede">
            Scan BPOM 2D DataMatrix codes to verify product authenticity, then record batch details and quantities for accurate stock tracking.
          </p>
          <div className="cta-row">
            <button className="cta">Scan DataMatrix</button>
            <button className="cta secondary">Manual entry</button>
          </div>
        </div>

        <aside className="panel compliance-card" aria-label="Verification status">
          <div>
            <div className="eyebrow">Live</div>
            <h2>Recent verifications</h2>
          </div>
          <div className="status-line">
            <div>
              <strong>Amoxicillin 500mg</strong>
              <p>Batch: AB123 • Valid</p>
            </div>
            <span className="badge ok">Authentic</span>
          </div>
          <div className="status-line">
            <div>
              <strong>Paracetamol 500mg</strong>
              <p>Batch: CD456 • Valid</p>
            </div>
            <span className="badge ok">Authentic</span>
          </div>
        </aside>
      </section>

      <section className="grid" aria-label="Receipt workflow">
        <div className="panel tile">
          <h2>1. Scan</h2>
          <p>Scan BPOM 2D DataMatrix code</p>
          <strong>→</strong>
        </div>
        <div className="panel tile">
          <h2>2. Verify</h2>
          <p>Confirm authenticity with BPOM</p>
          <strong>→</strong>
        </div>
        <div className="panel tile">
          <h2>3. Record</h2>
          <p>Enter batch, expiry, quantity</p>
          <strong>→</strong>
        </div>
        <div className="panel tile">
          <h2>4. Confirm</h2>
          <p>Update inventory stock levels</p>
          <strong>✓</strong>
        </div>
      </section>
    </main>
  );
}
