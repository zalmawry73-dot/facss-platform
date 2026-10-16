import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, Compass } from 'lucide-react';

export default function NotFound() {
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
          borderTop: '4px solid var(--color-gold-500)',
          boxShadow: '0 20px 40px -15px rgba(11, 61, 46, 0.1)',
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
            background: 'rgba(181, 146, 84, 0.12)',
            border: '1px solid rgba(181, 146, 84, 0.3)',
            borderRadius: '20px',
            color: 'var(--color-gold-700)',
            fontSize: '0.82rem',
            fontWeight: 800,
            marginBottom: '1rem',
          }}
        >
          <ShieldAlert size={14} />
          <span>404 — الصفحة غير موجودة / Page Not Found</span>
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
          لم يتم العثور على المسار المطلوب
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '2rem',
          }}
        >
          الصفحة أو المورد الذي تبحث عنه غير متاح حالياً أو تم تعديل مساره المؤسسي. يرجى التحقق من الرابط أو الانتقال إلى الأقسام المعتمدة.
        </p>

        <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" className="btn btn-gold btn-md">
            <Home size={16} />
            <span>العودة للرئيسية (Home)</span>
          </Link>
          <Link href="/services" className="btn btn-outline btn-md">
            <Compass size={16} />
            <span>استعراض الخدمات (Services)</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
