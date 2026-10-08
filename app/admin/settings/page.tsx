import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import SettingsManager from '@/components/admin/SettingsManager';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.MANAGE_SETTINGS, '/admin');

  const settings = await prisma.systemSetting.findMany({
    orderBy: { key: 'asc' },
  });

  return (
    <div>
      <SettingsManager initialSettings={settings} />
    </div>
  );
}

