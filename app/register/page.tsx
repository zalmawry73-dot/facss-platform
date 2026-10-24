'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  UserPlus, 
  Building2, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

function RegisterForm() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [role, setRole] = useState<'CLIENT' | 'TRAINEE'>('CLIENT');
  const [formData, setFormData] = useState({
    fullName: searchParams.get('name') || '',
    email: searchParams.get('email') || '',
    password: '',
    phone: searchParams.get('phone') || '',
    organization: searchParams.get('org') || '',
    companySector: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'فشل إنشاء الحساب');
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('facss_active_tab_session', 'active');
        }
        if (redirect && redirect.startsWith('/')) {
          router.push(redirect);
        } else if (role === 'CLIENT') {
          router.push('/portal/client');
        } else {
          router.push('/portal/trainee');
        }
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBlock: '4rem', background: 'var(--surface-bg)', minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center' }}>
      <div className="container" style={{ maxWidth: '580px' }}>
        <div className="card-institutional" style={{ padding: 'clamp(2rem, 4vw, 2.75rem)', borderTop: '4px solid var(--color-gold-500)', boxShadow: '0 20px 40px -15px rgba(11, 61, 46, 0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/images/brand/logo-symbol.png"
              alt={t.siteTitle}
              style={{ width: '64px', height: 'auto', marginInline: 'auto', marginBottom: '1.25rem', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-primary-950)', marginBottom: '0.4rem', letterSpacing: '-0.01em' }}>
              {t.registerTitle}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {t.registerSubtitle}
            </p>
          </div>

          {/* Role Toggle Tab */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.75rem', background: '#F4F1EA', padding: '0.4rem', borderRadius: '10px', border: '1px solid rgba(181, 146, 84, 0.25)' }}>
            <button
              type="button"
              onClick={() => setRole('CLIENT')}
              className={`btn btn-sm ${role === 'CLIENT' ? 'btn-gold' : 'btn-ghost'}`}
              style={{ border: 'none', justifyContent: 'center', fontWeight: role === 'CLIENT' ? 800 : 600, whiteSpace: 'normal', textAlign: 'center', height: 'auto', minHeight: '38px', padding: '0.4rem 0.5rem', lineHeight: 1.25 }}
            >
              <Building2 size={16} style={{ flexShrink: 0 }} />
              <span>{t.clientAccountType}</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('TRAINEE')}
              className={`btn btn-sm ${role === 'TRAINEE' ? 'btn-gold' : 'btn-ghost'}`}
              style={{ border: 'none', justifyContent: 'center', fontWeight: role === 'TRAINEE' ? 800 : 600, whiteSpace: 'normal', textAlign: 'center', height: 'auto', minHeight: '38px', padding: '0.4rem 0.5rem', lineHeight: 1.25 }}
            >
              <GraduationCap size={16} style={{ flexShrink: 0 }} />
              <span>{t.traineeAccountType}</span>
            </button>
          </div>

          {error && (
            <div style={{ padding: '0.85rem 1rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">{t.fullName} <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                placeholder={role === 'CLIENT' ? (locale === 'ar' ? 'اسم المفوض الرسمي' : 'Authorized Representative Name') : (locale === 'ar' ? 'اسم المتدرب الرباعي' : 'Trainee Full Name')}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">{t.emailAddress} <span className="required">*</span></label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t.phoneLabel}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="+967-..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            {role === 'CLIENT' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">{locale === 'ar' ? 'اسم المنشأة / الشركة' : 'Company / Organization Name'} <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={locale === 'ar' ? 'اسم المؤسسة / البنك / الشركة' : 'Institution / Enterprise Name'}
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    required={role === 'CLIENT'}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t.companySector}</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={t.companySectorPlaceholder}
                    value={formData.companySector}
                    onChange={(e) => setFormData({ ...formData, companySector: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t.password} ({locale === 'ar' ? '8 أحرف على الأقل' : 'min 8 chars'}) <span className="required">*</span></label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-gold btn-lg"
              style={{ width: '100%', marginBottom: '1.5rem' }}
              disabled={submitting}
            >
              {submitting ? (
                <span>{t.registering}</span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>{t.registerSubmit}</span>
                </>
              )}
            </button>
          </form>

          <div style={{ textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid rgba(181, 146, 84, 0.2)' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t.alreadyHaveAccount}{' '}
              <Link 
                href={redirect && redirect !== '/' ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'} 
                style={{ color: 'var(--color-primary-900)', fontWeight: 800 }}
              >
                {t.loginHere}
              </Link>
            </p>
          </div>
        </div>

        {/* Security Reassurance */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', color: 'var(--color-gold-700)', fontSize: '0.8rem', fontWeight: 600 }}>
          <span>{locale === 'ar' ? 'التسجيل مخصص للشركاء والجهات المعتمدة والمتدربين الرسميين' : 'Registration reserved for verified partners, agencies, and official trainees'}</span>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>جارٍ التحميل...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
