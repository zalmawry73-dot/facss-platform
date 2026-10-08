'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import { Search, X } from 'lucide-react';

export interface AdminSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export default function AdminSearchInput({
  value,
  onChange,
  placeholder = tx("بحث..."),
  onClear,
  className = '',
}: AdminSearchInputProps) {
  const { tx, txLocale } = useAdminT();
  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div className={`admin-search-wrap ${className}`}>
      <Search size={16} className="admin-search-icon" />
      <input
        type="text"
        className="admin-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="admin-search-clear"
          onClick={handleClear}
          aria-label={tx("مسح البحث")}
          title={tx("مسح البحث")}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
