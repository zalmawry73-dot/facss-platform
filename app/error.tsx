'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Operational Runtime Exception:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'var(--surface-bg)',
      }}
    >
      <div
        className="card-institutional"
        style={{
          maxWidth: '560px',
          width: '100%',
          textAlign: 'center',
          padding: 'clamp(2rem, 5vw, 3.5rem)',
          borderTop: '4px solid #DC2626',
          boxShadow: '0 20px 40px -15px rgba(220, 38, 38, 0.08)',
        }}
      >
        <img
          src="/images/brand/logo-symbol.png"
          alt="FACSS Official Logo"
          style={{ width: '64px', height: 'auto', marginInline: 'auto', marginBottom: '1.25rem', objectFit: 'contain' }}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '20px',
            color: '#B91C1C',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '1rem',
          }}
        >
          <AlertTriangle size={14} />
          <span>تنبيه تشغيلي / Operational Notice</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.5rem, 3.5vw, 2rem)',
            fontWeight: 900,
            color: 'var(--color-primary-950)',
            marginBottom: '0.75rem',
            letterSpacing: '-0.02em',
          }}
        >
          حدث خطأ غير متوقع أثناء المعالجة
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}
        >
          نعتذر عن هذا الخلل المؤقت. تم تسجيل التنبيه في سجلات العمليات، ويمكنك إعادة محاولة تحميل الصفحة أو العودة إلى البوابة الرئيسية.
        </p>

        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-gold btn-md"
          >
            <RotateCcw size={16} />
            <span>إعادة المحاولة (Try Again)</span>
          </button>
          <Link href="/" className="btn btn-outline btn-md">
            <Home size={16} />
            <span>الرئيسية (Home)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
