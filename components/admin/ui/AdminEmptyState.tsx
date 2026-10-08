'use client';

import React from 'react';
import { type LucideIcon, Inbox } from 'lucide-react';
import { useAdminT } from '@/lib/admin-i18n';

export interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function AdminEmptyState({
  icon: Icon = Inbox,
  title = 'لا توجد بيانات',
  description = 'لم يتم العثور على أي نتائج مطابقة في هذا السجل.',
  action,
  className = '',
}: AdminEmptyStateProps) {
  const { tx } = useAdminT();

  return (
    <div className={`admin-empty-state ${className}`}>
      <Icon className="admin-empty-icon" />
      <h3 className="admin-empty-title">{tx(title)}</h3>
      {description && <p className="admin-empty-desc">{tx(description)}</p>}
      {action && <div style={{ marginTop: '0.5rem' }}>{action}</div>}
    </div>
  );
}
