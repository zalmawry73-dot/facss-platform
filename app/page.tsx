// Server Component wrapper for Homepage (/)
// Fetches ContentBlock data from DB and passes it to the client component
import { cookies } from 'next/headers';
import { getContentSections } from '@/lib/content';
import HomeClientPage from './HomeClientPage';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale = rawLocale === 'en' ? 'en' : 'ar';

  const content = await getContentSections([
    'homepage',
    'principles',
    'activity_fields',
    'beneficiaries',
    'identity',
  ]);

  return <HomeClientPage initialContent={content} initialLocale={locale} />;
}
