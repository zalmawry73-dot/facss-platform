'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import AdminLoadingState from './AdminLoadingState';
import AdminEmptyState from './AdminEmptyState';

export interface ColumnDef<T> {
  key: string;
  header?: React.ReactNode;
  title?: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  width?: string;
  isLtr?: boolean;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface AdminDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string;
  rowKey?: string | ((row: T, index: number) => string);
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  /**
   * Optional custom card renderer for Mobile (< 768px).
   * When provided, mobile view displays an organized list of Record Cards instead of a wide squished table.
   */
  mobileCardRender?: (row: T, index: number) => React.ReactNode;
  /**
   * Display a subtle visual swipe indicator on mobile devices when in table scroll mode.
   * Defaults to true when mobileCardRender is not supplied.
   */
  showScrollCue?: boolean;
}

export default function AdminDataTable<T>({
  columns,
  data,
  keyExtractor,
  rowKey,
  loading = false,
  emptyTitle = tx("لا توجد بيانات متاحة"),
  emptyMessage,
  emptyDescription = tx("لم يتم العثور على أي سجلات في هذا القسم حالياً."),
  emptyAction,
  onRowClick,
  className = '',
  mobileCardRender,
  showScrollCue = true,
}: AdminDataTableProps<T>) {
  const { tx, txLocale } = useAdminT();
  const effectiveEmptyTitle = emptyMessage || emptyTitle;

  const getKey = (row: T, index: number): string => {
    if (keyExtractor) return keyExtractor(row, index);
    if (typeof rowKey === 'function') return rowKey(row, index);
    if (typeof rowKey === 'string') return String((row as any)[rowKey] || index);
    return String((row as any).id || (row as any)._id || index);
  };

  if (loading) {
    return (
      <div className="admin-table-container">
        <AdminLoadingState message={tx("جاري تحميل السجلات...")} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="admin-table-container">
        <AdminEmptyState
          title={effectiveEmptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  const tableElement = (
    <div className={`admin-table-container ${className}`}>
      {showScrollCue && !mobileCardRender && (
        <div className="admin-table-scroll-cue" aria-hidden="true">
          <span>{tx("← اسحب أفقياً لاستعراض كامل البيانات")}</span>
        </div>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const textAlign = col.align === 'center' ? 'center' : col.align === 'end' ? 'end' : 'start';
              const headerText = col.header ?? col.title;
              return (
                <th
                  key={col.key}
                  className="admin-th"
                  style={{
                    textAlign,
                    width: col.width,
                  }}
                >
                  {headerText}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const key = getKey(row, index);
            return (
              <tr
                key={key}
                className="admin-tr"
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((col) => {
                  const textAlign = col.align === 'center' ? 'center' : col.align === 'end' ? 'end' : 'start';
                  const cellContent = col.render
                    ? col.render(row, index)
                    : (row as any)[col.key];

                  return (
                    <td
                      key={col.key}
                      className="admin-td"
                      style={{
                        textAlign,
                        direction: col.isLtr ? 'ltr' : undefined,
                      }}
                    >
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // If mobileCardRender is provided, render both views cleanly toggled by CSS (desktop table / mobile cards)
  if (mobileCardRender) {
    return (
      <div className="admin-responsive-data-wrapper">
        {/* Desktop View (> 768px) */}
        <div className="admin-desktop-table-view">
          {tableElement}
        </div>

        {/* Mobile View (<= 768px): Record Cards */}
        <div className="admin-mobile-cards-view">
          <div className="admin-record-cards">
            {data.map((row, index) => {
              const key = getKey(row, index);
              return (
                <div
                  key={key}
                  className="admin-record-card"
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : undefined}
                >
                  {mobileCardRender(row, index)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return tableElement;
}
