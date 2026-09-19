import { redirect } from 'next/navigation';

export default function ClientReportsPage() {
  // Safe redirect: Reports are canonically accessed and downloaded within each service request
  redirect('/portal/client');
}
