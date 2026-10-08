'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  LogOut,
  Radio,
  FileEdit,
  UserCheck,
  AlertCircle,
  Globe
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import './field-portal.css';

interface FieldPortalShellProps {
  children: React.ReactNode;
}

interface UserSession {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

export default function FieldPortalShell({ children }: FieldPortalShellProps) {
  const router = useRouter();
  const { locale, toggleLocale, dir } = useLanguage();
  const isAr = locale === 'ar';

  const [session, setSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login?redirect=/portal/field/intake');
          return;
        }
        const data = await res.json();
        if (isMounted) {
          setSession(data.user || null);
        }
      } catch (err) {
        console.error('FieldPortal: Session verification failed', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Fallback
    } finally {
      router.push('/login');
    }
  };

  const getRoleLabel = (role: string) => {
    if (role === 'FIELD_FOCAL_POINT') return isAr ? 'منسق اتصال ميداني' : 'Field Focal Point';
    if (role === 'SUPER_ADMIN') return isAr ? 'الإدارة العليا' : 'Super Admin';
    if (role === 'STAFF') return isAr ? 'كادر تشغيلي' : 'Operations Staff';
    return role.replace(/_/g, ' ');
  };

  return (
    <div className="field-shell" dir={dir}>
      {/* 1. Independent Dedicated Field Header */}
      <header className="field-header" role="banner">
        <div className="field-header-inner">
          {/* Brand & Terminal Identity */}
          <div className="field-brand-group">
            <div className="field-brand-logo" aria-hidden="true">
              <Shield size={22} color="var(--brand-gold-400, #f59e0b)" />
            </div>
            <div className="field-brand-text">
              <h1>
                {isAr
                  ? 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية'
                  : 'Integrated Center for Security, Safety & Field Studies'}
              </h1>
              <div className="field-brand-badges">
                <span className="field-badge-terminal">
                  {isAr ? 'بوابة العمليات الميدانية' : 'Field Operations Portal'}
                </span>
                <span
                  className="field-badge-secure"
                  title={
                    isAr
                      ? 'اتصال مشفر متصل بغرفة العمليات المركزية'
                      : 'Encrypted connection linked to central operations'
                  }
                >
                  <span className="field-pulse-dot" />
                  <span>{isAr ? 'AES-256-GCM مشفر' : 'AES-256-GCM Encrypted'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* User Session, Language Toggle & Quick Logout */}
          <div className="field-header-actions">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={toggleLocale}
              className="field-lang-btn"
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
              aria-label="Toggle language"
            >
              <Globe size={15} />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {session && (
              <div className="field-user-chip" title={session.email}>
                <div className="field-user-avatar">
                  {session.fullName ? session.fullName.charAt(0) : 'م'}
                </div>
                <div className="field-user-details">
                  <span className="field-user-name">{session.fullName}</span>
                  <span className="field-user-role">{getRoleLabel(session.role)}</span>
                </div>
              </div>
            )}

            {session && session.role !== 'FIELD_FOCAL_POINT' && (
              <Link
                href="/admin/incidents"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(217, 119, 6, 0.2)',
                  color: 'var(--brand-gold-400, #f59e0b)',
                  border: '1px solid rgba(217, 119, 6, 0.4)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Shield size={14} />
                <span>{isAr ? 'لوحة الإدارة' : 'Admin Panel'}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="field-logout-btn"
              title={
                isAr
                  ? 'تسجيل الخروج الآمن وإنهاء الجلسة الميدانية'
                  : 'Secure logout and terminate field session'
              }
              aria-label={isAr ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut size={15} />
              <span>{isAr ? 'خروج' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Portal Workspace */}
      <main className="field-main-content" role="main">
        {children}
      </main>

      {/* 3. Minimalist Institutional Footer */}
      <footer className="field-footer" role="contentinfo">
        <div className="field-footer-inner">
          <div>
            <strong>
              {isAr
                ? 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية'
                : 'Integrated Center for Security, Safety & Field Studies'}
            </strong>{' '}
            &copy; {new Date().getFullYear()} —{' '}
            {isAr ? 'بوابة العمليات الميدانية' : 'Field Operations Portal'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <span>
              {isAr
                ? 'بروتوكول أمن المعلومات الميدانية'
                : 'Field Information Security Protocol'}
            </span>
            <span>
              {isAr ? 'معيار التشفير: AES-256-GCM' : 'Encryption Standard: AES-256-GCM'}
            </span>
            <span>
              {isAr ? 'جلسة معزولة ومشفرة' : 'Isolated & Encrypted Session'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
