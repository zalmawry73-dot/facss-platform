'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import AdminButton from './AdminButton';

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}: AdminPaginationProps) {
  const { tx, isAr } = useAdminT();
  if (totalPages <= 1) return null;

  const isRtl = isAr;
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className={`admin-pagination ${className}`}>
      <div>
        {typeof totalItems === 'number' && (
          <span>
            {tx("إجمالي السجلات:")} <strong>{totalItems}</strong>
            {pageSize && <span> {tx("(صفحة")} {currentPage} {tx("من")} {totalPages})</span>}
          </span>
        )}
      </div>

      <div className="admin-pagination-actions">
        <AdminButton
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={PrevIcon}
        >
          {tx("السابق")}
        </AdminButton>

        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '0 0.5rem' }}>
          {currentPage} / {totalPages}
        </span>

        <AdminButton
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          icon={NextIcon}
          iconPosition="end"
        >
          {tx("التالي")}
        </AdminButton>
      </div>
    </div>
  );
}
