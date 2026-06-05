"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "../../components/page-header";

type KepatuhanStatus = "Lengkap" | "Perlu Update" | "Kritis";

interface StokObat {
  id: string;
  namaObat: string;
  kodeBpom: string;
  stok: number;
  satuan: string;
  expDate: string; // ISO date
  batchNumber: string;
  status: KepatuhanStatus;
  schedule: string;
}

const statusBadge: Record<KepatuhanStatus, string> = {
  Lengkap: "ok",
  "Perlu Update": "warn",
  Kritis: "fail"
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

const SEED: StokObat[] = [
  { id: "1", namaObat: "Amoxicillin 500mg", kodeBpom: "DKL1023456789A1", stok: 1240, satuan: "kapsul", expDate: "2027-04-30", batchNumber: "AMX-2401", status: "Lengkap", schedule: "Keras" },
  { id: "2", namaObat: "Paracetamol 500mg", kodeBpom: "DBL0822334455B2", stok: 3820, satuan: "tablet", expDate: "2026-09-15", batchNumber: "PCT-2312", status: "Lengkap", schedule: "Bebas" },
  { id: "3", namaObat: "Ibuprofen 400mg", kodeBpom: "DKL1199887766C3", stok: 64, satuan: "tablet", expDate: "2026-07-02", batchNumber: "IBU-2305", status: "Perlu Update", schedule: "Bebas Terbatas" },
  { id: "4", namaObat: "Codeine 10mg", kodeBpom: "DKL1455667788D4", stok: 0, satuan: "tablet", expDate: "2026-06-20", batchNumber: "COD-2210", status: "Kritis", schedule: "Narkotika" },
  { id: "5", namaObat: "Cetirizine 10mg", kodeBpom: "DKL1366554433E5", stok: 910, satuan: "tablet", expDate: "2028-01-10", batchNumber: "CTZ-2402", status: "Lengkap", schedule: "Keras" },
  { id: "6", namaObat: "Omeprazole 20mg", kodeBpom: "DKL1277889900F6", stok: 412, satuan: "kapsul", expDate: "2026-08-05", batchNumber: "OMP-2308", status: "Perlu Update", schedule: "Keras" },
  { id: "7", namaObat: "Diazepam 5mg", kodeBpom: "DKL1588990011G7", stok: 38, satuan: "tablet", expDate: "2026-06-28", batchNumber: "DZP-2207", status: "Kritis", schedule: "Psikotropika" },
  { id: "8", namaObat: "Metformin 500mg", kodeBpom: "DKL1699001122H8", stok: 2150, satuan: "tablet", expDate: "2027-11-30", batchNumber: "MET-2311", status: "Lengkap", schedule: "Keras" },
  { id: "9", namaObat: "Amlodipine 5mg", kodeBpom: "DKL1700112233I9", stok: 780, satuan: "tablet", expDate: "2027-03-18", batchNumber: "AML-2309", status: "Lengkap", schedule: "Keras" },
  { id: "10", namaObat: "Salbutamol Inhaler", kodeBpom: "DKL1811223344J1", stok: 56, satuan: "unit", expDate: "2026-07-22", batchNumber: "SLB-2306", status: "Perlu Update", schedule: "Keras" },
  { id: "11", namaObat: "Vitamin C 1000mg", kodeBpom: "SD0911223344K2", stok: 5400, satuan: "tablet", expDate: "2028-05-01", batchNumber: "VTC-2403", status: "Lengkap", schedule: "Bebas" },
  { id: "12", namaObat: "Loratadine 10mg", kodeBpom: "DKL1922334455L3", stok: 132, satuan: "tablet", expDate: "2026-10-12", batchNumber: "LOR-2310", status: "Perlu Update", schedule: "Bebas Terbatas" },
  { id: "13", namaObat: "Ranitidine 150mg", kodeBpom: "DKL1233445566M4", stok: 0, satuan: "tablet", expDate: "2026-05-30", batchNumber: "RAN-2201", status: "Kritis", schedule: "Keras" },
  { id: "14", namaObat: "Dexamethasone 0.5mg", kodeBpom: "DKL1344556677N5", stok: 640, satuan: "tablet", expDate: "2027-02-14", batchNumber: "DEX-2308", status: "Lengkap", schedule: "Keras" },
  { id: "15", namaObat: "Ciprofloxacin 500mg", kodeBpom: "DKL1455667780O6", stok: 295, satuan: "tablet", expDate: "2026-09-09", batchNumber: "CIP-2307", status: "Perlu Update", schedule: "Keras" }
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

type SortDir = "asc" | "desc";

export function StokObatClient() {
  const [rows] = useState<StokObat[]>(SEED);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailId, setDetailId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof StokObat>("namaObat");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        r.namaObat.toLowerCase().includes(q) ||
        r.kodeBpom.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [rows, query, statusFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  const pageIds = pageRows.map((r) => r.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const selectedIds = Array.from(selected);

  const detailRow = detailId ? rows.find((r) => r.id === detailId) ?? null : null;

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (key: keyof StokObat) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortArrow = (key: keyof StokObat) => {
    const active = sortKey === key;
    return (
      <span className={`sort-arrow${active ? " is-active" : ""}`}>
        {active ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
      </span>
    );
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: "Inventory", href: "/inventory" }, { label: "Stok Obat" }]}
        recordType="Inventory"
        title="Stok Obat"
        actions={
          <>
            <button className="cta secondary">Ekspor</button>
            <a href="/goods-receipt">
              <button className="cta">Tambah Stok</button>
            </a>
          </>
        }
      />

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Cari nama obat atau kode BPOM…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          aria-label="Cari stok obat"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter status kepatuhan"
        >
          <option value="">Semua status</option>
          <option value="Lengkap">Lengkap</option>
          <option value="Perlu Update">Perlu Update</option>
          <option value="Kritis">Kritis</option>
        </select>
      </div>

      <div className={`stok-layout${detailRow ? " has-detail" : ""}`}>
        <div className="table-card">
          {selectedIds.length > 0 && (
            <div className="bulk-toolbar" role="toolbar" aria-label="Aksi massal">
              <span className="bulk-count">{selectedIds.length} dipilih</span>
              <div className="bulk-actions">
                <button
                  type="button"
                  className="cta secondary"
                  onClick={() =>
                    alert(`Perbarui laporan untuk ${selectedIds.length} item stok`)
                  }
                >
                  Perbarui Laporan
                </button>
              </div>
            </div>
          )}

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="col-check">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                      aria-label="Pilih semua baris di halaman"
                    />
                  </th>
                  <th className="is-sortable" onClick={() => handleSort("namaObat")}>
                    <span className="th-inner">Nama Obat {sortArrow("namaObat")}</span>
                  </th>
                  <th className="is-sortable" onClick={() => handleSort("kodeBpom")}>
                    <span className="th-inner">Kode BPOM {sortArrow("kodeBpom")}</span>
                  </th>
                  <th className="col-right is-sortable" onClick={() => handleSort("stok")}>
                    <span className="th-inner">Stok {sortArrow("stok")}</span>
                  </th>
                  <th className="is-sortable" onClick={() => handleSort("expDate")}>
                    <span className="th-inner">Exp Date {sortArrow("expDate")}</span>
                  </th>
                  <th className="is-sortable" onClick={() => handleSort("status")}>
                    <span className="th-inner">Status Kepatuhan {sortArrow("status")}</span>
                  </th>
                  <th className="col-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <h3>Tidak ada stok obat ditemukan</h3>
                        <p>Sesuaikan filter atau tambahkan stok baru.</p>
                        <a href="/goods-receipt">
                          <button className="cta">Tambah Stok</button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => {
                    const isSelected = selected.has(r.id);
                    const isActive = detailId === r.id;
                    return (
                      <tr
                        key={r.id}
                        className={`is-clickable${isSelected ? " is-selected" : ""}${
                          isActive ? " is-active" : ""
                        }`}
                        onClick={() => setDetailId(r.id)}
                      >
                        <td className="col-check" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRow(r.id)}
                            aria-label={`Pilih ${r.namaObat}`}
                          />
                        </td>
                        <td>{r.namaObat}</td>
                        <td className="is-mono">{r.kodeBpom}</td>
                        <td className="col-right">{formatNumber(r.stok)}</td>
                        <td>{formatDate(r.expDate)}</td>
                        <td>
                          <span className={`badge ${statusBadge[r.status]}`}>{r.status}</span>
                        </td>
                        <td className="col-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="row-action"
                            onClick={() => setDetailId(r.id)}
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span className="table-footer-info">
              {sorted.length === 0
                ? "Menampilkan 0 dari 0 hasil"
                : `Menampilkan ${start + 1}–${Math.min(
                    start + pageSize,
                    sorted.length
                  )} dari ${sorted.length} hasil`}
            </span>
            <div className="pagination">
              <label className="per-page">
                <span>Per halaman</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  aria-label="Jumlah per halaman"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <span className="page-indicator">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                type="button"
                className="page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Berikutnya
              </button>
            </div>
          </div>
        </div>

        {detailRow && (
          <aside className="detail-panel" aria-label={`Detail ${detailRow.namaObat}`}>
            <div className="detail-panel-head">
              <div>
                <div className="page-header-eyebrow">Detail Stok</div>
                <h2>{detailRow.namaObat}</h2>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setDetailId(null)}
                aria-label="Tutup panel detail"
              >
                ✕
              </button>
            </div>

            <div className="detail-panel-body">
              <span className={`badge ${statusBadge[detailRow.status]}`}>
                {detailRow.status}
              </span>

              <dl className="detail-fields">
                <div className="detail-field">
                  <dt>Kode BPOM</dt>
                  <dd className="is-mono">{detailRow.kodeBpom}</dd>
                </div>
                <div className="detail-field">
                  <dt>No. Batch</dt>
                  <dd className="is-mono">{detailRow.batchNumber}</dd>
                </div>
                <div className="detail-field">
                  <dt>Stok</dt>
                  <dd>
                    {formatNumber(detailRow.stok)} {detailRow.satuan}
                  </dd>
                </div>
                <div className="detail-field">
                  <dt>Exp Date</dt>
                  <dd>{formatDate(detailRow.expDate)}</dd>
                </div>
                <div className="detail-field">
                  <dt>Golongan</dt>
                  <dd>
                    <span className="gov-tag">{detailRow.schedule}</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="detail-panel-footer">
              <button
                type="button"
                className="cta secondary"
                onClick={() => alert(`Perbarui laporan untuk ${detailRow.namaObat}`)}
              >
                Perbarui Laporan
              </button>
              <a href="/inventory">
                <button type="button" className="cta">
                  Buka Produk
                </button>
              </a>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
