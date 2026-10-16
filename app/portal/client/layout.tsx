'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  Shield, 
  FolderLock, 
  User, 
  Plus,
  Building2,
  CheckCircle2,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';

  if (loading) {
    return (
      <div className="portal-container" dir={dir}>
        <div className="container-wide" style={{ paddingBlock: '6rem', textAlign: 'center' }}>
          <div className="portal-card" style={{ maxWidth: '480px', marginInline: 'auto' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(181, 146, 84, 0.12)', border: '1px solid var(--color-gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginInline: 'auto', marginBottom: '1rem' }}>
              <Shield size={24} style={{ color: 'var(--color-gold-600)' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isAr ? 'جارٍ التحقق من صلاحيات بوابة العميل...' : 'Verifying Client Portal Access...'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {isAr ? 'يتم تهيئة الجلسة والبيانات الأمنية المصرح بها' : 'Initializing authorized organizational session'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="portal-container" dir={dir}>
        <div className="container-wide" style={{ paddingBlock: '6rem', textAlign: 'center' }}>
          <div className="portal-card" style={{ maxWidth: '520px', marginInline: 'auto', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(11, 61, 46, 0.08)', border: '1px solid var(--color-primary-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginInline: 'auto', marginBottom: '1.25rem' }}>
              <ShieldCheck size={28} style={{ color: 'var(--color-primary-900)' }} />
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              {isAr ? 'بوابة العملاء والمنظمات الشريكة' : 'Client & Enterprise Portal'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {isAr 
                ? 'يرجى تسجيل الدخول بحساب العميل المعتمد للوصول إلى لوحة متابعة الخدمات والتقارير الأمنية.' 
                : 'Please sign in with your authorized client credentials to track service requests and reports.'}
            </p>
            <Link href="/login?redirect=/portal/client" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 700 }}>
              {isAr ? 'تسجيل الدخول إلى البوابة' : 'Sign In to Portal'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const links = [
    { 
      href: '/portal/client', 
      label: isAr ? 'لوحة المتابعة العامة' : 'Dashboard Overview', 
      icon: LayoutDashboard,
      exact: true
    },
    { 
      href: '/portal/client/requests', 
      label: isAr ? 'طلبات الخدمات والمستندات' : 'Service Requests & Reports', 
      icon: Shield,
      exact: false
    },
    { 
      href: '/portal/client/research', 
      label: isAr ? 'الدراسات والتقارير المقيدة' : 'Restricted Studies & Research', 
      icon: FolderLock,
      exact: false
    },
    { 
      href: '/portal/client/profile', 
      label: isAr ? 'الملف المؤسسي والأمان' : 'Corporate Profile & Security', 
      icon: User,
      exact: true
    },
  ];

  return (
    <div className="portal-container" dir={dir}>
      <div className="container-wide">
        {/* Portal Header Banner */}
        <div className="portal-header-banner">
          <div className="portal-header-brand">
            <div className="portal-header-emblem" aria-hidden="true">
              <img 
                src="/images/brand/logo-symbol-dark.png" 
                alt="درع مركز الحلول المتكاملة" 
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
              />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 className="portal-header-title">
                  {isAr ? 'بوابة العملاء والمنظمات' : 'Client & Enterprise Portal'}
                </h1>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(181, 146, 84, 0.25)', color: 'var(--color-gold-300)', fontWeight: 700, border: '1px solid rgba(181, 146, 84, 0.4)' }}>
                  {isAr ? 'حساب معتمد' : 'Verified Enterprise'}
                </span>
              </div>
              <div className="portal-header-subtitle">
                <Building2 size={13} />
                <span>{user.organization || user.fullName}</span>
                <span>•</span>
                <span dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>{user.email}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', zIndex: 1 }}>
            <Link 
              href="/request-service" 
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.15rem' }}
            >
              <Plus size={16} />
              <span>{isAr ? 'تقديم طلب خدمة جديد' : 'Submit New Request'}</span>
            </Link>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <nav className="portal-nav-bar" aria-label="Client Portal Navigation">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = link.exact 
              ? pathname === link.href 
              : pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`portal-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Portal View Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
