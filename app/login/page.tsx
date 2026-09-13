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
  UserCheck, 
  GraduationCap, 
  Briefcase 
} from 'lucide-react';

function LoginForm() {
  const { t, locale } = useLanguage();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'فشل تسجيل الدخول، تأكد من البيانات');
      setLoading(false);
    } else {
      // Redirect based on role
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      const user = meData.user;

      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role?.includes('MANAGER')) {
        router.push('/admin');
      } else if (user?.role === 'TRAINEE') {
        router.push('/portal/trainee');
      } else {
        router.push('/portal/client');
      }
    }
  };

  // Quick fill helper for development review
  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div style={{ paddingBlock: '4rem' }}>
      <div className="container" style={{ maxWidth: '520px' }}>
        <div className="card glow-animation" style={{ padding: '2.5rem' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/images/logo.png"
              alt="FACSS Logo"
              style={{ width: '72px', height: '72px', marginInline: 'auto', marginBottom: '1rem', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.4rem' }}>
              {t.navLogin}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              بوابة الدخول الموحدة لمنصة مركز عدن الأول (FACSS)
            </p>
          </div>

          {error && (
            <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', borderRadius: '8px', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="admin@facss-aden.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
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
                <span>جارٍ التحقق...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>دخول إلى المنصة</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Selection Box */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-light)', fontWeight: 700, display: 'block', marginBottom: '0.65rem', textAlign: 'center' }}>
              حسابات تجريبية سريعة للاختبار المحلي (Development Demo):
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => quickFill('admin@facss-aden.com', 'Admin@FACSS2026')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.4rem' }}
              >
                Super Admin
              </button>

              <button
                type="button"
                onClick={() => quickFill('services@facss-aden.com', 'Service@FACSS2026')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.4rem' }}
              >
                Service Manager
              </button>

              <button
                type="button"
                onClick={() => quickFill('client@yemen-bank.com', 'Client@FACSS2026')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.4rem' }}
              >
                Client (بنك اليمن)
              </button>

              <button
                type="button"
                onClick={() => quickFill('trainee@facss-aden.com', 'Trainee@FACSS2026')}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.4rem' }}
              >
                Trainee (متدرب)
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ليس لديك حساب بعد؟{' '}
              <Link href="/register" style={{ color: 'var(--color-gold-light)', fontWeight: 700 }}>
                إنشاء حساب عميل أو متدرب
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
    <Suspense fallback={<div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--color-gold-light)' }}>جارٍ تحميل بوابة الدخول...</div>}>
      <LoginForm />
    </Suspense>
  );
}
