'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Globe, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard,
  FileCheck2,
  BellRing
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

export default function Header() {
  const { t, locale, toggleLocale, dir } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Close menus on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  // Handle Escape key to close open menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { href: '/', label: t.navHome },
    { href: '/about', label: t.navAbout },
    { href: '/services', label: t.navServices },
    { href: '/training', label: t.navTraining },
    { href: '/research', label: t.navResearch },
    { href: '/contact', label: t.navContact },
  ];

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'FIELD_FOCAL_POINT') {
      return '/portal/field/intake';
    }
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'STAFF' || user.role.includes('MANAGER') || user.role === 'EMPLOYEE') {
      return '/admin';
    }
    if (user.role === 'TRAINEE') {
      return '/portal/trainee';
    }
    return '/portal/client';
  };

  const getPortalLabel = () => {
    if (!user) return t.navLogin;
    if (user.role === 'FIELD_FOCAL_POINT') {
      return locale === 'ar' ? 'بوابة البلاغات الميدانية' : 'Field Intake Portal';
    }
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'STAFF' || user.role.includes('MANAGER') || user.role === 'EMPLOYEE') {
      return t.navAdminDashboard;
    }
    if (user.role === 'TRAINEE') {
      return t.navTraineePortal;
    }
    return t.navClientPortal;
  };

  return (
    <header className="site-header">
      <div className="container-wide">
        <div className="nav-inner">
          {/* Logo & Official Center Name in 2 Clear Lines */}
          <Link href="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <img 
              src="/images/logo.png" 
              alt={t.siteTitle} 
              className="brand-logo-img" 
            />
            <div className="brand-title-wrap">
              <span className="brand-name-primary">
                {locale === 'ar' ? 'مركز عدن الدولي' : 'Aden International Center'}
              </span>
              <span className="brand-name-secondary">
                {locale === 'ar' ? 'للسلامة والدراسات الميدانية' : 'for Safety & Field Assessment'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            <ul className="nav-menu">
              {navLinks.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href} 
                      className={`nav-link ${isActive ? 'active' : ''}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right Action Area */}
          <div className="nav-actions">
            {/* Language Switcher */}
            <button 
              onClick={toggleLocale} 
              className="lang-btn" 
              title={locale === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              aria-label="Toggle language"
            >
              <Globe size={15} />
              <span className="lang-text">{locale === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Request a Service CTA */}
            <Link href="/request-service" className="btn btn-gold btn-sm nav-cta-btn">
              <Shield size={15} />
              <span>{t.navRequestService}</span>
            </Link>

            {/* In-App Notifications for Logged-In Users */}
            {user && <NotificationBell />}

            {/* User Session / Portal Access */}
            {user ? (
              <div className="user-dropdown-container">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="btn btn-outline btn-sm user-btn"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <UserIcon size={15} />
                  <span className="user-name-text">{user.fullName?.split(' ')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <p className="user-dropdown-name">{user.fullName}</p>
                      <span className="badge badge-gold user-dropdown-role">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href={getPortalLink()}
                      onClick={() => setUserDropdownOpen(false)}
                      className="user-dropdown-item portal-link"
                    >
                      <LayoutDashboard size={15} />
                      <span>{getPortalLabel()}</span>
                    </Link>

                    {user.role !== 'FIELD_FOCAL_POINT' && (
                      <Link
                        href="/portal/alerts"
                        onClick={() => setUserDropdownOpen(false)}
                        className="user-dropdown-item"
                      >
                        <BellRing size={15} />
                        <span>{locale === 'ar' ? 'التنبيهات الميدانية' : 'Field Alerts'}</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="user-dropdown-item logout-btn"
                    >
                      <LogOut size={15} />
                      <span>{t.navLogout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn btn-outline btn-sm auth-btn">
                <UserIcon size={15} />
                <span className="auth-btn-text">{t.navLogin}</span>
              </Link>
            )}

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-toggle-btn"
              id="mobile-toggle-btn"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-drawer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mobile / Tablet Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" id="mobile-drawer" role="region" aria-label="Mobile Navigation Drawer">
          <ul className="mobile-nav-list">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li className="mobile-drawer-cta">
              <Link
                href="/request-service"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-gold btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Shield size={16} />
                <span>{t.navRequestService}</span>
              </Link>
            </li>
            <li className="mobile-drawer-verify">
              <Link
                href="/verify"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-outline btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <FileCheck2 size={16} />
                <span>{t.verifyCertificate}</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
