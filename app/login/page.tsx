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
  LogIn 
} from 'lucide-react';

function LoginForm() {
  const { t, locale } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const errorParam = searchParams.get('error');

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
        'CONTENT_MANAGER',
        'SERVICE_MANAGER',
        'TRAINING_MANAGER',
        'RESEARCH_MANAGER',
        'EMPLOYEE',
      ];

      if (user && STAFF_ROLES.includes(user.role)) {
        router.push('/admin');
      } else if (user?.role === 'TRAINEE') {
        router.push('/portal/trainee');
      } else {
        router.push('/portal/client');
      }
    }
  };

  return (
    <div style={{ paddingBlock: '4rem' }}>
      <div className="container" style={{ maxWidth: '500px' }}>
        <div className="card" style={{ padding: '2.5rem', borderTop: '4px solid var(--facss-gold-500)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/images/logo.png"
              alt="FACSS Logo"
              style={{ width: '72px', height: '72px', marginInline: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {t.navLogin}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              {t.loginSubtitle}
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
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

            <div className="form-group">
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

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t.dontHaveAccount}{' '}
              <Link href="/register" style={{ color: 'var(--facss-green-900)', fontWeight: 700 }}>
                {t.registerNewAccount}
              </Link>
            </p>
          </div>
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
