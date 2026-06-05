"use client";

import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  bpomRegistrationNumber: string | null;
  gtin: string | null;
  manufacturer: string | null;
  strength: string | null;
  dosageForm: string | null;
  schedule: string;
  reorderPoint: number;
}

interface ReorderAlert {
  productName: string;
  quantityOnHand: number;
  reorderPoint: number;
  oldestExpiryDate: string | null;
  isBelowReorderPoint: boolean;
}

export function InventoryClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reorderAlerts, setReorderAlerts] = useState<ReorderAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
        
        const [productsRes, alertsRes] = await Promise.all([
          fetch(`${apiUrl}/inventory/products`),
          fetch(`${apiUrl}/inventory/reorder-alerts`)
        ]);

        if (!productsRes.ok || !alertsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const productsData = await productsRes.json();
        const alertsData = await alertsRes.json();

        setProducts(productsData);
        setReorderAlerts(alertsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          {loading ? (
            <p>Loading alerts...</p>
          ) : error ? (
            <p style={{ color: "var(--red)" }}>Error: {error}</p>
          ) : reorderAlerts.length === 0 ? (
            <p>No reorder alerts</p>
          ) : (
            reorderAlerts.map((alert) => (
              <div className="status-line" key={alert.productName}>
                <div>
                  <strong>{alert.productName}</strong>
                  <p>{alert.quantityOnHand} units • Reorder at {alert.reorderPoint}</p>
                </div>
                <span className="badge fail">Action needed</span>
              </div>
            ))
          )}
        </aside>
      </section>

      <section className="grid" aria-label="Inventory overview">
        <div className="panel tile">
          <h2>Total products</h2>
          <p>Unique SKUs in catalog</p>
          <strong>{loading ? "..." : products.length}</strong>
        </div>
        <div className="panel tile">
          <h2>Active batches</h2>
          <p>Batch/lot tracking</p>
          <strong>{loading ? "..." : products.length}</strong>
        </div>
        <div className="panel tile">
          <h2>Below reorder point</h2>
          <p>Products needing restock</p>
          <strong>{loading ? "..." : reorderAlerts.length}</strong>
        </div>
        <div className="panel tile">
          <h2>API Status</h2>
          <p>Connection health</p>
          <strong>{error ? "Error" : "OK"}</strong>
        </div>
      </section>
    </main>
  );
}
