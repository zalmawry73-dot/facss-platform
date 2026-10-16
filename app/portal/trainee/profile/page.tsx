import React from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireRole, ROLES } from '@/lib/rbac';
import { type Locale } from '@/lib/i18n';
import { User, Award, ShieldCheck, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react';

export const revalidate = 0;

export default async function TraineeProfilePage() {
  const session = await requireRole([ROLES.TRAINEE], '/portal/trainee/profile');

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) return null;

  return (
    <div style={{ maxWidth: '880px', marginInline: 'auto' }}>
      {/* Profile Header Card */}
      <div className="portal-card" style={{ marginBottom: '1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--brand-deep-green) 0%, var(--color-green-700) 100%)',
              color: 'var(--color-gold-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '1.8rem',
              boxShadow: '0 4px 12px rgba(11, 61, 46, 0.15)',
              border: '2px solid var(--color-gold-500)',
            }}
          >
            {user.fullName ? user.fullName.charAt(0) : 'م'}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--brand-deep-green)', margin: 0 }}>
                {user.fullName}
              </h2>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  background: 'rgba(21, 128, 61, 0.1)',
                  color: '#15803D',
                  border: '1px solid rgba(21, 128, 61, 0.25)',
                }}
              >
                <CheckCircle2 size={12} />
                <span>{isAr ? 'متدرب معتمد وموثق' : 'Verified Trainee'}</span>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {isAr ? 'الملف الأكاديمي والمهني لمتدربي مركز الحلول المتكاملة' : 'Academic & Professional Profile for Trainees'}
            </p>
          </div>
        </div>
      </div>

      {/* Trainee Details Grid */}
      <div className="portal-card" style={{ marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          {isAr ? 'البيانات الشخصية والأكاديمية' : 'Personal & Academic Details'}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              {isAr ? 'الاسم الرباعي الكامل' : 'Full Name'}
            </span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{user.fullName}</strong>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              {isAr ? 'البريد الإلكتروني' : 'Email Address'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={15} style={{ color: 'var(--color-gold-600)' }} />
              <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)', direction: 'ltr' }}>{user.email}</strong>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              {isAr ? 'رقم الهاتف المعتمد' : 'Contact Phone'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={15} style={{ color: 'var(--color-gold-600)' }} />
              <strong style={{ fontSize: '0.98rem', color: 'var(--text-primary)', direction: 'ltr' }}>{user.phone || (isAr ? 'غير مسجل' : 'Not recorded')}</strong>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(11, 61, 46, 0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.3rem', fontWeight: 600 }}>
              {isAr ? 'الصفة الأكاديمية' : 'Academic Role'}
            </span>
            <span style={{ display: 'inline-flex', padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 800, background: 'rgba(181, 146, 84, 0.15)', color: 'var(--color-gold-700)', border: '1px solid var(--color-gold-500)' }}>
              {isAr ? 'متدرب مسجل رسمياً' : 'Officially Enrolled Trainee'}
            </span>
          </div>
        </div>
      </div>

      {/* Record Linking Notice */}
      <div className="portal-card" style={{ borderInlineStart: '4px solid var(--color-gold-500)', background: 'linear-gradient(90deg, rgba(181, 146, 84, 0.06) 0%, #FFFFFF 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
          <ShieldCheck size={24} style={{ color: 'var(--color-gold-600)', flexShrink: 0, marginTop: '0.15rem' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-deep-green)', margin: '0 0 0.35rem 0' }}>
              {isAr ? 'تحديث السجل والبيانات المهنية' : 'Record Synchronization & Integrity'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
              {isAr
                ? 'يتم ربط كافة الدورات والشهادات الصادرة التي تجتازها تلقائياً بملفك الشخصي المعتمد لدى مركز الحلول المتكاملة للأمن والسلامة، وتظل شهاداتك محفوظة برقم تحقق رقمي فريد يتيح التحقق العام منها في أي وقت.'
                : 'All courses and issued certificates you complete are linked directly to your authenticated profile at Integrated Solutions Center for Safety and Security, protected by unique public verification hashes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
