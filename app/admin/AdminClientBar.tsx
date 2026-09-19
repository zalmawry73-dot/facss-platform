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
  LogOut 
} from 'lucide-react';

interface AdminClientBarProps {
  user: {
    fullName: string;
    role: string;
  };
}

export default function AdminClientBar({ user }: AdminClientBarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  const isSystemActive = 
    pathname === '/admin/system' || 
    pathname.startsWith('/admin/messages') || 
    pathname.startsWith('/admin/users') || 
    pathname.startsWith('/admin/settings') || 
    pathname.startsWith('/admin/logs');

  const primaryNav = [
    { href: '/admin', label: 'المؤشرات العامة', icon: LayoutDashboard, exact: true },
    { href: '/admin/requests', label: 'طلبات الخدمات', icon: ShieldAlert },
    { href: '/admin/training', label: 'أكاديمية التدريب', icon: GraduationCap },
    { href: '/admin/research', label: 'الدراسات والأبحاث', icon: FileText },
    { href: '/admin/system', label: 'تشغيل المنظومة', icon: Settings, isGroupActive: isSystemActive },
  ];

  const systemSubNav = [
    { href: '/admin/system', label: 'مركز التشغيل', icon: LayoutDashboard },
    { href: '/admin/messages', label: 'رسائل التواصل', icon: Mail },
    { href: '/admin/users', label: 'المستخدمين والصلاحيات', icon: Users },
    { href: '/admin/settings', label: 'إعدادات النظام', icon: Settings },
    { href: '/admin/logs', label: 'سجل التدقيق', icon: History },
  ];

  return (
    <>
      {/* Admin Top Banner */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(135deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)', border: '1px solid rgba(201,162,39,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/images/logo.png" alt="FACSS Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#FFFFFF', margin: 0 }}>
              لوحة الإدارة والتحكم (FACSS Admin)
            </h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--facss-gold-400)', fontWeight: 600 }}>
              {user.fullName} • رتبة: {user.role}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <Link href="/" target="_blank" className="btn btn-outline btn-sm" style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF' }}>
            معاينة الموقع العام
          </Link>
          <button onClick={() => logout()} className="btn btn-outline btn-sm" style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)' }}>
            <LogOut size={15} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Primary 5-Section Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: isSystemActive ? '1rem' : '2rem', borderBottom: isSystemActive ? 'none' : '1px solid var(--border-color)', paddingBottom: isSystemActive ? '0' : '0.6rem', overflowX: 'auto' }}>
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.isGroupActive !== undefined 
            ? item.isGroupActive 
            : item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`btn btn-sm ${isActive ? 'btn-gold' : 'btn-outline'}`}
              style={{ 
                borderRadius: '8px', 
                fontSize: '0.85rem',
                background: isActive ? undefined : 'var(--surface-card)',
                color: isActive ? undefined : 'var(--text-primary)',
                borderColor: isActive ? undefined : 'var(--border-color)'
              }}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* System Sub-Navigation (Appears only when in System Operations) */}
      {isSystemActive && (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '2rem', padding: '0.5rem 0.8rem', background: 'var(--surface-sunken)', borderRadius: '8px', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--facss-green-900)', fontWeight: 700, alignSelf: 'center', marginInlineEnd: '0.5rem', whiteSpace: 'nowrap' }}>
            أقسام المنظومة:
          </span>
          {systemSubNav.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive = pathname === sub.href;
            return (
              <Link
                key={sub.href}
                href={sub.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: isSubActive ? 700 : 500,
                  color: isSubActive ? 'var(--facss-green-950)' : 'var(--text-secondary)',
                  background: isSubActive ? 'var(--facss-gold-400)' : 'transparent',
                  border: isSubActive ? '1px solid var(--facss-gold-500)' : '1px solid transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <SubIcon size={13} style={{ color: isSubActive ? 'var(--facss-green-950)' : 'inherit' }} />
                <span>{sub.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
