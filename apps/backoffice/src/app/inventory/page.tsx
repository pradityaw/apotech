import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory - ApoTech",
  description: "Product catalog, stock batches, and goods receipt management."
};

export default function InventoryPage() {
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
          <div className="eyebrow">Inventory Management</div>
          <h1>Track products, batches, and expiry dates</h1>
          <p className="lede">
            Maintain accurate stock levels, manage supplier goods receipts, and ensure compliance with BPOM serialization requirements.
          </p>
          <div className="cta-row">
            <button className="cta">Add product</button>
            <button className="cta secondary">Process goods receipt</button>
          </div>
        </div>

        <aside className="panel compliance-card" aria-label="Reorder alerts">
          <div>
            <div className="eyebrow">Alerts</div>
            <h2>Reorder needed</h2>
          </div>
          <div className="status-line">
            <div>
              <strong>Amoxicillin 500mg</strong>
              <p>12 units • Reorder at 24</p>
            </div>
            <span className="badge fail">Action needed</span>
          </div>
          <div className="status-line">
            <div>
              <strong>Paracetamol 500mg</strong>
              <p>18 units • Reorder at 48</p>
            </div>
            <span className="badge fail">Action needed</span>
          </div>
        </aside>
      </section>

      <section className="grid" aria-label="Inventory overview">
        <div className="panel tile">
          <h2>Total products</h2>
          <p>Unique SKUs in catalog</p>
          <strong>312</strong>
        </div>
        <div className="panel tile">
          <h2>Active batches</h2>
          <p>Batch/lot tracking</p>
          <strong>1,847</strong>
        </div>
        <div className="panel tile">
          <h2>Expiring soon</h2>
          <p>Within 90 days</p>
          <strong>23</strong>
        </div>
        <div className="panel tile">
          <h2>Recall alerts</h2>
          <p>BPOM notifications</p>
          <strong>0</strong>
        </div>
      </section>
    </main>
  );
}
