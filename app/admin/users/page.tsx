import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import UsersManager, { UserItem } from '@/components/admin/UsersManager';

export const revalidate = 0;

export default async function AdminUsersPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  const session = await requireCapability(CAPABILITIES.MANAGE_USERS, '/admin');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      organization: true,
      phone: true,
      isActive: true,
      createdAt: true,
      capabilities: {
        select: { capability: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedUsers: UserItem[] = users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    organization: u.organization,
    phone: u.phone,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    assignedCapabilities: u.capabilities.map((c) => c.capability),
  }));

  return (
    <div>
      <UsersManager
        initialUsers={serializedUsers}
        currentUserRole={session.role}
        currentUserId={session.userId}
      />
    </div>
  );
}

