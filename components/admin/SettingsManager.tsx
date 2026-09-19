'use client';

import React, { useState } from 'react';
import { Settings, Phone, Mail, MapPin, Globe, Clock, Save, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

interface SettingRecord {
  id?: string;
  key: string;
  value: string;
  category?: string;
}

interface Props {
  initialSettings: SettingRecord[];
}

export default function SettingsManager({ initialSettings }: Props) {
  // Convert list to map
  const settingsMap: Record<string, string> = {};
  initialSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const [form, setForm] = useState<Record<string, string>>({
    OFFICIAL_PHONE: settingsMap.OFFICIAL_PHONE || '+967 2 245 800',
    WHATSAPP_PHONE: settingsMap.WHATSAPP_PHONE || '',
    OFFICIAL_EMAIL: settingsMap.OFFICIAL_EMAIL || 'info@facss-aden.com',
    OPERATIONS_EMAIL: settingsMap.OPERATIONS_EMAIL || 'services@facss-aden.com',
    TRAINING_EMAIL: settingsMap.TRAINING_EMAIL || 'training@facss-aden.com',
    OFFICIAL_ADDRESS: settingsMap.OFFICIAL_ADDRESS || 'العاصمة عدن - خور مكسر - حي السفارات',
    WORKING_HOURS: settingsMap.WORKING_HOURS || 'الأحد - الخميس: 8:00 صباحاً - 4:00 مساءً (استجابة عملياتية ميدانية على مدار الساعة)',
    SOCIAL_TWITTER: settingsMap.SOCIAL_TWITTER || '',
    SOCIAL_LINKEDIN: settingsMap.SOCIAL_LINKEDIN || '',
    SOCIAL_FACEBOOK: settingsMap.SOCIAL_FACEBOOK || '',
    ANNOUNCEMENT_TEXT: settingsMap.ANNOUNCEMENT_TEXT || 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية — منظومة أمنية متكاملة تُرسي مفهوم الوقاية قبل الاستجابة',
  });

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const saveSingleField = async (key: string) => {
    setSavingKey(key);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: form[key] }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر حفظ الإعداد');

      setFeedback({ type: 'success', message: `تم تحديث الإعداد [${key}] بقاعدة البيانات بنجاح` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingKey(null);
    }
  };

  const saveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingKey('ALL');
    setFeedback(null);

    try {
      for (const [key, value] of Object.entries(form)) {
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || `فشل حفظ الإعداد ${key}`);
        }
      }
      setFeedback({ type: 'success', message: 'تم حفظ وتحديث جميع إعدادات النظام الرسمية بنجاح' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: '#FFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={20} color="#22c55e" /> : <AlertCircle size={20} color="#ef4444" />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
              إعدادات النظام وبيانات التواصل الرسمي
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              تعديل أرقام الهواتف، عناوين البريد، الروابط، والنصوص الرسمية بقاعدة البيانات مباشرة دون تعديل الكود
            </span>
          </div>

          <button
            type="button"
            className="btn btn-gold btn-sm"
            disabled={savingKey !== null}
            onClick={saveAll}
          >
            <Save size={16} />
            <span>{savingKey === 'ALL' ? 'جاري الحفظ الشامل...' : 'حفظ جميع الإعدادات'}</span>
          </button>
        </div>
      </div>

      {/* Security Guard Notice */}
      <div
        style={{
          padding: '0.85rem 1.25rem',
          marginBottom: '1.5rem',
          borderRadius: '8px',
          background: 'rgba(11, 37, 24, 0.6)',
          borderInlineStart: '4px solid var(--color-gold)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <ShieldAlert size={20} color="var(--color-gold)" />
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          حماية أمنية مشددة: مفاتيح التكوين السرية (قواعد البيانات، AUTH_SECRET، مفاتيح التشفير) معزولة تماماً في بيئة الخادم ومحجوبة من واجهة الإعدادات.
        </span>
      </div>

      {/* Settings Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Section 1: Phone Numbers & Direct Contact */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-gold-light)' }}>
            <Phone size={18} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFF' }}>
              أرقام الهواتف والاتصال المباشر
            </h3>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">الهاتف الرسمي الثابت (عدن)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={form.OFFICIAL_PHONE}
                onChange={(e) => setForm({ ...form, OFFICIAL_PHONE: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'OFFICIAL_PHONE'}
                onClick={() => saveSingleField('OFFICIAL_PHONE')}
              >
                {savingKey === 'OFFICIAL_PHONE' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">رقم واتساب المركز (اختياري)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={form.WHATSAPP_PHONE}
                onChange={(e) => setForm({ ...form, WHATSAPP_PHONE: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'WHATSAPP_PHONE'}
                onClick={() => saveSingleField('WHATSAPP_PHONE')}
              >
                {savingKey === 'WHATSAPP_PHONE' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Operational Emails */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-gold-light)' }}>
            <Mail size={18} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFF' }}>
              عناوين البريد الإلكتروني الرسمية
            </h3>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">البريد الرسمي العام (الاتصال)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                className="form-control"
                value={form.OFFICIAL_EMAIL}
                onChange={(e) => setForm({ ...form, OFFICIAL_EMAIL: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'OFFICIAL_EMAIL'}
                onClick={() => saveSingleField('OFFICIAL_EMAIL')}
              >
                {savingKey === 'OFFICIAL_EMAIL' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">بريد إدارة الخدمات والعمليات</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                className="form-control"
                value={form.OPERATIONS_EMAIL}
                onChange={(e) => setForm({ ...form, OPERATIONS_EMAIL: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'OPERATIONS_EMAIL'}
                onClick={() => saveSingleField('OPERATIONS_EMAIL')}
              >
                {savingKey === 'OPERATIONS_EMAIL' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">بريد قطاع التدريب والتأهيل الأمني</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                className="form-control"
                value={form.TRAINING_EMAIL}
                onChange={(e) => setForm({ ...form, TRAINING_EMAIL: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'TRAINING_EMAIL'}
                onClick={() => saveSingleField('TRAINING_EMAIL')}
              >
                {savingKey === 'TRAINING_EMAIL' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Headquarters & Working Hours */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-gold-light)' }}>
            <MapPin size={18} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFF' }}>
              المقر الرئيسي وساعات العمل
            </h3>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">العنوان الميداني للمركز (عدن)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={form.OFFICIAL_ADDRESS}
                onChange={(e) => setForm({ ...form, OFFICIAL_ADDRESS: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'OFFICIAL_ADDRESS'}
                onClick={() => saveSingleField('OFFICIAL_ADDRESS')}
              >
                {savingKey === 'OFFICIAL_ADDRESS' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">ساعات ومواعيد الدوام الرسمي</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={form.WORKING_HOURS}
                onChange={(e) => setForm({ ...form, WORKING_HOURS: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'WORKING_HOURS'}
                onClick={() => saveSingleField('WORKING_HOURS')}
              >
                {savingKey === 'WORKING_HOURS' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Social Links & Official Announcement */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem', color: 'var(--color-gold-light)' }}>
            <Globe size={18} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#FFF' }}>
              الروابط الرسمية وشريط الإعلان
            </h3>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">رابط منصة (X / Twitter)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                className="form-control"
                value={form.SOCIAL_TWITTER}
                onChange={(e) => setForm({ ...form, SOCIAL_TWITTER: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'SOCIAL_TWITTER'}
                onClick={() => saveSingleField('SOCIAL_TWITTER')}
              >
                {savingKey === 'SOCIAL_TWITTER' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">رابط صفحة LinkedIn</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="url"
                className="form-control"
                value={form.SOCIAL_LINKEDIN}
                onChange={(e) => setForm({ ...form, SOCIAL_LINKEDIN: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'SOCIAL_LINKEDIN'}
                onClick={() => saveSingleField('SOCIAL_LINKEDIN')}
              >
                {savingKey === 'SOCIAL_LINKEDIN' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">نص الإعلان الرسمي للمنصة</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                value={form.ANNOUNCEMENT_TEXT}
                onChange={(e) => setForm({ ...form, ANNOUNCEMENT_TEXT: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={savingKey === 'ANNOUNCEMENT_TEXT'}
                onClick={() => saveSingleField('ANNOUNCEMENT_TEXT')}
              >
                {savingKey === 'ANNOUNCEMENT_TEXT' ? '...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
