import React from 'react';
import type { Metadata } from 'next';
import FieldPortalShell from '@/components/portal/field/FieldPortalShell';

export const metadata: Metadata = {
  title: 'بوابة العمليات الميدانية | المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية',
  description: 'محطة الرصد والاستقبال الميداني المشفرة لنقاط الاتصال الميدانية بالمركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function FieldPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FieldPortalShell>{children}</FieldPortalShell>;
}
