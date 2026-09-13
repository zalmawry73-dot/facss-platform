'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  GraduationCap, 
  FileText, 
  Mail, 
  Users, 
  Settings, 
  History, 
  LogOut,
  ShieldCheck,
  Building
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-gold-light)', fontSize: '1.2rem' }}>جارٍ تحميل لوحة الإدارة...</p>
      </div>
    );
  }

  const isStaff = user && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role.includes('MANAGER'));

  if (!isStaff) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>غير مصرح بالدخول — لوحة الإدارة مخصصة لقيادة المركز والمشرفين فقط</h2>
        <Link href="/login?redirect=/admin" className="btn btn-gold">
          تسجيل الدخول بحساب إداري
        </Link>
      </div>
    );
  }

  const adminNav = [
    { href: '/admin', label: 'المؤشرات العامة', icon: LayoutDashboard },
    { href: '/admin/requests', label: 'إدارة طلبات الخدمات', icon: ShieldAlert },
    { href: '/admin/training', label: 'قطاع التدريب والدورات', icon: GraduationCap },
    { href: '/admin/research', label: 'الدراسات والأبحاث', icon: FileText },
    { href: '/admin/messages', label: 'رسائل واستفسارات التواصل', icon: Mail },
    { href: '/admin/users', label: 'إدارة المستخدمين والصلاحيات', icon: Users },
    { href: '/admin/settings', label: 'إعدادات النظام والاتصال', icon: Settings },
    { href: '/admin/logs', label: 'سجل النشاط الإداري', icon: History },
  ];

  return (
    <div style={{ paddingBlock: '2rem' }}>
      <div className="container-wide">
        {/* Admin Top Banner */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(135deg, rgba(11,37,24,0.9) 0%, rgba(5,14,9,0.95) 100%)', border: '1px solid rgba(197,155,39,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src="/images/logo.png" alt="FACSS Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFF', margin: 0 }}>
                لوحة الإدارة والتحكم (FACSS CMS)
              </h1>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                {user.fullName} • رتبة: {user.role}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <Link href="/" target="_blank" className="btn btn-outline btn-sm">
              معاينة الموقع العام
            </Link>
            <button onClick={() => logout()} className="btn btn-outline btn-sm" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)' }}>
              <LogOut size={15} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(197,155,39,0.25)', paddingBottom: '0.6rem', overflowX: 'auto' }}>
          {adminNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`btn btn-sm ${isActive ? 'btn-gold' : 'btn-outline'}`}
                style={{ borderRadius: '8px', fontSize: '0.82rem' }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
