import React from 'react';
import type { Metadata } from 'next';
import FieldPortalShell from '@/components/portal/field/FieldPortalShell';

export const metadata: Metadata = {
  title: 'بوابة العمليات الميدانية | مركز الحلول المتكاملة للأمن والسلامة',
  description: 'محطة الرصد والاستقبال الميداني المشفرة لنقاط الاتصال الميدانية بمركز الحلول المتكاملة للأمن والسلامة.',
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
