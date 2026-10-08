// Server Component wrapper for /about page
// Fetches ContentBlock data from DB and passes it to the client component
import { cookies } from 'next/headers';
import { getContentSections } from '@/lib/content';
import AboutClientPage from './AboutClientPage';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function AboutPage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale = rawLocale === 'en' ? 'en' : 'ar';

  const content = await getContentSections([
    'identity',
    'principles',
    'activity_fields',
    'lifecycle',
    'org_structure',
    'beneficiaries',
  ]);

  return <AboutClientPage initialContent={content} initialLocale={locale} />;
}
