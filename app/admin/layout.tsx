import React from 'react';
import { requireStaff, getUserCapabilities } from '@/lib/rbac';
import AdminShell from '@/components/admin/shell/AdminShell';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Server-side authentication and role check (Layer 2)
  const user = await requireStaff('/admin');
  const capabilities = await getUserCapabilities(user.userId, user.role);

  return (
    <AdminShell
      user={{ fullName: user.fullName, role: user.role, email: user.email }}
      capabilities={capabilities}
    >
      {children}
    </AdminShell>
  );
}
