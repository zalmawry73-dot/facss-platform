'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  BellRing,
  GraduationCap, 
  FileText, 
  Mail, 
  Users, 
  Settings, 
  History, 
  LogOut,
  Briefcase,
  AlertTriangle,
  PenSquare,
  Package
} from 'lucide-react';

import { AdminButton } from '@/components/admin/ui';

interface AdminClientBarProps {
  user: {
    fullName: string;
    role: string;
  };
}

export default function AdminClientBar({ user }: AdminClientBarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { t, dir } = useLanguage();

  const isSystemActive = 
    pathname === '/admin/system' || 
    pathname.startsWith('/admin/messages') || 
    pathname.startsWith('/admin/users') || 
    pathname.startsWith('/admin/settings') || 
    pathname.startsWith('/admin/content') || 
    pathname.startsWith('/admin/logs');

  const primaryNav = [
    { href: '/admin', label: t.adminNavOverview, icon: LayoutDashboard, exact: true },
    { href: '/admin/incidents', label: t.adminNavIncidents, icon: ShieldAlert },
    { href: '/admin/alerts', label: t.adminNavAlerts, icon: BellRing },
    { href: '/admin/risks', label: t.adminNavRisks, icon: AlertTriangle },
    { href: '/admin/services', label: t.adminNavServices, icon: Briefcase },
    { href: '/admin/requests', label: t.adminNavRequests, icon: FileText },
    { href: '/admin/equipment', label: 'المعدات والمخزون', icon: Package },
    { href: '/admin/training', label: t.adminNavTraining, icon: GraduationCap },
    { href: '/admin/research', label: t.adminNavResearch, icon: FileText },
    { href: '/admin/system', label: t.adminNavSystem, icon: Settings, isGroupActive: isSystemActive },
  ];

  const systemSubNav = [
    { href: '/admin/system', label: t.adminNavSystemOperations, icon: LayoutDashboard },
    { href: '/admin/messages', label: t.adminNavMessages, icon: Mail },
    { href: '/admin/users', label: t.adminNavUsers, icon: Users },
    { href: '/admin/settings', label: t.adminNavSettings, icon: Settings },
    { href: '/admin/content', label: t.adminNavContent, icon: PenSquare },
    { href: '/admin/logs', label: t.adminNavLogs, icon: History },
  ];

  return (
    <div dir={dir} style={{ width: '100%', maxWidth: '100%' }}>
      {/* Admin Top Banner */}
      <div className="card admin-top-banner" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
          <img src="/images/logo.png" alt="شعار المركز" style={{ width: '42px', height: '42px', objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
              {t.adminNavBannerTitle}
            </h1>
            <span style={{ fontSize: '0.78rem', color: 'var(--facss-gold-400)', fontWeight: 600 }}>
              {user.fullName} • {t.adminNavRole}: {user.role}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <AdminButton
            href="/"
            target="_blank"
            variant="outline"
            size="sm"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '0.8rem' }}
          >
            {t.adminNavViewSite}
          </AdminButton>
          <AdminButton
            onClick={() => logout()}
            variant="outline"
            size="sm"
            icon={<LogOut size={14} />}
            style={{ color: '#EF4444', borderColor: 'rgba(239,68,68,0.4)', fontSize: '0.8rem' }}
          >
            {t.adminNavLogout}
          </AdminButton>
        </div>
      </div>

      {/* Primary Navigation (Scrollable on small screens) */}
      <div
        className="admin-tab-scroll"
        style={{
          marginBottom: isSystemActive ? '0.75rem' : '1.75rem',
          borderBottom: isSystemActive ? 'none' : '1px solid var(--border-color)',
          paddingBottom: isSystemActive ? '0' : '0.6rem',
        }}
      >
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const isActive = item.isGroupActive !== undefined 
            ? item.isGroupActive 
            : item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);

          return (
            <AdminButton
              key={item.href}
              href={item.href}
              variant={isActive ? 'primary' : 'outline'}
              size="sm"
              icon={<Icon size={15} />}
              style={{ 
                borderRadius: '8px', 
                fontSize: '0.84rem',
                background: isActive ? undefined : 'var(--surface-card)',
                color: isActive ? undefined : 'var(--text-primary)',
                borderColor: isActive ? undefined : 'var(--border-color)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {item.label}
            </AdminButton>
          );
        })}
      </div>

      {/* System Sub-Navigation (Appears when in System Operations) */}
      {isSystemActive && (
        <div
          className="admin-tab-scroll"
          style={{
            marginBottom: '1.75rem',
            padding: '0.5rem 0.8rem',
            background: 'var(--surface-sunken)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <span style={{ fontSize: '0.78rem', color: 'var(--facss-green-900)', fontWeight: 700, alignSelf: 'center', marginInlineEnd: '0.5rem', whiteSpace: 'nowrap' }}>
            {t.adminNavSystemSections}:
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
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: isSubActive ? 700 : 500,
                  color: isSubActive ? 'var(--facss-green-950)' : 'var(--text-secondary)',
                  background: isSubActive ? 'var(--facss-gold-400)' : 'transparent',
                  border: isSubActive ? '1px solid var(--facss-gold-500)' : '1px solid transparent',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <SubIcon size={14} style={{ color: isSubActive ? 'var(--facss-green-950)' : 'inherit' }} />
                <span>{sub.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
