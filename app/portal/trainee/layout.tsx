'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  User, 
  Calendar,
  LayoutDashboard,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function TraineePortalLayout({ children }: { children: React.ReactNode }) {
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
              <GraduationCap size={24} style={{ color: 'var(--color-gold-600)' }} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isAr ? 'جارٍ تحميل بوابة المتدرب الأكاديمية...' : 'Loading Trainee Portal...'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              {isAr ? 'يتم استرداد السجل التدريبي والشهادات المسجلة' : 'Retrieving training history and certificates'}
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
              <GraduationCap size={28} style={{ color: 'var(--color-primary-900)' }} />
            </div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              {isAr ? 'بوابة المتدربين والشهادات الرقمية' : 'Trainee Portal & Digital Certificates'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.75rem', lineHeight: 1.6 }}>
              {isAr 
                ? 'يرجى تسجيل الدخول بحساب المتدرب للوصول إلى سجل الدورات، نسب الحضور، والشهادات المعتمدة.' 
                : 'Please sign in with your trainee account to view enrollments, attendance records, and certificates.'}
            </p>
            <Link href="/login?redirect=/portal/trainee" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontWeight: 700 }}>
              {isAr ? 'تسجيل الدخول إلى البوابة' : 'Sign In to Portal'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const links = [
    { 
      href: '/portal/trainee', 
      label: isAr ? 'لوحة التدريب العامة' : 'Training Dashboard', 
      icon: LayoutDashboard,
      exact: true 
    },
    { 
      href: '/portal/trainee/courses', 
      label: isAr ? 'دوراتي والبرامج المتاحة' : 'Courses & Programs', 
      icon: BookOpen,
      exact: false 
    },
    { 
      href: '/portal/trainee/attendance', 
      label: isAr ? 'سجل الحضور والجلسات' : 'Attendance & Sessions', 
      icon: Calendar,
      exact: false 
    },
    { 
      href: '/portal/trainee/certificates', 
      label: isAr ? 'الشهادات المعتمدة' : 'Issued Certificates', 
      icon: Award,
      exact: false 
    },
    { 
      href: '/portal/trainee/profile', 
      label: isAr ? 'الملف الأكاديمي' : 'Trainee Profile', 
      icon: User,
      exact: true 
    },
  ];

  return (
    <div className="portal-container" dir={dir}>
      <div className="container-wide">
        {/* Header Banner Card */}
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
                  {isAr ? 'بوابة المتدرب وبناء القدرات' : 'Trainee & Capacity Building Portal'}
                </h1>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '4px', background: 'rgba(181, 146, 84, 0.25)', color: 'var(--color-gold-300)', fontWeight: 700, border: '1px solid rgba(181, 146, 84, 0.4)' }}>
                  {isAr ? 'أكاديمية التدريب' : 'Training Academy'}
                </span>
              </div>
              <div className="portal-header-subtitle">
                <GraduationCap size={14} />
                <span>{user.fullName}</span>
                <span>•</span>
                <span dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>{user.email}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', zIndex: 1 }}>
            <Link 
              href="/training" 
              className="btn btn-gold btn-sm"
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 1.15rem' }}
            >
              <BookOpen size={16} />
              <span>{isAr ? 'استعراض دليل الدورات' : 'Explore Courses'}</span>
            </Link>
          </div>
        </div>

        {/* Sub-nav tabs */}
        <nav className="portal-nav-bar" aria-label="Trainee Portal Navigation">
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
