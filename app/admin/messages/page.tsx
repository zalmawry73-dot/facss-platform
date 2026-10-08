import React, { Suspense } from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import MessagesManager, { MessageItem } from '@/components/admin/MessagesManager';

export const revalidate = 0;

export default async function AdminMessagesPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.MANAGE_MESSAGES, '/admin');

  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const serializedMessages: MessageItem[] = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    organization: m.organization,
    subject: m.subject,
    message: m.message,
    status: m.status as any,
    replyNotes: m.replyNotes,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div>
      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>جارٍ تحميل الرسائل...</div>}>
        <MessagesManager initialMessages={serializedMessages} />
      </Suspense>
    </div>
  );
}

