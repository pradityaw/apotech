"use client";

import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "right" | "center";
  mono?: boolean;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
}

export interface BulkAction {
  label: string;
  onClick: (selectedIds: string[]) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowId: (row: T) => string;
  bulkActions?: BulkAction[];
  pageSize?: number;
  emptyState?: ReactNode;
}

type SortDir = "asc" | "desc";

export function DataTable<T>({
  columns,
  rows,
  rowId,
  bulkActions = [],
  pageSize = 10,
  emptyState
}: DataTableProps<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const valueOf = (row: T): string | number => {
      if (col.sortValue) return col.sortValue(row);
      const raw = (row as Record<string, unknown>)[col.key];
      return typeof raw === "number" ? raw : String(raw ?? "");
    };
    return [...rows].sort((a, b) => {
      const av = valueOf(a);
      const bv = valueOf(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, columns, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sortedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pageIds = pageRows.map(rowId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
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

  const handleSort = (col: Column<T>) => {
    if (!col.sortable) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  const selectedIds = Array.from(selected);

  if (rows.length === 0 && emptyState) {
    return <div className="table-card">{emptyState}</div>;
  }

  return (
    <div className="table-card">
      {selectedIds.length > 0 && bulkActions.length > 0 && (
        <div className="bulk-toolbar" role="toolbar" aria-label="Bulk actions">
          <span className="bulk-count">{selectedIds.length} selected</span>
          <div className="bulk-actions">
            {bulkActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="cta secondary"
                onClick={() => action.onClick(selectedIds)}
              >
                {action.label}
              </button>
            ))}
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
                  aria-label="Select all rows on page"
                />
              </th>
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`col-${col.align ?? "left"}${col.sortable ? " is-sortable" : ""}`}
                    onClick={() => handleSort(col)}
                    aria-sort={
                      isSorted ? (sortDir === "asc" ? "ascending" : "descending") : undefined
                    }
                  >
                    <span className="th-inner">
                      {col.header}
                      {col.sortable && (
                        <span className={`sort-arrow${isSorted ? " is-active" : ""}`}>
                          {isSorted ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const id = rowId(row);
              const isSelected = selected.has(id);
              return (
                <tr key={id} className={isSelected ? "is-selected" : undefined}>
                  <td className="col-check">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleRow(id)}
                      aria-label={`Select row ${id}`}
                    />
                  </td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`col-${col.align ?? "left"}${col.mono ? " is-mono" : ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <span className="table-footer-info">
          {sortedRows.length === 0
            ? "0 items"
            : `${(currentPage - 1) * pageSize + 1}–${Math.min(
                currentPage * pageSize,
                sortedRows.length
              )} of ${sortedRows.length}`}
        </span>
        <div className="pagination">
          <button
            type="button"
            className="page-btn"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span className="page-indicator">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="page-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
