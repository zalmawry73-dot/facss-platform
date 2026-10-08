'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS_AR: Record<string, string> = {
  get admin() { return tx("لوحة الإدارة"); },
  get incidents() { return tx("البلاغات الميدانية"); },
  get alerts() { return tx("التنبيهات الميدانية"); },
  get risks() { return tx("سجل المخاطر التشغيلية"); },
  get services() { return tx("دليل الخدمات"); },
  get requests() { return tx("طلبات الخدمات"); },
  get training() { return tx("أكاديمية التدريب"); },
  get research() { return tx("الدراسات والأبحاث"); },
  get system() { return tx("مركز تشغيل المنظومة"); },
  get messages() { return tx("رسائل التواصل"); },
  get users() { return tx("المستخدمون والصلاحيات"); },
  get content() { return tx("إدارة المحتوى"); },
  get settings() { return tx("إعدادات النظام"); },
  get logs() { return tx("سجل التدقيق والرقابة"); },
};

const ROUTE_LABELS_EN: Record<string, string> = {
  admin: 'Admin Panel',
  incidents: 'Field Incidents',
  alerts: 'Field Alerts',
  risks: 'Operational Risks',
  services: 'Services Catalog',
  requests: 'Service Requests',
  training: 'Training Academy',
  research: 'Research & Studies',
  system: 'System Operations',
  messages: 'Contact Messages',
  users: 'Users & RBAC',
  content: 'Content CMS',
  settings: 'System Settings',
  logs: 'Audit Logs',
};

export default function AdminBreadcrumb() {
  const { tx, txLocale } = useAdminT();
  const pathname = usePathname() || '/admin';
  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';
  const isRtl = dir === 'rtl';
  const SeparatorIcon = isRtl ? ChevronLeft : ChevronRight;

  const labels = isAr ? ROUTE_LABELS_AR : ROUTE_LABELS_EN;
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'admin')) {
    return (
      <nav aria-label="Breadcrumb" className="admin-breadcrumb">
        <span className="breadcrumb-current">
          {labels['admin'] || tx("لوحة الإدارة")}
        </span>
      </nav>
    );
  }

  const items: Array<{ href: string; label: string; isLast: boolean }> = [];
  let currentPath = '';

  segments.forEach((seg, idx) => {
    currentPath += `/${seg}`;
    const isLast = idx === segments.length - 1;

    let label = labels[seg.toLowerCase()];
    if (!label) {
      // Dynamic ID segment (e.g. incident ID, alert ID, risk ID)
      const prevSeg = segments[idx - 1];
      if (prevSeg === 'incidents') {
        label = isAr ? 'تفاصيل البلاغ' : 'Incident Details';
      } else if (prevSeg === 'alerts') {
        label = isAr ? 'تفاصيل التنبيه' : 'Alert Details';
      } else if (prevSeg === 'risks') {
        label = isAr ? 'تفاصيل الخطر' : 'Risk Details';
      } else {
        label = isAr ? 'تفاصيل السجل' : 'Record Details';
      }
    }

    items.push({ href: currentPath, label, isLast });
  });

  return (
    <nav aria-label="Breadcrumb" className="admin-breadcrumb">
      {items.map((item, index) => {
        if (item.isLast) {
          return (
            <span key={item.href} className="breadcrumb-current" aria-current="page">
              {item.label}
            </span>
          );
        }

        return (
          <React.Fragment key={item.href}>
            <Link href={item.href} className="breadcrumb-link">
              {index === 0 && <Home size={13} style={{ marginInlineEnd: '4px' }} />}
              <span>{item.label}</span>
            </Link>
            <SeparatorIcon size={13} className="breadcrumb-separator" />
          </React.Fragment>
        );
      })}
    </nav>
  );
}
