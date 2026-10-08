import React from 'react';

interface AdminSectionProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function AdminSection({
  title,
  description,
  actions,
  children,
  className = '',
  noPadding = false,
}: AdminSectionProps) {
  const hasHeader = Boolean(title || description || actions);

  return (
    <section className={`admin-section ${className}`}>
      {hasHeader && (
        <div className="admin-section-header">
          <div>
            {title && <h2 className="admin-section-title">{title}</h2>}
            {description && <p className="admin-section-desc">{description}</p>}
          </div>
          {actions && <div className="admin-page-header-actions">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'admin-section-body'}>
        {children}
      </div>
    </section>
  );
}
