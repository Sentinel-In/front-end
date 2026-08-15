/* ============================================================
   DataTable — SPEC §6
   Generic data table with:
   - Sticky header
   - Sort (click column header, arrow indicator)
   - Right-aligned numerics
   - 2% hover tint
   - Borderless internal rows
   - Density-aware row heights
   - Row click handler
   - Keyboard navigation (↑ ↓ Enter)
   ============================================================ */

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  numeric?: boolean;
  width?: string;
  render?: (row: T, index: number) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  stickyHeader?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T>({
  columns, data, rowKey, onRowClick, emptyMessage = 'No data', stickyHeader = true,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const tableRef = useRef<HTMLDivElement>(null);

  // Sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? null : 'asc');
      if (sortDir === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = [...data];
  if (sortKey && sortDir) {
    sortedData.sort((a, b) => {
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av == null || bv == null) return 0;
      const cmp = typeof av === 'number' && typeof bv === 'number'
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }

  // Keyboard nav
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, sortedData.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && onRowClick) {
      e.preventDefault();
      onRowClick(sortedData[selectedIndex]);
    }
  }, [sortedData, selectedIndex, onRowClick]);

  // Scroll selected into view
  useEffect(() => {
    if (selectedIndex >= 0 && tableRef.current) {
      const row = tableRef.current.querySelector(`[data-row-index="${selectedIndex}"]`);
      row?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (data.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={tableRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ outline: 'none', overflowX: 'auto' }}
    >
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--density-body-size)' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                style={{
                  position: stickyHeader ? 'sticky' : undefined,
                  top: 0,
                  zIndex: 10,
                  padding: '8px 12px',
                  textAlign: col.numeric ? 'right' : 'left',
                  fontSize: 'var(--density-label-size)',
                  fontWeight: 500,
                  color: sortKey === col.key ? 'var(--color-text)' : 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-surface)',
                  borderBottom: '1px solid var(--color-border)',
                  cursor: col.sortable ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  width: col.width,
                  userSelect: 'none',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && sortDir && (
                    sortDir === 'asc'
                      ? <ChevronUp size={12} />
                      : <ChevronDown size={12} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={rowKey(row)}
              data-row-index={index}
              onClick={() => onRowClick?.(row)}
              className="table-row-hover"
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                height: 'var(--density-row-height)',
                backgroundColor: index === selectedIndex
                  ? 'var(--color-accent-bg)'
                  : 'transparent',
                outline: index === selectedIndex ? '1px solid var(--color-accent)' : 'none',
                outlineOffset: '-1px',
                borderRadius: index === selectedIndex ? '4px' : undefined,
              }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '6px 12px',
                    textAlign: col.numeric ? 'right' : 'left',
                    color: 'var(--color-text)',
                    fontFamily: col.numeric ? 'var(--font-mono)' : undefined,
                    borderBottom: '1px solid var(--color-border)',
                    borderColor: 'color-mix(in srgb, var(--color-border) 40%, transparent)',
                  }}
                >
                  {col.render
                    ? col.render(row, index)
                    : String((row as any)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
