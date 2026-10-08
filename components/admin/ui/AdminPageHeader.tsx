import React from 'react';

interface AdminPageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}

export default function AdminPageHeader({
  title,
  description,
  actions,
  meta,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-header-start">
        <h1 className="admin-page-header-title">{title}</h1>
        {description && <p className="admin-page-header-desc">{description}</p>}
        {meta && <div style={{ marginTop: '0.45rem' }}>{meta}</div>}
      </div>
      {actions && <div className="admin-page-header-actions">{actions}</div>}
    </header>
  );
}
