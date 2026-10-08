import React from 'react';
import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

export interface AdminStatCardProps {
  label?: string;
  title?: string;
  value: string | number;
  icon?: LucideIcon | React.ReactNode;
  color?: string; // Hex or CSS variable for accent color
  bg?: string; // Optional icon background
  helper?: string;
  helperText?: string;
  description?: string;
  badge?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info' | 'neutral' | string;
  href?: string;
}

export default function AdminStatCard({
  label,
  title,
  value,
  icon: Icon,
  color,
  bg,
  helper,
  helperText,
  description,
  badge,
  variant,
  href,
}: AdminStatCardProps) {
  const displayLabel = title || label || '';
  const footerText = description || helperText || helper;

  let accentColor = color || 'var(--admin-primary)';
  if (!color && variant) {
    if (variant === 'danger') accentColor = 'var(--admin-danger)';
    else if (variant === 'warning') accentColor = 'var(--admin-warning)';
    else if (variant === 'success') accentColor = 'var(--admin-success)';
    else if (variant === 'info') accentColor = 'var(--admin-info)';
  }
  const iconElement = React.isValidElement(Icon)
    ? Icon
    : Icon
    ? React.createElement(Icon as any, { size: 18 })
    : null;

  const content = (
    <div
      className="admin-stat-card"
      style={{
        borderInlineStart: `4px solid ${accentColor}`,
      }}
    >
      <div className="admin-stat-header">
        <span className="admin-stat-label">{displayLabel}</span>
        {iconElement && (
          <div
            className="admin-stat-icon-wrap"
            style={{
              background: bg || 'var(--admin-canvas-bg)',
              color: accentColor,
            }}
          >
            {iconElement}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span className="admin-stat-value" style={{ color: accentColor }}>
          {value}
        </span>
        {badge && (
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              background: 'var(--admin-canvas-bg)',
              color: 'var(--admin-text-secondary)',
            }}
          >
            {badge}
          </span>
        )}
      </div>

      {footerText && <span className="admin-stat-footer">{footerText}</span>}
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </Link>
    );
  }

  return content;
}
