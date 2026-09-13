'use client';

import React, { useState } from 'react';
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
  GraduationCap, 
  Building2 
} from 'lucide-react';

export default function Header() {
  const { t, locale, toggleLocale, dir } = useLanguage();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.navHome },
    { href: '/about', label: t.navAbout },
    { href: '/services', label: t.navServices },
    { href: '/training', label: t.navTraining },
    { href: '/research', label: t.navResearch },
    { href: '/sectors', label: t.navSectors },
    { href: '/methodology', label: t.navMethodology },
    { href: '/contact', label: t.navContact },
  ];

  const getPortalLink = () => {
    if (!user) return '/login';
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role.includes('MANAGER')) {
      return '/admin';
    }
    if (user.role === 'TRAINEE') {
      return '/portal/trainee';
    }
    return '/portal/client';
  };

  const getPortalLabel = () => {
    if (!user) return t.navLogin;
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role.includes('MANAGER')) {
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
          {/* Logo & Brand */}
          <Link href="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <img src="/images/logo.png" alt="FACSS Official Emblem" />
            <div className="brand-title-wrap">
              <span className="brand-acronym">{t.siteAcronym}</span>
              <span className="brand-fullname">
                {locale === 'ar' 
                  ? 'مركز عدن الأول للخدمات الأمنية' 
                  : 'Aden First Security Center'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Menu */}
          <nav>
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
            >
              <Globe size={15} />
              <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Request a Service CTA */}
            <Link href="/request-service" className="btn btn-gold btn-sm">
              <Shield size={16} />
              <span>{t.navRequestService}</span>
            </Link>

            {/* User Session / Portal Access */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <UserIcon size={16} />
                  <span>{user.fullName?.split(' ')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '110%',
                      insetInlineEnd: 0,
                      minWidth: '200px',
                      background: '#091A11',
                      border: '1px solid rgba(197,155,39,0.3)',
                      borderRadius: '8px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
                      padding: '0.5rem',
                      zIndex: 1000,
                    }}
                  >
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.4rem' }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#FFF' }}>{user.fullName}</p>
                      <span className="badge badge-gold" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                        {user.role}
                      </span>
                    </div>

                    <Link
                      href={getPortalLink()}
                      onClick={() => setUserDropdownOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--color-gold-light)',
                        borderRadius: '4px',
                      }}
                    >
                      <LayoutDashboard size={15} />
                      <span>{getPortalLabel()}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                        color: '#EF4444',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        textAlign: dir === 'rtl' ? 'right' : 'left',
                      }}
                    >
                      <LogOut size={15} />
                      <span>{t.navLogout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="btn btn-outline btn-sm">
                <UserIcon size={16} />
                <span>{t.navLogin}</span>
              </Link>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-outline btn-sm"
              style={{ padding: '0.4rem', display: 'none' }}
              id="mobile-toggle-btn"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div 
          style={{
            background: 'rgba(5, 14, 9, 0.98)',
            borderBottom: '1px solid rgba(197, 155, 39, 0.3)',
            padding: '1.5rem',
          }}
        >
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {navLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    color: pathname === item.href ? 'var(--color-gold-light)' : '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <Link
                href="/request-service"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-gold btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {t.navRequestService}
              </Link>
            </li>
          </ul>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 992px) {
          :global(.nav-menu) {
            display: none !important;
          }
          #mobile-toggle-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </header>
  );
}
