import { redirect } from 'next/navigation';
import { requireCapability, CAPABILITIES } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { id: string };
}

export default async function AdminRequestDetailPage({ params }: PageProps) {
  // Layer 3 Capability check
  await requireCapability(CAPABILITIES.MANAGE_REQUESTS, '/admin');

  // Smoothly forward to the interactive RequestsManager view with target id query
  redirect(`/admin/requests?id=${params.id}`);
}
