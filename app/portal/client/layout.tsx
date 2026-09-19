'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  FolderLock, 
  User, 
  Bell, 
  LogOut,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, loading } = useAuth();
  const { locale } = useLanguage();

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-gold-light)', fontSize: '1.2rem' }}>جارٍ تحميل بوابة العميل...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#FFF', marginBottom: '1rem' }}>يرجى تسجيل الدخول للوصول إلى بوابة العميل</h2>
        <Link href="/login?redirect=/portal/client" className="btn btn-gold">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const links = [
    { href: '/portal/client', label: 'لوحة المتابعة العامة', icon: LayoutDashboard },
    { href: '/portal/client/requests', label: 'طلبات الخدمات والمستندات', icon: Shield },
    { href: '/portal/client/profile', label: 'الملف المؤسسي والأمان', icon: User },
  ];

  return (
    <div style={{ paddingBlock: '2.5rem' }}>
      <div className="container-wide">
        {/* Portal Header Card */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(197,155,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-light)' }}>
              <Shield size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                بوابة العميل | {user.organization || user.fullName}
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {user.email} • حساب مفعل
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.85rem' }}>
            <Link href="/request-service" className="btn btn-gold btn-sm">
              <Shield size={16} />
              <span>تقديم طلب خدمة جديد</span>
            </Link>
          </div>
        </div>

        {/* Portal Body with Sub-nav tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(197,155,39,0.25)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`btn btn-sm ${isActive ? 'btn-gold' : 'btn-outline'}`}
                style={{ borderRadius: '8px', fontSize: '0.85rem' }}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
