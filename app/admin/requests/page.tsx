import React from 'react';
import prisma from '@/lib/prisma';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';
import RequestsManager, { ServiceRequestItem } from '@/components/admin/RequestsManager';

export const revalidate = 0;

export default async function AdminRequestsPage() {
  // Layer 3 Authorization: Enforce Granular Capability
  await requireCapability(CAPABILITIES.MANAGE_REQUESTS, '/admin');

  const requests = await prisma.serviceRequest.findMany({
    include: {
      service: { select: { titleAr: true } },
      assignedEmployee: { select: { id: true, fullName: true } },
      notes: {
        orderBy: { createdAt: 'desc' },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const serializedRequests: ServiceRequestItem[] = requests.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    organization: r.organization,
    contactName: r.contactName,
    contactEmail: r.contactEmail,
    contactPhone: r.contactPhone,
    priority: r.priority,
    status: r.status,
    description: r.description,
    createdAt: r.createdAt.toISOString(),
    service: { titleAr: r.service.titleAr },
    assignedEmployee: r.assignedEmployee ? { id: r.assignedEmployee.id, fullName: r.assignedEmployee.fullName } : null,
    notes: r.notes.map((n) => ({
      id: n.id,
      authorName: n.authorName,
      note: n.note,
      isClientVisible: n.isClientVisible,
      createdAt: n.createdAt.toISOString(),
    })),
    documents: r.documents.map((d) => ({
      id: d.id,
      title: d.title,
      originalFilename: d.originalFilename,
      documentType: d.documentType,
      visibility: d.visibility,
      isArchived: d.isArchived,
      sizeBytes: d.sizeBytes,
      fileSize: d.fileSize,
      mimeType: d.mimeType,
      createdAt: d.createdAt.toISOString(),
    })),
  }));

  return (
    <div>
      <RequestsManager initialRequests={serializedRequests} />
    </div>
  );
}
