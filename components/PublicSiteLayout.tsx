'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface PublicSiteLayoutProps {
  children: React.ReactNode;
  contactSettings: {
    contactAddressAr?: string;
    contactAddressEn?: string;
    contactEmail?: string;
  };
}

/**
 * PublicSiteLayout
 * Conditionally isolates the Public Header and Footer from the Admin Panel.
 * When on `/admin/*`, renders purely {children} so that AdminShell has complete
 * autonomous control of the viewport without header/footer bleeding.
 */
export default function PublicSiteLayout({ children, contactSettings }: PublicSiteLayoutProps) {
  const pathname = usePathname();
  const isExcluded = pathname?.startsWith('/admin') || pathname?.startsWith('/portal/field');

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer {...contactSettings} />
    </div>
  );
}
