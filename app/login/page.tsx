'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Lock, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  LogIn,
  Clock
} from 'lucide-react';

function LoginForm() {
  const { t, locale } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const errorParam = searchParams.get('error');
  const reasonParam = searchParams.get('reason');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'unauthorized' 
      ? 'يرجى تسجيل الدخول بحساب مصرح له للوصول إلى هذا القسم' 
      : errorParam === 'forbidden'
      ? 'غير مصرح لك بالوصول إلى هذا المورد'
      : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'بيانات الدخول غير صحيحة أو الحساب غير مفعل');
      setLoading(false);
    } else {
      // Redirect based on role or explicit redirect query parameter
      if (redirect && redirect !== '/') {
        router.push(redirect);
        return;
      }

      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      const user = meData.user;

      const STAFF_ROLES = [
        'SUPER_ADMIN',
        'ADMIN',
        'STAFF',
        'CONTENT_MANAGER',
        'SERVICE_MANAGER',
        'TRAINING_MANAGER',
        'RESEARCH_MANAGER',
        'EMPLOYEE',
      ];

      if (user?.role === 'FIELD_FOCAL_POINT') {
        router.push('/portal/field/intake');
      } else if (user && STAFF_ROLES.includes(user.role)) {
        router.push('/admin');
      } else if (user?.role === 'TRAINEE') {
        router.push('/portal/trainee');
      } else {
        router.push('/portal/client');
      }
    }
  };

  return (
    <div style={{ paddingBlock: '4rem', background: 'var(--surface-bg)', minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '480px' }}>
        <div className="card-institutional" style={{ padding: 'clamp(2rem, 4vw, 2.75rem)', borderTop: '4px solid var(--color-gold-500)', boxShadow: '0 20px 40px -15px rgba(11, 61, 46, 0.08)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/images/brand/logo-symbol.png"
              alt={t.siteTitle}
              style={{ width: '64px', height: 'auto', marginInline: 'auto', marginBottom: '1.25rem', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-primary-950)', marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
              {t.navLogin}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {t.loginSubtitle}
            </p>
          </div>

          {reasonParam === 'timeout' && !error && (
            <div style={{
              padding: '0.85rem 1rem',
              background: 'rgba(181, 146, 84, 0.12)',
              border: '1px solid var(--color-gold-500, #B59254)',
              borderRadius: '8px',
              color: 'var(--color-gold-700, #674C28)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              lineHeight: 1.5
            }}>
              <Clock size={20} style={{ flexShrink: 0, color: 'var(--color-gold-600, #8E6F37)' }} />
              <span>
                {locale === 'ar'
                  ? 'تم تسجيل خروجك تلقائياً لعدم وجود أي نشاط لمدة 15 دقيقة، وذلك لضمان أمان وسرية الحساب.'
                  : 'You have been automatically logged out due to 15 minutes of inactivity for your account security.'}
              </span>
            </div>
          )}

          {error && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">{t.emailAddress}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">{t.password}</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold btn-lg"
              style={{ width: '100%', marginBottom: '1.5rem' }}
              disabled={loading}
            >
              {loading ? (
                <span>{t.loggingIn}</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>{t.loginSubmit}</span>
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid rgba(181, 146, 84, 0.2)' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t.dontHaveAccount}{' '}
              <Link href="/register" style={{ color: 'var(--color-primary-900)', fontWeight: 800 }}>
                {t.registerNewAccount}
              </Link>
            </p>
          </div>
        </div>

        {/* Security Reassurance */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--color-gold-700)', fontSize: '0.8rem', fontWeight: 600 }}>
          <ShieldCheck size={16} />
          <span>{locale === 'ar' ? 'منظومة ولوج مؤسسية آمنة ومشفرة' : 'Encrypted Institutional Access Gateway'}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--color-gold-light)' }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
