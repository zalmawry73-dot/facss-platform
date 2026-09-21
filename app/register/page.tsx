'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  UserPlus, 
  Building2, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle2 
} from 'lucide-react';

export default function RegisterPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();

  const [role, setRole] = useState<'CLIENT' | 'TRAINEE'>('CLIENT');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    organization: '',
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
        if (role === 'CLIENT') {
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
    <div style={{ paddingBlock: '4rem' }}>
      <div className="container" style={{ maxWidth: '580px' }}>
        <div className="card" style={{ padding: '2.5rem', borderTop: '4px solid var(--facss-gold-500)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img
              src="/images/logo.png"
              alt={t.siteTitle}
              style={{ width: '64px', height: '64px', marginInline: 'auto', marginBottom: '0.75rem', objectFit: 'contain' }}
            />
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {t.registerTitle}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              {t.registerSubtitle}
            </p>
          </div>

          {/* Role Toggle Tab */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.75rem', background: 'var(--surface-sunken)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={() => setRole('CLIENT')}
              className={`btn btn-sm ${role === 'CLIENT' ? 'btn-gold' : 'btn-ghost'}`}
              style={{ border: 'none', justifyContent: 'center' }}
            >
              <Building2 size={16} />
              <span>{t.clientAccountType}</span>
            </button>

            <button
              type="button"
              onClick={() => setRole('TRAINEE')}
              className={`btn btn-sm ${role === 'TRAINEE' ? 'btn-gold' : 'btn-ghost'}`}
              style={{ border: 'none', justifyContent: 'center' }}
            >
              <GraduationCap size={16} />
              <span>{t.traineeAccountType}</span>
            </button>
          </div>

          {error && (
            <div style={{ padding: '0.85rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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

          <div style={{ textAlign: 'center', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t.alreadyHaveAccount}{' '}
              <Link href="/login" style={{ color: 'var(--facss-green-900)', fontWeight: 700 }}>
                {t.loginHere}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
