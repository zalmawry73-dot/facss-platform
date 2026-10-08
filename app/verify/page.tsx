'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ShieldCheck,
  Search,
  FileCheck2,
  QrCode,
  HelpCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  Lock,
  Building,
  CheckCircle2,
} from 'lucide-react';

export default function VerifyPortalLandingPage() {
  const { t, locale, dir } = useLanguage();
  const router = useRouter();
  const isAr = locale === 'ar';
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError(
        isAr
          ? 'يرجى إدخال رمز التحقق أو رقم الشهادة المعتمد'
          : 'Please enter the verification code or certificate number'
      );
      return;
    }

    if (cleanCode.length < 4) {
      setError(
        isAr
          ? 'رمز التحقق يجب أن يتكون من 4 خانات على الأقل'
          : 'Verification code must be at least 4 characters'
      );
      return;
    }

    setIsSubmitting(true);
    // Redirect to the canonical verification details page
    router.push(`/verify/${encodeURIComponent(cleanCode)}`);
  };

  const verificationFeatures = [
    {
      icon: ShieldCheck,
      title: isAr ? 'فحص مشفر ومباشر' : 'Cryptographic Instant Verification',
      desc: isAr
        ? 'ربط فوري ومباشر مع سجلات الشهادات والوثائق الرقمية الصادرة عن المركز.'
        : 'Direct real-time validation against the Center’s tamper-proof digital registry.',
    },
    {
      icon: Lock,
      title: isAr ? 'صون الخصوصية التامة' : 'Privacy-Preserving Architecture',
      desc: isAr
        ? 'حماية البيانات الشخصية مع تأكيد صلاحية الاعتماد وحالة السريان أو الإلغاء.'
        : 'Protection of sensitive personal data while validating credential integrity.',
    },
    {
      icon: Award,
      title: isAr ? 'شهادات إتمام وتأهيل مهني' : 'Verified Professional Credentials',
      desc: isAr
        ? 'اعتماد موثوق للجهات الإنسانية والشركاء لتأكيد استيفاء متطلبات التأهيل الميداني.'
        : 'Trusted validation for humanitarian partners confirming field qualification.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-sunken)' }}>
      {/* Hero Header */}
      <section
        style={{
          paddingBlock: '4rem 3.5rem',
          background:
            'linear-gradient(180deg, var(--facss-green-950) 0%, var(--facss-green-900) 100%)',
          borderBottom: '1px solid rgba(201, 162, 39, 0.25)',
          textAlign: 'center',
          color: '#FFFFFF',
          position: 'relative',
        }}
      >
        <div className="container" style={{ maxWidth: '820px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.9rem',
              background: 'rgba(201, 162, 39, 0.15)',
              border: '1px solid rgba(201, 162, 39, 0.35)',
              borderRadius: '20px',
              fontSize: 'clamp(0.75rem, 2.5vw, 0.82rem)',
              color: 'var(--facss-gold-300)',
              fontWeight: 700,
              marginBottom: '1.25rem',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>{isAr ? 'البوابة الرسمية للتحقق الرقمي' : 'Official Digital Verification Portal'}</span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.45rem, 5.5vw, 2.4rem)',
              fontWeight: 900,
              color: '#FFFFFF',
              marginBottom: '0.8rem',
              lineHeight: 1.25,
            }}
          >
            {isAr
              ? 'التحقق من صحة الوثائق والشهادات الرقمية'
              : 'Digital Credential & Certificate Verification'}
          </h1>

          <p
            style={{
              color: 'var(--facss-ivory-300)',
              fontSize: 'clamp(0.88rem, 2.8vw, 1.05rem)',
              maxWidth: '680px',
              marginInline: 'auto',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
            }}
          >
            {isAr
              ? 'تتيح هذه البوابة للمنظمات والجهات الشريكة التحقق الفوري من صحة وسريان الشهادات والوثائق الصادرة عن المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية.'
              : 'Empowering organizations and partners to instantly verify credentials and certificates issued by the Integrated Center for Security, Safety & Field Studies.'}
          </p>

          {/* Verification Search Card */}
          <div
            className="card verify-search-card"
            style={{
              background: 'var(--surface-card)',
              borderRadius: '16px',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(201, 162, 39, 0.3)',
              textAlign: isAr ? 'right' : 'left',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <form onSubmit={handleVerify}>
              <label
                htmlFor="verification-input"
                style={{
                  display: 'block',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem',
                }}
              >
                {isAr
                  ? 'أدخل رمز التحقق المشفر أو الرقم المرجعي للوثيقة:'
                  : 'Enter the verification code or credential reference number:'}
              </label>

              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: 0, position: 'relative' }}>
                  <input
                    id="verification-input"
                    type="text"
                    className="form-input"
                    placeholder={
                      isAr
                        ? 'مثال: V-ABC123 أو 2026-0045'
                        : 'e.g. V-ABC123 or 2026-0045'
                    }
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (error) setError(null);
                    }}
                    style={{
                      height: '52px',
                      fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      paddingInline: '1rem',
                      textTransform: 'uppercase',
                      borderRadius: '10px',
                      border: error
                        ? '2px solid #EF4444'
                        : '1.5px solid var(--border-color)',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                    autoComplete="off"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-gold verify-search-btn"
                  disabled={isSubmitting}
                  style={{
                    height: '52px',
                    paddingInline: '1.75rem',
                    fontSize: '1rem',
                    fontWeight: 800,
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Search size={18} />
                  <span>{isSubmitting ? (isAr ? 'جارٍ الفحص...' : 'Verifying...') : (isAr ? 'تحقق الآن' : 'Verify Now')}</span>
                </button>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid #EF4444',
                    borderRadius: '8px',
                    color: '#B91C1C',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Helpful hint below form */}
              <div
                style={{
                  marginTop: '1.25rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                }}
              >
                <HelpCircle size={16} style={{ color: 'var(--facss-gold-600)', flexShrink: 0 }} />
                <span>
                  {isAr
                    ? 'يوجد رمز التحقق المشفر أو رمز الاستجابة السريعة (QR Code) مطبوعاً في أسفل الشهادة الرسمية.'
                    : 'The cryptographic verification code or QR code is printed at the bottom of the official credential.'}
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Features & Guidance Section */}
      <section className="section">
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {verificationFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    padding: '1.75rem',
                    borderTop: '4px solid var(--facss-gold-500)',
                    background: 'var(--surface-card)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      background: 'rgba(201, 162, 39, 0.12)',
                      color: 'var(--facss-gold-700)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem',
                    }}
                  >
                    <Icon size={22} />
                  </div>

                  <h3
                    style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {feat.title}
                  </h3>

                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Institutional Integrity Notice */}
          <div
            className="card"
            style={{
              marginTop: '2.5rem',
              padding: '1.5rem 2rem',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Building size={24} style={{ color: 'var(--facss-green-800)', flexShrink: 0 }} />
              <div>
                <strong
                  style={{
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    display: 'block',
                    marginBottom: '0.2rem',
                  }}
                >
                  {isAr
                    ? 'المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية'
                    : 'Integrated Center for Security, Safety & Field Studies'}
                </strong>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {isAr
                    ? 'الجهة التخصصية في خدمات الأمن والسلامة والتأهيل والدراسات الميدانية في الجمهورية اليمنية.'
                    : 'The specialized entity for security, safety, capacity building, and field studies.'}
                </span>
              </div>
            </div>

            <Link
              href="/contact"
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>{isAr ? 'التواصل مع إدارة الاعتماد' : 'Contact Credential Office'}</span>
              <ArrowIcon size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
