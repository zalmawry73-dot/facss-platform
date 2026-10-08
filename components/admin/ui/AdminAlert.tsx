'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import { type LucideIcon, CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type AdminAlertVariant = 'success' | 'warning' | 'danger' | 'info';

export interface AdminAlertProps {
  variant?: AdminAlertVariant;
  title?: string;
  message?: React.ReactNode;
  children?: React.ReactNode;
  icon?: LucideIcon | React.ReactNode;
  onDismiss?: () => void;
  onClose?: () => void;
  className?: string;
}

const DEFAULT_ICONS: Record<AdminAlertVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
};

export default function AdminAlert({
  variant = 'info',
  title,
  message,
  children,
  icon: CustomIcon,
  onDismiss,
  onClose,
  className = '',
}: AdminAlertProps) {
  const { tx, txLocale } = useAdminT();
  const handleClose = onClose || onDismiss;
  const FallbackIcon = DEFAULT_ICONS[variant];
  const iconElement = React.isValidElement(CustomIcon)
    ? CustomIcon
    : CustomIcon
    ? React.createElement(CustomIcon as any, { size: 18, style: { flexShrink: 0, marginTop: '2px' } })
    : React.createElement(FallbackIcon, { size: 18, style: { flexShrink: 0, marginTop: '2px' } });

  const content = message || children;

  return (
    <div className={`admin-alert admin-alert-${variant} ${className}`} role="alert">
      {iconElement}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <strong style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.88rem' }}>
            {title}
          </strong>
        )}
        <div>{content}</div>
      </div>
      {handleClose && (
        <button
          type="button"
          onClick={handleClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label={tx("إغلاق التنبيه")}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
