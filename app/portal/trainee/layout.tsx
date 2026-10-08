'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  User, 
  Calendar,
  LayoutDashboard,
  LogOut 
} from 'lucide-react';

export default function TraineePortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-gold-light)', fontSize: '1.2rem' }}>جارٍ تحميل بوابة المتدرب...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#FFF', marginBottom: '1rem' }}>يرجى تسجيل الدخول للوصول لبوابة المتدربين</h2>
        <Link href="/login?redirect=/portal/trainee" className="btn btn-gold">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const links = [
    { href: '/portal/trainee', label: 'لوحة التدريب العامة', icon: LayoutDashboard },
    { href: '/portal/trainee/courses', label: 'دوراتي والبرامج المتاحة', icon: BookOpen },
    { href: '/portal/trainee/attendance', label: 'سجل الحضور والجلسات', icon: Calendar },
    { href: '/portal/trainee/certificates', label: 'الشهادات الصادرة', icon: Award },
    { href: '/portal/trainee/profile', label: 'الملف الشخصي', icon: User },
  ];

  return (
    <div style={{ paddingBlock: '2.5rem' }}>
      <div className="container-wide">
        {/* Header Banner Card */}
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(197,155,39,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gold-light)', flexShrink: 0 }}>
              <GraduationCap size={24} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', margin: 0, lineHeight: 1.3 }}>
                بوابة المتدرب | {user.fullName}
              </h1>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                برامج التدريب وبناء القدرات • {user.email}
              </span>
            </div>
          </div>

          <Link href="/training" className="btn btn-gold btn-sm">
            <BookOpen size={16} />
            <span>استعراض دليل الدورات التدريبية</span>
          </Link>
        </div>

        {/* Sub-nav tabs */}
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
