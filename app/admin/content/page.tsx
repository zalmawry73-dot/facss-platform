import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import ContentManager from '@/components/admin/ContentManager';

export const revalidate = 0;

export default async function AdminContentPage() {
  // Authorization: MANAGE_CONTENT capability required (SUPER_ADMIN has all caps)
  const user = await requireCapability(CAPABILITIES.MANAGE_CONTENT, '/admin');

  let blocks: any[] = [];
  try {
    if ((prisma as any).contentBlock) {
      blocks = await (prisma as any).contentBlock.findMany({
        orderBy: [{ section: 'asc' }, { order: 'asc' }],
      });
    } else {
      blocks = await prisma.$queryRaw<any[]>`
        SELECT * FROM "ContentBlock"
        ORDER BY "section" ASC, "order" ASC
      `;
    }
  } catch (err) {
    console.error('AdminContentPage query error:', err);
    blocks = [];
  }

  return (
    <div>
      <ContentManager
        initialBlocks={blocks as any}
        adminName={user.fullName || 'Admin'}
      />
    </div>
  );
}
