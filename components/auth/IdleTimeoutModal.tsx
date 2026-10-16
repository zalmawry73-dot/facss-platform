'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, ShieldAlert, LogOut, ArrowRight, ArrowLeft } from 'lucide-react';

interface IdleTimeoutModalProps {
  isOpen: boolean;
  countdownSeconds: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export default function IdleTimeoutModal({
  isOpen,
  countdownSeconds,
  onStayLoggedIn,
  onLogoutNow,
}: IdleTimeoutModalProps) {
  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(8, 40, 30, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(8, 40, 30, 0.35), 0 0 0 1px rgba(181, 146, 84, 0.3)',
          borderTop: '5px solid var(--color-gold-500, #B59254)',
          overflow: 'hidden',
          direction: dir,
          textAlign: isAr ? 'right' : 'left',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header & Icon */}
        <div style={{ padding: '2rem 2rem 1.25rem 2rem', textAlign: 'center' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              backgroundColor: 'rgba(181, 146, 84, 0.12)',
              border: '2px solid rgba(181, 146, 84, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              color: 'var(--color-gold-600, #8E6F37)',
            }}
          >
            <Clock size={36} strokeWidth={2.2} />
          </div>

          <h2
            id="idle-modal-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: 'var(--color-primary-950, #08281E)',
              marginBottom: '0.65rem',
              letterSpacing: '-0.01em',
            }}
          >
            {isAr ? 'تنبيه أمان: جلسة العمل على وشك الانتهاء' : 'Security Alert: Session Expiring Soon'}
          </h2>

          <p
            style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary, #52605A)',
              lineHeight: 1.65,
              margin: 0,
            }}
          >
            {isAr
              ? 'نظراً لعدم وجود أي نشاط خلال الـ 14 دقيقة الماضية، سيتم تسجيل خروجك تلقائياً حفاظاً على أمان وسرية الحساب خلال:'
              : 'Due to inactivity in the last 14 minutes, your session will automatically terminate for security in:'}
          </p>

          {/* Countdown Display */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.25rem',
              padding: '0.65rem 1.5rem',
              backgroundColor: 'rgba(181, 146, 84, 0.14)',
              border: '1.5px solid var(--color-gold-500, #B59254)',
              borderRadius: '9999px',
            }}
          >
            <span
              style={{
                fontSize: '1.65rem',
                fontWeight: 900,
                color: 'var(--color-gold-700, #674C28)',
                fontVariantNumeric: 'tabular-nums',
                lineHeight: 1,
              }}
            >
              {countdownSeconds}
            </span>
            <span
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: 'var(--color-gold-700, #674C28)',
              }}
            >
              {isAr ? 'ثانية' : 'seconds'}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div
          style={{
            padding: '1.25rem 2rem 1.75rem 2rem',
            backgroundColor: 'var(--surface-subtle, #F2F5F3)',
            borderTop: '1px solid var(--border-color, #E2E8F0)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={onStayLoggedIn}
            className="btn btn-gold"
            style={{
              width: '100%',
              padding: '0.85rem 1.25rem',
              fontSize: '0.95rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(181, 146, 84, 0.25)',
            }}
          >
            <ShieldAlert size={18} />
            <span>{isAr ? 'متابعة الجلسة والبقاء متصلاً' : 'Continue Session & Stay Logged In'}</span>
          </button>

          <button
            type="button"
            onClick={onLogoutNow}
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              color: 'var(--text-secondary, #52605A)',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-medium, #CBD5D0)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FEE2E2';
              e.currentTarget.style.color = '#991B1B';
              e.currentTarget.style.borderColor = '#FCA5A5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary, #52605A)';
              e.currentTarget.style.borderColor = 'var(--border-medium, #CBD5D0)';
            }}
          >
            <LogOut size={16} />
            <span>{isAr ? 'تسجيل الخروج الآن' : 'Log Out Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
