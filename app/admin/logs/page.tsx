import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import LogsManager from '@/components/admin/LogsManager';

export const revalidate = 0;

export default async function AdminLogsPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.VIEW_AUDIT_LOGS, '/admin');

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <LogsManager
      initialLogs={JSON.parse(JSON.stringify(logs))}
    />
  );
}
