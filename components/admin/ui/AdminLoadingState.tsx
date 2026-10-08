'use client';

import React from 'react';
import { useAdminT } from '@/lib/admin-i18n';

export interface AdminLoadingStateProps {
  message?: string;
  className?: string;
}

export default function AdminLoadingState({
  message = 'جاري معالجة وتحميل البيانات...',
  className = '',
}: AdminLoadingStateProps) {
  const { tx } = useAdminT();

  return (
    <div className={`admin-loading-state ${className}`} role="status" aria-live="polite">
      <div className="admin-spinner" />
      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{tx(message)}</span>
    </div>
  );
}
