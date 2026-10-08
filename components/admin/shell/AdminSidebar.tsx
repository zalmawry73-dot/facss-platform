'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  type LucideIcon,
  LayoutDashboard,
  ShieldAlert,
  BellRing,
  AlertTriangle,
  Briefcase,
  FileText,
  GraduationCap,
  BookOpen,
  Settings,
  Mail,
  Users,
  PenSquare,
  Sliders,
  History,
  X,
  Shield,
  ChevronDown
} from 'lucide-react';

interface AdminSidebarProps {
  user: {
    fullName: string;
    role: string;
    email?: string;
  };
  capabilities: string[];
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavItem {
  href: string;
  labelAr: string;
  labelEn: string;
  icon: LucideIcon;
  exact?: boolean;
  requiredCapability?: string | string[];
}

interface NavGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  items: NavItem[];
}

export default function AdminSidebar({
  user,
  capabilities,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const { tx, txLocale } = useAdminT();
  const pathname = usePathname() || '/admin';
  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';
  const isSuperAdmin = user.role === 'SUPER_ADMIN';

  // Navigation definition conforming to approved information architecture
  const rawGroups: NavGroup[] = [
    {
      id: 'dashboard',
      titleAr: tx("المؤشرات الرئيسية"),
      titleEn: 'Overview',
      items: [
        {
          href: '/admin',
          labelAr: tx("لوحة المؤشرات"),
          labelEn: 'Dashboard Overview',
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      id: 'operations',
      titleAr: tx("العمليات الميدانية والإنذار"),
      titleEn: 'Field Operations & Alerts',
      items: [
        {
          href: '/admin/incidents',
          labelAr: tx("البلاغات الميدانية"),
          labelEn: 'Field Incidents',
          icon: ShieldAlert,
          requiredCapability: ['verify_incident', 'analyze_incident'],
        },
        {
          href: '/admin/alerts',
          labelAr: tx("التنبيهات الميدانية"),
          labelEn: 'Field Alerts',
          icon: BellRing,
          requiredCapability: ['draft_incident_alert', 'approve_incident_alert', 'verify_incident'],
        },
        {
          href: '/admin/risks',
          labelAr: tx("سجل المخاطر التشغيلية"),
          labelEn: 'Risk Register',
          icon: AlertTriangle,
          requiredCapability: ['view_risk_register', 'manage_risk_register'],
        },
      ],
    },
    {
      id: 'services',
      titleAr: tx("الخدمات والاستشارات"),
      titleEn: 'Services & Advisory',
      items: [
        {
          href: '/admin/services',
          labelAr: tx("دليل الخدمات المؤسسية"),
          labelEn: 'Services Catalog',
          icon: Briefcase,
        },
        {
          href: '/admin/requests',
          labelAr: tx("طلبات الخدمات"),
          labelEn: 'Service Requests',
          icon: FileText,
          requiredCapability: 'manage_requests',
        },
      ],
    },
    {
      id: 'training',
      titleAr: tx("أكاديمية التدريب وبناء القدرات"),
      titleEn: 'Training Academy',
      items: [
        {
          href: '/admin/training',
          labelAr: tx("إدارة التدريب والدورات"),
          labelEn: 'Training Management',
          icon: GraduationCap,
          requiredCapability: 'manage_training',
        },
      ],
    },
    {
      id: 'research',
      titleAr: tx("الدراسات والأبحاث الميدانية"),
      titleEn: 'Studies & Research',
      items: [
        {
          href: '/admin/research',
          labelAr: tx("الدراسات والأبحاث"),
          labelEn: 'Research & Publications',
          icon: BookOpen,
          requiredCapability: 'manage_research',
        },
      ],
    },
    {
      id: 'system',
      titleAr: tx("إدارة وتشغيل المنظومة"),
      titleEn: 'System Administration',
      items: [
        {
          href: '/admin/system',
          labelAr: tx("مركز تشغيل المنظومة"),
          labelEn: 'Operations Hub',
          icon: Settings,
        },
        {
          href: '/admin/messages',
          labelAr: tx("رسائل واستفسارات التواصل"),
          labelEn: 'Inquiries & Messages',
          icon: Mail,
          requiredCapability: 'manage_messages',
        },
        {
          href: '/admin/users',
          labelAr: tx("المستخدمون والصلاحيات"),
          labelEn: 'Users & RBAC',
          icon: Users,
          requiredCapability: 'manage_users',
        },
        {
          href: '/admin/content',
          labelAr: tx("إدارة المحتوى المؤسسي"),
          labelEn: 'Content CMS',
          icon: PenSquare,
          requiredCapability: 'manage_content',
        },
        {
          href: '/admin/settings',
          labelAr: tx("إعدادات النظام والتواصل"),
          labelEn: 'System Settings',
          icon: Sliders,
          requiredCapability: 'manage_settings',
        },
        {
          href: '/admin/logs',
          labelAr: tx("سجل الرقابة والتدقيق"),
          labelEn: 'Audit Activity Logs',
          icon: History,
          requiredCapability: 'view_audit_logs',
        },
      ],
    },
  ];

  // Helper: Capability Check for item visibility
  const hasAccessToItem = (item: NavItem): boolean => {
    if (isSuperAdmin) return true;
    if (!item.requiredCapability) return true;

    if (Array.isArray(item.requiredCapability)) {
      return item.requiredCapability.some((cap) => capabilities.includes(cap));
    }
    return capabilities.includes(item.requiredCapability);
  };

  // Filter groups: keep only visible items, drop empty groups
  const visibleGroups = rawGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(hasAccessToItem),
    }))
    .filter((group) => group.items.length > 0);

  const isEffectiveCollapsed = collapsed && !mobileOpen;

  return (
    <aside
      className={`admin-sidebar ${isEffectiveCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Admin Navigation"
      role="navigation"
    >
      {/* Sidebar Header: Logo & Branding */}
      <div className="sidebar-header">
        <Link
          href="/admin"
          className="sidebar-brand-link"
          onClick={() => setMobileOpen(false)}
          title={tx("المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية")}
        >
          <img
            src="/images/logo.png"
            alt={tx("شعار المركز")}
            className="sidebar-brand-logo"
          />
          {!isEffectiveCollapsed && (
            <div className="sidebar-brand-text">
              <span className="brand-line-primary">
                {isAr ? 'المركز المتكامل' : 'Integrated Center'}
              </span>
              <span className="brand-line-secondary">
                {isAr ? 'لوحة الإدارة والتحكم' : 'Operations Panel'}
              </span>
            </div>
          )}
        </Link>

        {/* Mobile close button inside drawer */}
        <button
          type="button"
          className="sidebar-mobile-close"
          onClick={() => setMobileOpen(false)}
          aria-label={tx("إغلاق القائمة")}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Scroll Area */}
      <div className="sidebar-nav-container">
        {visibleGroups.map((group) => (
          <div key={group.id} className="sidebar-nav-group">
            {!isEffectiveCollapsed && (
              <span className="sidebar-group-title">
                {isAr ? group.titleAr : group.titleEn}
              </span>
            )}
            {isEffectiveCollapsed && <div className="sidebar-group-divider" />}

            <ul className="sidebar-menu-list">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <li key={item.href} className="sidebar-menu-item">
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`sidebar-link ${isActive ? 'active' : ''}`}
                      title={isEffectiveCollapsed ? (isAr ? item.labelAr : item.labelEn) : undefined}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="sidebar-link-icon">
                        <Icon size={18} />
                      </span>
                      {!isEffectiveCollapsed && (
                        <span className="sidebar-link-text">
                          {isAr ? item.labelAr : item.labelEn}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Sidebar Footer: System Status */}
      <div className="sidebar-footer">
        {!isEffectiveCollapsed ? (
          <div className="sidebar-footer-inner">
            <div className="system-status-indicator">
              <span className="status-dot-live" />
              <span className="status-label-live">
                {isAr ? 'النظام متصل ومراقب أمنياً' : 'System Live & Monitored'}
              </span>
            </div>
            <span className="system-version">v2.0 • FACSS Platform</span>
          </div>
        ) : (
          <div className="sidebar-footer-collapsed" title={tx("النظام متصل ومراقب أمنياً")}>
            <span className="status-dot-live" />
          </div>
        )}
      </div>
    </aside>
  );
}
