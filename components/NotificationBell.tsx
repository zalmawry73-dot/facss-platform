'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';

interface NotificationItem {
  id: string;
  userId: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAr = locale === 'ar';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=8', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Auto-refresh notifications every 45 seconds when page is visible
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifications();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  // Handle outside click & ESC key to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, link: string | null) => {
    try {
      // Optimistic update
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });

      if (link) {
        setIsOpen(false);
        router.push(link);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      await fetch('/api/notifications/read-all', { method: 'POST' });
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 size={16} style={{ color: 'var(--facss-green-500)', flexShrink: 0 }} />;
      case 'WARNING':
        return <AlertTriangle size={16} style={{ color: '#F59E0B', flexShrink: 0 }} />;
      case 'ALERT':
        return <ShieldAlert size={16} style={{ color: '#EF4444', flexShrink: 0 }} />;
      case 'INFO':
      default:
        return <Info size={16} style={{ color: '#3B82F6', flexShrink: 0 }} />;
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return isAr ? 'الآن' : 'just now';
    if (minutes < 60) return isAr ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
    if (hours < 24) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
    return isAr ? `منذ ${days} يوم` : `${days}d ago`;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="btn btn-ghost btn-sm"
        aria-label={isAr ? 'الإشعارات' : 'Notifications'}
        title={isAr ? 'الإشعارات' : 'Notifications'}
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          padding: 0,
          color: unreadCount > 0 ? 'var(--facss-gold-400)' : 'var(--text-on-dark-muted)',
          backgroundColor: isOpen ? 'rgba(201, 162, 39, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(201, 162, 39, 0.2)',
          transition: 'var(--transition)',
          cursor: 'pointer',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            id="notification-badge"
            style={{
              position: 'absolute',
              top: '-4px',
              insetInlineEnd: '-4px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontSize: '0.68rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingInline: '4px',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              border: '2px solid var(--facss-green-950)',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          id="notification-dropdown-panel"
          style={{
            position: 'absolute',
            top: '120%',
            insetInlineEnd: 0,
            width: '340px',
            maxWidth: 'calc(100vw - 2rem)',
            background: 'var(--facss-green-950)',
            border: '1px solid var(--border-dark)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
            zIndex: 1100,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.8rem 1rem',
              borderBottom: '1px solid var(--border-dark-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#FFFFFF' }}>
                {isAr ? 'الإشعارات' : 'Notifications'}
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(201, 162, 39, 0.15)',
                    color: 'var(--facss-gold-400)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(201, 162, 39, 0.3)',
                  }}
                >
                  {unreadCount} {isAr ? 'جديد' : 'new'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markingAll}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--facss-gold-400)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: 0,
                }}
                title={isAr ? 'تحديد الكل كمقروء' : 'Mark all as read'}
              >
                <CheckCheck size={14} />
                <span>{isAr ? 'تحديد الكل كمقروء' : 'Mark all read'}</span>
              </button>
            )}
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
            }}
          >
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-on-dark-muted)', fontSize: '0.85rem' }}>
                {isAr ? 'جاري التحميل...' : 'Loading notifications...'}
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                <Bell size={32} style={{ color: 'var(--text-on-dark-muted)', opacity: 0.5, marginInline: 'auto', marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--text-on-dark-muted)', fontSize: '0.85rem', margin: 0 }}>
                  {isAr ? 'لا توجد إشعارات حتى الآن' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const title = isAr ? (n.titleAr || n.titleEn) : (n.titleEn || n.titleAr);
                const message = isAr ? (n.messageAr || n.messageEn) : (n.messageEn || n.messageAr);

                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.link)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(201, 162, 39, 0.06)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      cursor: n.link ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'rgba(201, 162, 39, 0.06)';
                    }}
                  >
                    {/* Unread indicator dot */}
                    {!n.isRead && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '1rem',
                          insetInlineEnd: '0.75rem',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--facss-gold-500)',
                        }}
                      />
                    )}

                    <div style={{ marginTop: '0.15rem' }}>
                      {getTypeIcon(n.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0, paddingInlineEnd: n.isRead ? '0' : '0.75rem' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          fontWeight: n.isRead ? 600 : 700,
                          color: n.isRead ? 'var(--text-on-dark-muted)' : '#FFFFFF',
                          lineHeight: 1.35,
                          marginBottom: '0.25rem',
                        }}
                      >
                        {title}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.78rem',
                          color: 'var(--text-on-dark-muted)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {message}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginTop: '0.4rem',
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        <Clock size={11} />
                        <span>{formatRelativeTime(n.createdAt)}</span>
                        {n.link && (
                          <span style={{ marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--facss-gold-400)' }}>
                            <ExternalLink size={11} />
                            <span>{isAr ? 'عرض' : 'View'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
