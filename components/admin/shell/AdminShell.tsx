'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';

interface AdminShellProps {
  user: {
    fullName: string;
    role: string;
    email?: string;
  };
  capabilities: string[];
  children: React.ReactNode;
}

export default function AdminShell({ user, capabilities, children }: AdminShellProps) {
  const pathname = usePathname();
  const { dir } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Automatically close mobile drawer when navigating to a new route
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="admin-shell" dir={dir}>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="admin-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* RTL Sidebar (Desktop sticky / Mobile drawer) */}
      <AdminSidebar
        user={user}
        capabilities={capabilities}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Canvas Area */}
      <div className={`admin-main-canvas ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <AdminTopbar
          user={user}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />

        <main className="admin-content-area" id="admin-main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
