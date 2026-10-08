'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Save,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminAlert,
} from '@/components/admin/ui';

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
  const { tx, txLocale } = useAdminT();
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
    OFFICIAL_ADDRESS: settingsMap.OFFICIAL_ADDRESS || tx("عدن - الجمهورية اليمنية"),
    WORKING_HOURS: settingsMap.WORKING_HOURS || tx("الأحد - الخميس: 8:00 صباحاً - 3:00 مساءً"),
    SOCIAL_TWITTER: settingsMap.SOCIAL_TWITTER || '',
    SOCIAL_LINKEDIN: settingsMap.SOCIAL_LINKEDIN || '',
    SOCIAL_FACEBOOK: settingsMap.SOCIAL_FACEBOOK || '',
    ANNOUNCEMENT_TEXT: settingsMap.ANNOUNCEMENT_TEXT || tx("المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية — السلامة أولاً"),
    SLA_RESPONSE_CRITICAL_MINUTES: settingsMap.SLA_RESPONSE_CRITICAL_MINUTES || '15',
    SLA_RESPONSE_HIGH_MINUTES: settingsMap.SLA_RESPONSE_HIGH_MINUTES || '60',
    SLA_RESPONSE_MEDIUM_MINUTES: settingsMap.SLA_RESPONSE_MEDIUM_MINUTES || '240',
    SLA_RESPONSE_LOW_MINUTES: settingsMap.SLA_RESPONSE_LOW_MINUTES || '1440',
    SLA_WARNING_PERCENT: settingsMap.SLA_WARNING_PERCENT || '80',
    SLA_COMPLAINT_NORMAL_HOURS: settingsMap.SLA_COMPLAINT_NORMAL_HOURS || '48',
    SLA_COMPLAINT_URGENT_HOURS: settingsMap.SLA_COMPLAINT_URGENT_HOURS || '24',
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
      if (!res.ok) throw new Error(data.error || tx("تعذر حفظ الإعداد"));

      setFeedback({ type: 'success', message: tx("تم تحديث الإعداد [{0}] بقاعدة البيانات بنجاح", key) });
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
          throw new Error(errData.error || tx("فشل حفظ الإعداد {0}", key));
        }
      }
      setFeedback({ type: 'success', message: tx("تم حفظ وتحديث جميع إعدادات النظام الرسمية بنجاح") });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title={tx("إعدادات النظام وبيانات التواصل الرسمي")}
        description={tx("تعديل أرقام الهواتف، عناوين البريد، الروابط، والنصوص الرسمية بقاعدة البيانات مباشرة دون تعديل الكود")}
        actions={
          <AdminButton
            variant="primary"
            icon={<Save size={16} />}
            loading={savingKey === 'ALL'}
            disabled={savingKey !== null}
            onClick={saveAll}
          >
            {savingKey === 'ALL' ? tx("جاري الحفظ الشامل...") : tx("حفظ جميع الإعدادات")}
          </AdminButton>
        }
      />

      {/* Feedback Banner */}
      {feedback && (
        <div style={{ marginBottom: '1.25rem' }}>
          <AdminAlert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Security Guard Notice */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminAlert
          variant="info"
          title={tx("حماية أمنية مشددة")}
          message={tx("مفاتيح التكوين السرية (قواعد البيانات، AUTH_SECRET، مفاتيح التشفير) معزولة تماماً في بيئة الخادم ومحجوبة من واجهة الإعدادات.")}
        />
      </div>

      {/* Settings Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '1.25rem' }}>
        {/* Section 1: Phone Numbers & Direct Contact */}
        <AdminSection
          title={tx("أرقام الهواتف والاتصال المباشر")}
          description={tx("بيانات الهواتف الرسمية وخدمة الواتساب للتواصل مع الشركاء")}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <AdminInput
                label={tx("الهاتف الرسمي الثابت (عدن)")}
                type="text"
                dir="ltr"
                value={form.OFFICIAL_PHONE}
                onChange={(e) => setForm({ ...form, OFFICIAL_PHONE: e.target.value })}
                helperText={tx("رقم الاتصال المكتبي الرئيسي الظاهر في ترويسة الموقع الرسمي")}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'OFFICIAL_PHONE'}
                  loading={savingKey === 'OFFICIAL_PHONE'}
                  onClick={() => saveSingleField('OFFICIAL_PHONE')}
                >
                  {tx("حفظ الهاتف")}
                </AdminButton>
              </div>
            </div>

            <div>
              <AdminInput
                label={tx("رقم واتساب المركز (اختياري)")}
                type="text"
                dir="ltr"
                value={form.WHATSAPP_PHONE}
                onChange={(e) => setForm({ ...form, WHATSAPP_PHONE: e.target.value })}
                helperText={tx("مفتاح الدولة متبوعاً بالرقم (مثال: +967770000000)")}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'WHATSAPP_PHONE'}
                  loading={savingKey === 'WHATSAPP_PHONE'}
                  onClick={() => saveSingleField('WHATSAPP_PHONE')}
                >
                  {tx("حفظ الواتساب")}
                </AdminButton>
              </div>
            </div>
          </div>
        </AdminSection>

        {/* Section 2: Operational Emails */}
        <AdminSection
          title={tx("عناوين البريد الإلكتروني الرسمية")}
          description={tx("صناديق البريد المؤسسية التابعة لنطاق facss-aden.com")}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <AdminInput
                label={tx("البريد الرسمي العام (الاتصال)")}
                type="email"
                dir="ltr"
                value={form.OFFICIAL_EMAIL}
                onChange={(e) => setForm({ ...form, OFFICIAL_EMAIL: e.target.value })}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'OFFICIAL_EMAIL'}
                  loading={savingKey === 'OFFICIAL_EMAIL'}
                  onClick={() => saveSingleField('OFFICIAL_EMAIL')}
                >
                  {tx("حفظ البريد")}
                </AdminButton>
              </div>
            </div>

            <div>
              <AdminInput
                label={tx("بريد إدارة الخدمات والعمليات")}
                type="email"
                dir="ltr"
                value={form.OPERATIONS_EMAIL}
                onChange={(e) => setForm({ ...form, OPERATIONS_EMAIL: e.target.value })}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'OPERATIONS_EMAIL'}
                  loading={savingKey === 'OPERATIONS_EMAIL'}
                  onClick={() => saveSingleField('OPERATIONS_EMAIL')}
                >
                  {tx("حفظ البريد")}
                </AdminButton>
              </div>
            </div>

            <div>
              <AdminInput
                label={tx("بريد قطاع التدريب والتأهيل الأمني")}
                type="email"
                dir="ltr"
                value={form.TRAINING_EMAIL}
                onChange={(e) => setForm({ ...form, TRAINING_EMAIL: e.target.value })}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'TRAINING_EMAIL'}
                  loading={savingKey === 'TRAINING_EMAIL'}
                  onClick={() => saveSingleField('TRAINING_EMAIL')}
                >
                  {tx("حفظ البريد")}
                </AdminButton>
              </div>
            </div>
          </div>
        </AdminSection>

        {/* Section 3: Headquarters & Working Hours */}
        <AdminSection
          title={tx("المقر الرئيسي وساعات العمل")}
          description={tx("العنوان الجغرافي للمقر في العاصمة المؤقتة عدن وأوقات الاستقبال")}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <AdminInput
                label={tx("العنوان الميداني للمركز (عدن)")}
                type="text"
                value={form.OFFICIAL_ADDRESS}
                onChange={(e) => setForm({ ...form, OFFICIAL_ADDRESS: e.target.value })}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'OFFICIAL_ADDRESS'}
                  loading={savingKey === 'OFFICIAL_ADDRESS'}
                  onClick={() => saveSingleField('OFFICIAL_ADDRESS')}
                >
                  {tx("حفظ العنوان")}
                </AdminButton>
              </div>
            </div>

            <div>
              <AdminInput
                label={tx("ساعات ومواعيد الدوام الرسمي")}
                type="text"
                value={form.WORKING_HOURS}
                onChange={(e) => setForm({ ...form, WORKING_HOURS: e.target.value })}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'WORKING_HOURS'}
                  loading={savingKey === 'WORKING_HOURS'}
                  onClick={() => saveSingleField('WORKING_HOURS')}
                >
                  {tx("حفظ المواعيد")}
                </AdminButton>
              </div>
            </div>
          </div>
        </AdminSection>

        {/* Section 4: Social Links & Official Announcement */}
        <AdminSection
          title={tx("الروابط الرسمية وشريط الإعلان")}
          description={tx("حسابات وسائل التواصل الرسمية والنص المؤسسي العريض")}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <AdminInput
                label={tx("رابط منصة (X / Twitter)")}
                type="url"
                dir="ltr"
                value={form.SOCIAL_TWITTER}
                onChange={(e) => setForm({ ...form, SOCIAL_TWITTER: e.target.value })}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'SOCIAL_TWITTER'}
                  loading={savingKey === 'SOCIAL_TWITTER'}
                  onClick={() => saveSingleField('SOCIAL_TWITTER')}
                >
                  {tx("حفظ الرابط")}
                </AdminButton>
              </div>
            </div>

            <div>
              <AdminInput
                label={tx("رابط صفحة LinkedIn")}
                type="url"
                dir="ltr"
                value={form.SOCIAL_LINKEDIN}
                onChange={(e) => setForm({ ...form, SOCIAL_LINKEDIN: e.target.value })}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'SOCIAL_LINKEDIN'}
                  loading={savingKey === 'SOCIAL_LINKEDIN'}
                  onClick={() => saveSingleField('SOCIAL_LINKEDIN')}
                >
                  {tx("حفظ الرابط")}
                </AdminButton>
              </div>
            </div>

            <div>
              <AdminTextarea
                label={tx("نص الإعلان الرسمي للمنصة")}
                rows={3}
                value={form.ANNOUNCEMENT_TEXT}
                onChange={(e) => setForm({ ...form, ANNOUNCEMENT_TEXT: e.target.value })}
                helperText={tx("يظهر في الشريط الإخباري العلوي للواجهة العامة للمنصة")}
              />
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  disabled={savingKey === 'ANNOUNCEMENT_TEXT'}
                  loading={savingKey === 'ANNOUNCEMENT_TEXT'}
                  onClick={() => saveSingleField('ANNOUNCEMENT_TEXT')}
                >
                  {tx("حفظ النص")}
                </AdminButton>
              </div>
            </div>
          </div>
        </AdminSection>

        {/* Section 5: SLA Engine & 24/7 Operations Room Targets */}
        <div style={{ gridColumn: '1 / -1' }}>
          <AdminSection
            title={tx("مستهدفات الاستجابة واتفاقيات مستوى الخدمة (SLA Engine — 24/7)")}
            description={tx("تحديد الأزمنة القصوى للاستجابة للبلاغات الأمنية والشكاوى لغرفة المراقبة والرصد على مدار الساعة (24/7)")}
          >
            <div style={{ marginBottom: '1.25rem' }}>
              <AdminAlert
                variant="info"
                message={tx("ملاحظة تشغيلية: محرك SLA يعمل بنموذج 24/7 مستمر. تعديل المستهدفات يسري على البلاغات والشكاوى المنشأة حديثاً فقط ويحافظ على المستهدفات التاريخية للبلاغات القديمة (Snapshot Integrity).")}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <AdminInput
                  label={tx("زمن استجابة البلاغ الحرج (CRITICAL) - بالدقائق")}
                  type="number"
                  dir="ltr"
                  value={form.SLA_RESPONSE_CRITICAL_MINUTES}
                  onChange={(e) => setForm({ ...form, SLA_RESPONSE_CRITICAL_MINUTES: e.target.value })}
                  helperText={tx("الافتراضي: 15 دقيقة")}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={savingKey === 'SLA_RESPONSE_CRITICAL_MINUTES'}
                    loading={savingKey === 'SLA_RESPONSE_CRITICAL_MINUTES'}
                    onClick={() => saveSingleField('SLA_RESPONSE_CRITICAL_MINUTES')}
                  >
                    {tx("حفظ")}
                  </AdminButton>
                </div>
              </div>

              <div>
                <AdminInput
                  label={tx("زمن استجابة البلاغ العالي (HIGH) - بالدقائق")}
                  type="number"
                  dir="ltr"
                  value={form.SLA_RESPONSE_HIGH_MINUTES}
                  onChange={(e) => setForm({ ...form, SLA_RESPONSE_HIGH_MINUTES: e.target.value })}
                  helperText={tx("الافتراضي: 60 دقيقة")}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={savingKey === 'SLA_RESPONSE_HIGH_MINUTES'}
                    loading={savingKey === 'SLA_RESPONSE_HIGH_MINUTES'}
                    onClick={() => saveSingleField('SLA_RESPONSE_HIGH_MINUTES')}
                  >
                    {tx("حفظ")}
                  </AdminButton>
                </div>
              </div>

              <div>
                <AdminInput
                  label={tx("زمن استجابة البلاغ المتوسط (MEDIUM) - بالدقائق")}
                  type="number"
                  dir="ltr"
                  value={form.SLA_RESPONSE_MEDIUM_MINUTES}
                  onChange={(e) => setForm({ ...form, SLA_RESPONSE_MEDIUM_MINUTES: e.target.value })}
                  helperText={tx("الافتراضي: 240 دقيقة (4 ساعات)")}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={savingKey === 'SLA_RESPONSE_MEDIUM_MINUTES'}
                    loading={savingKey === 'SLA_RESPONSE_MEDIUM_MINUTES'}
                    onClick={() => saveSingleField('SLA_RESPONSE_MEDIUM_MINUTES')}
                  >
                    {tx("حفظ")}
                  </AdminButton>
                </div>
              </div>

              <div>
                <AdminInput
                  label={tx("زمن استجابة البلاغ المنخفض (LOW) - بالدقائق")}
                  type="number"
                  dir="ltr"
                  value={form.SLA_RESPONSE_LOW_MINUTES}
                  onChange={(e) => setForm({ ...form, SLA_RESPONSE_LOW_MINUTES: e.target.value })}
                  helperText={tx("الافتراضي: 1440 دقيقة (24 ساعة)")}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={savingKey === 'SLA_RESPONSE_LOW_MINUTES'}
                    loading={savingKey === 'SLA_RESPONSE_LOW_MINUTES'}
                    onClick={() => saveSingleField('SLA_RESPONSE_LOW_MINUTES')}
                  >
                    {tx("حفظ")}
                  </AdminButton>
                </div>
              </div>

              <div>
                <AdminInput
                  label={tx("نسبة اقتراب خرق المهلة (SLA Warning Threshold %)")}
                  type="number"
                  dir="ltr"
                  value={form.SLA_WARNING_PERCENT}
                  onChange={(e) => setForm({ ...form, SLA_WARNING_PERCENT: e.target.value })}
                  helperText={tx("الافتراضي: 80% من المدة المحددة")}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={savingKey === 'SLA_WARNING_PERCENT'}
                    loading={savingKey === 'SLA_WARNING_PERCENT'}
                    onClick={() => saveSingleField('SLA_WARNING_PERCENT')}
                  >
                    {tx("حفظ")}
                  </AdminButton>
                </div>
              </div>

              <div>
                <AdminInput
                  label={tx("مهلة معالجة الشكوى العادية (بالساعات)")}
                  type="number"
                  dir="ltr"
                  value={form.SLA_COMPLAINT_NORMAL_HOURS}
                  onChange={(e) => setForm({ ...form, SLA_COMPLAINT_NORMAL_HOURS: e.target.value })}
                  helperText={tx("الافتراضي: 48 ساعة")}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={savingKey === 'SLA_COMPLAINT_NORMAL_HOURS'}
                    loading={savingKey === 'SLA_COMPLAINT_NORMAL_HOURS'}
                    onClick={() => saveSingleField('SLA_COMPLAINT_NORMAL_HOURS')}
                  >
                    {tx("حفظ")}
                  </AdminButton>
                </div>
              </div>

              <div>
                <AdminInput
                  label={tx("مهلة معالجة الشكوى العاجلة (بالساعات)")}
                  type="number"
                  dir="ltr"
                  value={form.SLA_COMPLAINT_URGENT_HOURS}
                  onChange={(e) => setForm({ ...form, SLA_COMPLAINT_URGENT_HOURS: e.target.value })}
                  helperText={tx("الافتراضي: 24 ساعة")}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={savingKey === 'SLA_COMPLAINT_URGENT_HOURS'}
                    loading={savingKey === 'SLA_COMPLAINT_URGENT_HOURS'}
                    onClick={() => saveSingleField('SLA_COMPLAINT_URGENT_HOURS')}
                  >
                    {tx("حفظ")}
                  </AdminButton>
                </div>
              </div>
            </div>
          </AdminSection>
        </div>
      </div>
    </div>
  );
}
