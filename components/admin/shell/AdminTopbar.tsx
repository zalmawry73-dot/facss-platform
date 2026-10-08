'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminBreadcrumb from './AdminBreadcrumb';
import NotificationBell from '@/components/NotificationBell';
import { 
  Menu, 
  X, 
  PanelRightClose, 
  PanelRightOpen, 
  ExternalLink, 
  LogOut, 
  Globe, 
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

interface AdminTopbarProps {
  user: {
    fullName: string;
    role: string;
    email?: string;
  };
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function AdminTopbar({
  user,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminTopbarProps) {
  const { tx, txLocale } = useAdminT();
  const { logout } = useAuth();
  const { locale, toggleLocale, dir } = useLanguage();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const isAr = locale === 'ar';

  const roleLabel = user.role.replace(/_/g, ' ');

  // Click outside to close mobile user dropdown
  React.useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <header className="admin-topbar" role="banner">
      {/* Right / Start Cluster: Sidebar Toggle & Breadcrumb */}
      <div className="topbar-start">
        {/* Mobile / Tablet Drawer Toggle Button */}
        <button
          type="button"
          className="admin-icon-btn mobile-menu-trigger"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? tx("إغلاق القائمة") : tx("فتح القائمة الإدارية")}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Desktop Sidebar Collapse Toggle Button */}
        <button
          type="button"
          className="admin-icon-btn desktop-collapse-trigger"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? tx("توسيع القائمة الجانبية") : tx("طي القائمة الجانبية")}
          title={collapsed ? (isAr ? 'توسيع القائمة' : 'Expand Sidebar') : (isAr ? 'طي القائمة' : 'Collapse Sidebar')}
        >
          {collapsed ? <PanelRightOpen size={19} /> : <PanelRightClose size={19} />}
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="topbar-breadcrumb-wrap">
          <AdminBreadcrumb />
        </div>
      </div>

      {/* Left / End Cluster: Actions & Profile */}
      <div className="topbar-end">
        {/* Desktop Actions Cluster (Visible on screens > 768px) */}
        <div className="topbar-desktop-cluster">
          {/* Quick Action: View Public Site */}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="topbar-action-btn view-site-btn"
            title={isAr ? 'معاينة الموقع العام في تبويب جديد' : 'Preview Public Site in new tab'}
          >
            <ExternalLink size={14} />
            <span className="action-text">{isAr ? 'معاينة الموقع' : 'View Site'}</span>
          </Link>

          {/* Notification Bell */}
          <div className="topbar-notification-wrap">
            <NotificationBell />
          </div>

          {/* Language Switcher */}
          <button
            type="button"
            onClick={toggleLocale}
            className="topbar-icon-action"
            title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
            aria-label="Toggle language"
          >
            <Globe size={15} />
            <span className="lang-code">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* User Identity & Role Badge */}
          <div className="topbar-user-pill">
            <div className="user-avatar-badge">
              <UserIcon size={14} />
            </div>
            <div className="user-details-wrap">
              <span className="user-fullname">{user.fullName}</span>
              <span className="user-role-badge">
                <ShieldCheck size={11} />
                <span>{roleLabel}</span>
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={() => logout()}
            className="topbar-logout-btn"
            title={isAr ? 'تسجيل الخروج' : 'Logout'}
            aria-label={tx("تسجيل الخروج")}
          >
            <LogOut size={15} />
            <span className="logout-text">{isAr ? 'خروج' : 'Logout'}</span>
          </button>
        </div>

        {/* Mobile Actions Cluster (Visible on screens <= 768px) */}
        <div className="topbar-mobile-cluster" ref={userMenuRef}>
          {/* Notifications on Mobile */}
          <div className="topbar-notification-wrap">
            <NotificationBell />
          </div>

          {/* Compact User Menu Trigger */}
          <button
            type="button"
            className={`topbar-mobile-user-trigger ${userMenuOpen ? 'active' : ''}`}
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-label={tx("حساب المستخدم والقائمة الفرعية")}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="mobile-user-avatar">
              <UserIcon size={16} />
            </div>
          </button>

          {/* Accessible Mobile User Dropdown Popover */}
          {userMenuOpen && (
            <div className="topbar-mobile-user-dropdown" role="menu">
              <div className="mobile-dropdown-header">
                <strong className="mobile-dropdown-name">{user.fullName}</strong>
                <span className="mobile-dropdown-role">
                  <ShieldCheck size={12} />
                  <span>{roleLabel}</span>
                </span>
                {user.email && <span className="mobile-dropdown-email">{user.email}</span>}
              </div>

              <div className="mobile-dropdown-divider" />

              <div className="mobile-dropdown-actions">
                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mobile-dropdown-item"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <ExternalLink size={15} />
                  <span>{isAr ? 'معاينة الموقع العام' : 'View Public Site'}</span>
                </Link>

                <button
                  type="button"
                  className="mobile-dropdown-item"
                  onClick={() => {
                    toggleLocale();
                    setUserMenuOpen(false);
                  }}
                >
                  <Globe size={15} />
                  <span>{isAr ? 'التحويل إلى English' : 'Switch to Arabic'}</span>
                </button>
              </div>

              <div className="mobile-dropdown-divider" />

              <button
                type="button"
                className="mobile-dropdown-item mobile-dropdown-logout"
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={15} />
                <span>{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
