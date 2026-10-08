'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState } from 'react';
import { RotateCcw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import AdminButton from './AdminButton';

export interface AdminFilterBarProps {
  children?: React.ReactNode;
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  onReset?: () => void;
  resetLabel?: string;
  hasActiveFilters?: boolean;
  activeCount?: number;
  className?: string;
}

export default function AdminFilterBar({
  children,
  search,
  filters,
  actions,
  onReset,
  resetLabel = tx("إعادة ضبط"),
  hasActiveFilters = false,
  activeCount = 0,
  className = '',
}: AdminFilterBarProps) {
  const { tx, txLocale } = useAdminT();
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const effectiveActiveCount = activeCount > 0 ? activeCount : (hasActiveFilters ? 1 : 0);

  return (
    <div className={`admin-filter-bar ${className}`}>
      {/* Search Input (Always visible on all screens) */}
      {search && <div className="admin-filter-search">{search}</div>}

      {/* Mobile Filters Toggle Button (Hidden on Desktop) */}
      {(filters || children) && (
        <button
          type="button"
          className={`admin-filter-mobile-toggle ${mobileExpanded ? 'active' : ''}`}
          onClick={() => setMobileExpanded((prev) => !prev)}
          aria-expanded={mobileExpanded}
          aria-label={tx("خيارات التصفية والفلاتر")}
        >
          <div className="filter-toggle-content">
            <Filter size={15} />
            <span>{tx("الفلاتر")}</span>
            {effectiveActiveCount > 0 && (
              <span className="admin-filter-badge">{effectiveActiveCount}</span>
            )}
          </div>
          {mobileExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}

      {/* Filter Controls (Inline on Desktop, Collapsible Drawer/Section on Mobile) */}
      {filters && (
        <div className={`admin-filter-controls ${mobileExpanded ? 'mobile-expanded' : ''}`}>
          {filters}
        </div>
      )}

      {children && (
        <div className={`admin-filter-extra ${mobileExpanded ? 'mobile-expanded' : ''}`}>
          {children}
        </div>
      )}

      {/* Actions and Reset Button */}
      <div className="admin-filter-end-cluster">
        {actions && <div className="admin-filter-actions">{actions}</div>}
        {onReset && (hasActiveFilters || effectiveActiveCount > 0) && (
          <AdminButton
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={onReset}
            title={tx("إعادة ضبط الفلاتر")}
            className="admin-filter-reset-btn"
          >
            {resetLabel}
          </AdminButton>
        )}
      </div>
    </div>
  );
}
