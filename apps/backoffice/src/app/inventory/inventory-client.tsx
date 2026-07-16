"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../../components/page-header";
import { DataTable, type Column } from "../../components/data-table";
import { Modal } from "../../components/modal";

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

const scheduleBadge: Record<string, string> = {
  OTC: "ok",
  OTC_LIMITED: "info",
  HARD: "warn",
  NARCOTIC: "fail",
  PSYCHOTROPIC: "fail"
};

export function InventoryClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
        const productsRes = await fetch(`${apiUrl}/inventory/products`);
        if (!productsRes.ok) {
          throw new Error("Failed to fetch data");
        }
        setProducts(await productsRes.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        !query ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.manufacturer ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesSchedule = !scheduleFilter || p.schedule === scheduleFilter;
      return matchesQuery && matchesSchedule;
    });
  }, [products, query, scheduleFilter]);

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Product Name",
      sortable: true,
      render: (p) => <a href={`/inventory/${p.id}`}>{p.name}</a>
    },
    {
      key: "bpomRegistrationNumber",
      header: "BPOM Reg. No.",
      sortable: true,
      mono: true,
      render: (p) => p.bpomRegistrationNumber ?? "—"
    },
    { key: "gtin", header: "GTIN", mono: true, render: (p) => p.gtin ?? "—" },
    { key: "manufacturer", header: "Manufacturer", sortable: true, render: (p) => p.manufacturer ?? "—" },
    { key: "strength", header: "Strength", render: (p) => p.strength ?? "—" },
    {
      key: "schedule",
      header: "Schedule",
      sortable: true,
      render: (p) => (
        <span className={`badge ${scheduleBadge[p.schedule] ?? "info"}`}>
          {p.schedule.replace("_", " ")}
        </span>
      )
    },
    {
      key: "reorderPoint",
      header: "Reorder Point",
      sortable: true,
      align: "right",
      render: (p) => p.reorderPoint
    }
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Inventory" }, { label: "Products" }]}
        recordType="Inventory"
        title="Products"
        actions={
          <>
            <a href="/goods-receipt">
              <button className="cta secondary">Process goods receipt</button>
            </a>
            <button className="cta" onClick={() => setCreateOpen(true)}>
              Add product
            </button>
          </>
        }
      />

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search name or manufacturer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search products"
        />
        <select
          value={scheduleFilter}
          onChange={(e) => setScheduleFilter(e.target.value)}
          aria-label="Filter by schedule"
        >
          <option value="">All schedules</option>
          <option value="OTC">OTC</option>
          <option value="OTC_LIMITED">OTC Limited</option>
          <option value="HARD">Hard</option>
          <option value="NARCOTIC">Narcotic</option>
          <option value="PSYCHOTROPIC">Psychotropic</option>
        </select>
      </div>

      {loading ? (
        <div className="table-card">
          <div className="empty-state">
            <h3>Loading products…</h3>
          </div>
        </div>
      ) : error ? (
        <div className="table-card">
          <div className="empty-state">
            <h3>Could not load products</h3>
            <p>{error}</p>
          </div>
        </div>
      ) : (
        <DataTable<Product>
          columns={columns}
          rows={filtered}
          rowId={(p) => p.id}
          pageSize={10}
          bulkActions={[
            { label: "Export", onClick: (ids) => alert(`Export ${ids.length} products`) },
            { label: "Archive", onClick: (ids) => alert(`Archive ${ids.length} products`) }
          ]}
          emptyState={
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Adjust your filters or add a new product.</p>
              <button className="cta" onClick={() => setCreateOpen(true)}>
                Add product
              </button>
            </div>
          }
        />
      )}

      <Modal
        open={createOpen}
        title="New Product"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button className="cta secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button className="cta" onClick={() => setCreateOpen(false)}>
              Save product
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="p-name">Product name</label>
          <input id="p-name" type="text" placeholder="e.g. Amoxicillin 500mg" />
        </div>
        <div className="field">
          <label htmlFor="p-bpom">BPOM registration number</label>
          <input id="p-bpom" type="text" placeholder="DKL1234567890A1" />
        </div>
        <div className="field">
          <label htmlFor="p-manufacturer">Manufacturer</label>
          <input id="p-manufacturer" type="text" placeholder="e.g. Kimia Farma" />
        </div>
        <div className="field">
          <label htmlFor="p-schedule">Schedule</label>
          <select id="p-schedule" defaultValue="OTC">
            <option value="OTC">OTC</option>
            <option value="OTC_LIMITED">OTC Limited</option>
            <option value="HARD">Hard</option>
            <option value="NARCOTIC">Narcotic</option>
            <option value="PSYCHOTROPIC">Psychotropic</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="p-reorder">Reorder point</label>
          <input id="p-reorder" type="number" placeholder="0" />
        </div>
      </Modal>
    </>
  );
}
