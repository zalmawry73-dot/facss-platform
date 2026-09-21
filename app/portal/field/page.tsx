import { redirect } from 'next/navigation';

export default function FieldPortalIndexPage() {
  // Safe redirect: The primary operational station for field focal points is the secure intake terminal
  redirect('/portal/field/intake');
}
