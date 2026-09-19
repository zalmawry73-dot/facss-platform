import React from 'react';
import { requireStaff } from '@/lib/rbac';
import AdminClientBar from './AdminClientBar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side authentication and role check (Layer 2)
  const user = await requireStaff('/admin');

  return (
    <div style={{ paddingBlock: '2rem' }}>
      <div className="container-wide">
        <AdminClientBar user={{ fullName: user.fullName, role: user.role }} />
        {children}
      </div>
    </div>
  );
}
