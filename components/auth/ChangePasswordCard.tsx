'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Circle,
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminAlert } from '@/components/admin/ui';

interface ChangePasswordCardProps {
  onSuccess?: () => void;
  backUrl?: string;
}

export default function ChangePasswordCard({ onSuccess, backUrl = '/admin' }: ChangePasswordCardProps) {
  const router = useRouter();
  const { locale, dir } = useLanguage();
  const isAr = locale === 'ar';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password Strength Indicators
  const hasMinLength = newPassword.length >= 10;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword.length > 0 && currentPassword !== newPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch &&
    currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || loading) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (isAr ? 'فشل تغيير كلمة المرور' : 'Password change failed'));
      }

      setSuccess(
        data.message ||
        (isAr
          ? 'تم تغيير كلمة المرور بنجاح وإبطال جميع الجلسات القديمة. جاري تحويلك لصفحة تسجيل الدخول...'
          : 'Password changed successfully. All previous sessions revoked. Redirecting to login...')
      );

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (onSuccess) {
        onSuccess();
      }

      // Redirect to login after 2 seconds to re-authenticate with the new credentials
      setTimeout(() => {
        router.push('/login?message=password_changed');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={dir}
      style={{
        maxWidth: '740px',
        margin: '0 auto',
        background: '#FFFFFF',
        border: '1.5px solid #E2E8F0',
        borderRadius: '16px',
        padding: '2.25rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1.5px solid #F1F5F9',
          paddingBottom: '1.25rem',
        }}
      >
        <div
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #064E3B 0%, #022c22 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D4AF37',
            boxShadow: '0 4px 12px rgba(6, 78, 59, 0.25)',
            flexShrink: 0,
          }}
        >
          <KeyRound size={26} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0, lineHeight: 1.3 }}>
            {isAr ? 'تغيير كلمة المرور وإبطال الجلسات' : 'Change Password & Invalidate Sessions'}
          </h2>
          <p style={{ fontSize: '0.86rem', color: '#64748B', margin: '0.35rem 0 0', fontWeight: 500 }}>
            {isAr
              ? 'تحديث كلمة المرور لحسابك مع رفع رقم إصدار الجلسة وإبطال كافة الرموز السابقة فوراً على كافة الأجهزة'
              : 'Update your account password with automatic session revocation across all active devices'}
          </p>
        </div>
      </div>

      {/* Security Advisory Alert */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminAlert
          variant="warning"
          title={isAr ? 'تنبيه أمني إلزامي للمستخدم:' : 'Mandatory Security Notice:'}
          message={
            isAr
              ? 'بمجرد تأكيد التغيير، سيتم رفع إصدار الجلسة (tokenVersion) وإبطال جميع رموز الدخول النشطة فوراً على كافة الأجهزة، وسيتم تسجيل خروجك تلقائياً لإعادة تسجيل الدخول بكلمة المرور الجديدة.'
              : 'Upon saving, tokenVersion is incremented immediately, invalidating all existing JWT sessions on all devices. You will be redirected to log in with your new password.'
          }
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ marginBottom: '1.5rem' }}>
          <AdminAlert
            variant="danger"
            title={isAr ? 'تعذر إتمام العملية' : 'Action Failed'}
            message={error}
            onDismiss={() => setError(null)}
          />
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div style={{ marginBottom: '1.5rem' }}>
          <AdminAlert
            variant="success"
            title={isAr ? 'تمت العملية بنجاح' : 'Success'}
            message={success}
          />
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
        {/* Current Password */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '0.5rem',
            }}
          >
            <span>{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</span>
            <span style={{ color: '#DC2626', fontWeight: 900 }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={isAr ? 'أدخل كلمة المرور الحالية لحسابك' : 'Enter current account password'}
              required
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                padding: '0.65rem 2.85rem 0.65rem 1rem',
                borderRadius: '9px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.94rem',
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#064E3B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 78, 59, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              style={{
                position: 'absolute',
                [isAr ? 'left' : 'right']: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={showCurrent ? 'Hide password' : 'Show password'}
            >
              {showCurrent ? <EyeOff size={19} color="#0F172A" /> : <Eye size={19} color="#64748B" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '0.5rem',
            }}
          >
            <span>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</span>
            <span style={{ color: '#DC2626', fontWeight: 900 }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={isAr ? 'أدخل كلمة مرور جديدة قوية (10 أحرف فأكثر مع رموز وأرقام)' : 'Enter strong new password (10+ chars, uppercase, symbol, number)'}
              required
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                padding: '0.65rem 2.85rem 0.65rem 1rem',
                borderRadius: '9px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.94rem',
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#064E3B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 78, 59, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              style={{
                position: 'absolute',
                [isAr ? 'left' : 'right']: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={showNew ? 'Hide password' : 'Show password'}
            >
              {showNew ? <EyeOff size={19} color="#0F172A" /> : <Eye size={19} color="#64748B" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.88rem',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '0.5rem',
            }}
          >
            <span>{isAr ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}</span>
            <span style={{ color: '#DC2626', fontWeight: 900 }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={isAr ? 'أعد إدخال كلمة المرور الجديدة للتطابق' : 'Re-enter new password to verify match'}
              required
              disabled={loading}
              style={{
                width: '100%',
                height: '46px',
                padding: '0.65rem 2.85rem 0.65rem 1rem',
                borderRadius: '9px',
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.94rem',
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#064E3B';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(6, 78, 59, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.boxShadow = 'inset 0 1px 2px rgba(0, 0, 0, 0.04)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: 'absolute',
                [isAr ? 'left' : 'right']: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={19} color="#0F172A" /> : <Eye size={19} color="#64748B" />}
            </button>
          </div>
        </div>

        {/* Realtime Requirements Checklist */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.15rem 1.25rem',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '0.75rem',
            }}
          >
            {isAr ? 'معايير قوة كلمة المرور المعتمدة (تحقق فوري):' : 'Password Security Requirements:'}
          </span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '0.55rem',
            }}
          >
            <RequirementBadge met={hasMinLength} text={isAr ? '10 أحرف كحد أدنى' : 'Minimum 10 characters'} />
            <RequirementBadge met={hasUppercase} text={isAr ? 'حرف كبير واحد (A-Z)' : 'One uppercase letter (A-Z)'} />
            <RequirementBadge met={hasLowercase} text={isAr ? 'حرف صغير واحد (a-z)' : 'One lowercase letter (a-z)'} />
            <RequirementBadge met={hasNumber} text={isAr ? 'رقم واحد على الأقل (0-9)' : 'One number (0-9)'} />
            <RequirementBadge met={hasSpecial} text={isAr ? 'رمز خاص (@, #, $, %, !)' : 'One special symbol (@, #, $, etc.)'} />
            <RequirementBadge met={passwordsMatch} text={isAr ? 'تطابق كلمتي المرور تماماً' : 'Passwords match exactly'} />
            <RequirementBadge met={isDifferentFromCurrent} text={isAr ? 'اختلاف عن كلمة المرور الحالية' : 'Different from current password'} />
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              style={{
                flex: 1,
                minHeight: '48px',
                padding: '0.85rem 1.75rem',
                borderRadius: '9px',
                border: isFormValid && !loading ? '1.5px solid #064E3B' : '1.5px solid #CBD5E1',
                background: isFormValid && !loading
                  ? 'linear-gradient(135deg, #064E3B 0%, #042F2C 100%)'
                  : '#E2E8F0',
                color: isFormValid && !loading ? '#FFFFFF' : '#64748B',
                fontWeight: 800,
                fontSize: '0.96rem',
                cursor: isFormValid && !loading ? 'pointer' : 'not-allowed',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isFormValid && !loading ? '0 4px 14px rgba(6, 78, 59, 0.3)' : 'none',
              }}
            >
              <Lock size={18} color={isFormValid && !loading ? '#D4AF37' : '#94A3B8'} />
              <span>
                {loading
                  ? (isAr ? 'جاري التحقق وتحديث الجلسات...' : 'Updating...')
                  : (isAr ? 'تأكيد تغيير كلمة المرور وإبطال الجلسات' : 'Confirm Password Change & Revoke Sessions')}
              </span>
            </button>

            {backUrl && (
              <button
                type="button"
                onClick={() => router.push(backUrl)}
                disabled={loading}
                style={{
                  minHeight: '48px',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '9px',
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#94A3B8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#CBD5E1';
                }}
              >
                {isAr ? 'إلغاء والعودة' : 'Cancel'}
              </button>
            )}
          </div>

          {!isFormValid && (
            <span
              style={{
                fontSize: '0.78rem',
                color: '#64748B',
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              {isAr
                ? 'ℹ سيتم تفعيل زر التأكيد تلقائياً بمجرد استيفاء كافة شروط كلمة المرور وتطابقها أعلاه.'
                : 'ℹ Confirm button will be enabled once all password requirements above are fulfilled.'}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function RequirementBadge({ met, text }: { met: boolean; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        padding: '0.45rem 0.65rem',
        borderRadius: '7px',
        background: met ? '#ECFDF5' : '#FFFFFF',
        border: met ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
        transition: 'all 0.15s ease',
      }}
    >
      {met ? (
        <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
      ) : (
        <Circle size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
      )}
      <span
        style={{
          fontSize: '0.8rem',
          fontWeight: met ? 700 : 500,
          color: met ? '#065F46' : '#475569',
        }}
      >
        {text}
      </span>
    </div>
  );
}
