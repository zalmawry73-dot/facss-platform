'use client';

import { useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Save,
  ShieldCheck,
  Clock,
  KeyRound,
  Layers,
  CheckCircle2,
  Lock,
  MessageSquare,
  Share2,
  Building,
  Timer,
  AlertCircle,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminAlert,
  AdminTabs,
  AdminTabItem,
} from '@/components/admin/ui';
import DynamicFieldsManager from '@/components/admin/DynamicFieldsManager';

interface SettingRecord {
  id?: string;
  key: string;
  value: string;
  category?: string;
}

interface Props {
  initialSettings: SettingRecord[];
}

type TabId = 'contact' | 'channels' | 'sla' | 'fields';

export default function SettingsManager({ initialSettings }: Props) {
  const { tx } = useAdminT();
  const searchParams = useSearchParams();

  // Convert list to map
  const settingsMap: Record<string, string> = {};
  initialSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  // Query parameter tab support
  const queryTab = searchParams.get('tab') as TabId;
  const validTabs: TabId[] = ['contact', 'channels', 'sla', 'fields'];
  const [activeTab, setActiveTab] = useState<TabId>(
    validTabs.includes(queryTab) ? queryTab : 'contact'
  );

  const [form, setForm] = useState<Record<string, string>>({
    // Contact & Headquarters
    OFFICIAL_PHONE: settingsMap.OFFICIAL_PHONE || '+967 2 245 800',
    WHATSAPP_PHONE: settingsMap.WHATSAPP_PHONE || '',
    OFFICIAL_ADDRESS: settingsMap.OFFICIAL_ADDRESS || tx("عدن - الجمهورية اليمنية"),
    WORKING_HOURS: settingsMap.WORKING_HOURS || tx("الأحد - الخميس: 8:00 صباحاً - 3:00 مساءً"),

    // Emails, Channels & Announcements
    OFFICIAL_EMAIL: settingsMap.OFFICIAL_EMAIL || 'info@facss-aden.com',
    OPERATIONS_EMAIL: settingsMap.OPERATIONS_EMAIL || 'services@facss-aden.com',
    TRAINING_EMAIL: settingsMap.TRAINING_EMAIL || 'training@facss-aden.com',
    SOCIAL_TWITTER: settingsMap.SOCIAL_TWITTER || '',
    SOCIAL_LINKEDIN: settingsMap.SOCIAL_LINKEDIN || '',
    SOCIAL_FACEBOOK: settingsMap.SOCIAL_FACEBOOK || '',
    ANNOUNCEMENT_TEXT: settingsMap.ANNOUNCEMENT_TEXT || tx("مركز الحلول المتكاملة للأمن والسلامة — السلامة أولاً"),

    // SLA & Operations
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

  // Sync tab change to URL without full navigation
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as TabId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Grouped keys per tab
  const tabKeys: Record<'contact' | 'channels' | 'sla', string[]> = {
    contact: ['OFFICIAL_PHONE', 'WHATSAPP_PHONE', 'OFFICIAL_ADDRESS', 'WORKING_HOURS'],
    channels: [
      'OFFICIAL_EMAIL',
      'OPERATIONS_EMAIL',
      'TRAINING_EMAIL',
      'SOCIAL_TWITTER',
      'SOCIAL_LINKEDIN',
      'SOCIAL_FACEBOOK',
      'ANNOUNCEMENT_TEXT',
    ],
    sla: [
      'SLA_RESPONSE_CRITICAL_MINUTES',
      'SLA_RESPONSE_HIGH_MINUTES',
      'SLA_RESPONSE_MEDIUM_MINUTES',
      'SLA_RESPONSE_LOW_MINUTES',
      'SLA_WARNING_PERCENT',
      'SLA_COMPLAINT_NORMAL_HOURS',
      'SLA_COMPLAINT_URGENT_HOURS',
    ],
  };

  // Save a single field
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

  // Save all fields in the currently active tab
  const saveActiveTabFields = async (tab: 'contact' | 'channels' | 'sla') => {
    setSavingKey(`TAB_${tab}`);
    setFeedback(null);
    const keysToSave = tabKeys[tab];

    try {
      for (const key of keysToSave) {
        const res = await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: form[key] }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || tx("فشل حفظ الإعداد {0}", key));
        }
      }
      setFeedback({ type: 'success', message: tx("تم حفظ جميع إعدادات هذا القسم بنجاح في قاعدة البيانات.") });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingKey(null);
    }
  };

  // Global save across all standard settings
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
      setFeedback({ type: 'success', message: tx("تم حفظ وتحديث جميع إعدادات النظام الرسمية بنجاح.") });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingKey(null);
    }
  };

  const tabs: AdminTabItem[] = [
    { id: 'contact', label: tx("بيانات الاتصال والمقر"), icon: Phone, count: 4 },
    { id: 'channels', label: tx("البريد والقنوات وشريط الإعلان"), icon: Globe, count: 7 },
    { id: 'sla', label: tx("محرك الاستجابة و SLA"), icon: Clock, count: 7 },
    { id: 'fields', label: tx("الحقول والتصنيفات الميدانية"), icon: Layers, count: 4 },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <AdminPageHeader
        title={tx("إعدادات وتكوين النظام والتشغيل")}
        description={tx("إدارة معلومات التواصل والمقر، القنوات المؤسسية، مستهدفات محرك الاستجابة SLA، والحقول والتصنيفات الميدانية")}
        actions={
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <AdminButton
              variant="outline"
              href="/admin/change-password"
              icon={<KeyRound size={16} />}
              style={{ borderColor: 'rgba(212, 175, 55, 0.4)', color: 'var(--facss-gold-400)' }}
            >
              {tx("تغيير كلمة المرور")}
            </AdminButton>
            <AdminButton
              variant="primary"
              icon={<Save size={16} />}
              loading={savingKey === 'ALL'}
              disabled={savingKey !== null}
              onClick={saveAll}
            >
              {savingKey === 'ALL' ? tx("جاري الحفظ الشامل...") : tx("حفظ جميع الإعدادات")}
            </AdminButton>
          </div>
        }
      />

      {/* Security Assurance Banner */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '0.75rem 1.25rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#10B981',
            fontSize: '0.84rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Lock size={16} />
            <span style={{ fontWeight: 600 }}>{tx("حماية أمنية مشددة:")}</span>
            <span style={{ color: 'var(--text-muted, #94A3B8)' }}>
              {tx("مفاتيح التكوين السرية (AUTH_SECRET، قواعد البيانات، ومفاتيح التشفير AES-256) معزولة تماماً في بيئة الخادم ومحجوبة برمجياً.")}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              fontWeight: 700,
            }}
          >
            {tx("آمن 100%")}
          </span>
        </div>
      </div>

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

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={handleTabChange}
        />
      </div>

      {/* TAB 1: Contact & Headquarters */}
      {activeTab === 'contact' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* 1.1 Phone & WhatsApp */}
            <AdminSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={18} style={{ color: 'var(--facss-gold-400, #D4AF37)' }} />
                  <span>{tx("أرقام الهواتف والاتصال المباشر")}</span>
                </div>
              }
              description={tx("بيانات الهواتف الرسمية وخدمة الواتساب للتواصل المؤسسي وخدمة الشركاء")}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <AdminInput
                    label={tx("الهاتف الرسمي الثابت (عدن)")}
                    type="text"
                    dir="ltr"
                    value={form.OFFICIAL_PHONE}
                    onChange={(e) => setForm({ ...form, OFFICIAL_PHONE: e.target.value })}
                    helperText={tx("رقم الاتصال المكتبي الرئيسي الظاهر في ترويسة الموقع والواجهة العامة")}
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
                    label={tx("رقم واتساب المركز الرسمي")}
                    type="text"
                    dir="ltr"
                    value={form.WHATSAPP_PHONE}
                    onChange={(e) => setForm({ ...form, WHATSAPP_PHONE: e.target.value })}
                    helperText={tx("مفتاح الدولة متبوعاً بالرقم (مثال: +967770000000) لزر المحادثة المباشرة")}
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

            {/* 1.2 Headquarters & Hours */}
            <AdminSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building size={18} style={{ color: 'var(--facss-gold-400, #D4AF37)' }} />
                  <span>{tx("المقر الرئيسي وساعات العمل")}</span>
                </div>
              }
              description={tx("العنوان الجغرافي للمقر في العاصمة المؤقتة عدن وأوقات استقبال الزوار والمراجعين")}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <AdminInput
                    label={tx("العنوان الميداني للمركز (عدن)")}
                    type="text"
                    value={form.OFFICIAL_ADDRESS}
                    onChange={(e) => setForm({ ...form, OFFICIAL_ADDRESS: e.target.value })}
                    helperText={tx("النص الجغرافي الظاهر في تذييل الموقع ونماذج الاتصال")}
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
                    helperText={tx("أوقات الاستقبال الإداري والخدمي الرسمية")}
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
          </div>

          {/* Tab Quick Save Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--admin-card-border, #E2E8F0)',
              borderRadius: '10px',
            }}
          >
            <AdminButton
              variant="primary"
              icon={<Save size={16} />}
              loading={savingKey === 'TAB_contact'}
              disabled={savingKey !== null}
              onClick={() => saveActiveTabFields('contact')}
            >
              {savingKey === 'TAB_contact' ? tx("جاري الحفظ...") : tx("حفظ بيانات الاتصال والمقر")}
            </AdminButton>
          </div>
        </div>
      )}

      {/* TAB 2: Channels, Emails & Announcements */}
      {activeTab === 'channels' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* 2.1 Operational Emails */}
            <AdminSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Mail size={18} style={{ color: 'var(--facss-gold-400, #D4AF37)' }} />
                  <span>{tx("عناوين البريد الإلكتروني الرسمية")}</span>
                </div>
              }
              description={tx("صناديق البريد المؤسسية التابعة لنطاق facss-aden.com")}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <AdminInput
                    label={tx("البريد الرسمي العام (الاتصال والاستفسار)")}
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
                    label={tx("بريد إدارة العمليات والخدمات الميدانية")}
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

            {/* 2.2 Social Links & Announcements */}
            <AdminSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Share2 size={18} style={{ color: 'var(--facss-gold-400, #D4AF37)' }} />
                  <span>{tx("الروابط الرسمية وشريط الإعلان العام")}</span>
                </div>
              }
              description={tx("حسابات المنصات الاجتماعية الرسمية والنص الإعلاني العريض في الواجهة")}
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
                  <AdminInput
                    label={tx("رابط صفحة Facebook (اختياري)")}
                    type="url"
                    dir="ltr"
                    value={form.SOCIAL_FACEBOOK}
                    onChange={(e) => setForm({ ...form, SOCIAL_FACEBOOK: e.target.value })}
                  />
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      disabled={savingKey === 'SOCIAL_FACEBOOK'}
                      loading={savingKey === 'SOCIAL_FACEBOOK'}
                      onClick={() => saveSingleField('SOCIAL_FACEBOOK')}
                    >
                      {tx("حفظ الرابط")}
                    </AdminButton>
                  </div>
                </div>

                <div>
                  <AdminTextarea
                    label={tx("نص الإعلان الرسمي للمنصة")}
                    rows={2}
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
          </div>

          {/* Tab Quick Save Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--admin-card-border, #E2E8F0)',
              borderRadius: '10px',
            }}
          >
            <AdminButton
              variant="primary"
              icon={<Save size={16} />}
              loading={savingKey === 'TAB_channels'}
              disabled={savingKey !== null}
              onClick={() => saveActiveTabFields('channels')}
            >
              {savingKey === 'TAB_channels' ? tx("جاري الحفظ...") : tx("حفظ القنوات والبريد الرسمي")}
            </AdminButton>
          </div>
        </div>
      )}

      {/* TAB 3: SLA Engine & 24/7 Response Targets */}
      {activeTab === 'sla' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* SLA Explanation Banner */}
          <AdminAlert
            variant="info"
            title={tx("محرك مؤشرات الأداء واتفاقيات مستوى الخدمة (SLA Engine — 24/7)")}
            message={tx("يعمل محرك SLA على مدار الساعة 24/7 لحساب الأزمنة المتبقية للبلاغات والشكاوى. تعديل هذه القيم يسري فوراً على البلاغات والشكاوى المنشأة حديثاً، بينما تحتفظ البلاغات القديمة بمستهدفاتها التاريخية الموثقة وقت الإنشاء (Snapshot Immutability).")}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* 3.1 Field Incidents SLA Targets */}
            <AdminSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Timer size={18} style={{ color: 'var(--facss-gold-400, #D4AF37)' }} />
                  <span>{tx("مستهدفات الاستجابة للبلاغات الميدانية")}</span>
                </div>
              }
              description={tx("تحديد المدة القصوى المسموحة لفرق الاستجابة الميدانية للتحرك (بالدقائق)")}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <AdminInput
                    label={tx("زمن استجابة البلاغ الحرج (CRITICAL) - بالدقائق")}
                    type="number"
                    dir="ltr"
                    value={form.SLA_RESPONSE_CRITICAL_MINUTES}
                    onChange={(e) => setForm({ ...form, SLA_RESPONSE_CRITICAL_MINUTES: e.target.value })}
                    helperText={tx("الافتراضي: 15 دقيقة (خطر وشيك، تهديد للحياة أو المنشأة)")}
                  />
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
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
                    helperText={tx("الافتراضي: 60 دقيقة (ساعة واحدة)")}
                  />
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
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
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
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
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
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
                    label={tx("نسبة إطلاق التنبيه المبكر لخرق المهلة (%)")}
                    type="number"
                    dir="ltr"
                    value={form.SLA_WARNING_PERCENT}
                    onChange={(e) => setForm({ ...form, SLA_WARNING_PERCENT: e.target.value })}
                    helperText={tx("الافتراضي: 80% — يظهر شريط تحذيري برتقالي عند استهلاك هذه النسبة من الوقت")}
                  />
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
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
              </div>
            </AdminSection>

            {/* 3.2 Complaints SLA Targets */}
            <AdminSection
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--facss-gold-400, #D4AF37)' }} />
                  <span>{tx("مهل معالجة وإغلاق الشكاوى")}</span>
                </div>
              }
              description={tx("الحدود الزمنية المعتمدة لحل شكاوى المستفيدين والعملاء (بالساعات)")}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <AdminInput
                    label={tx("مهلة معالجة الشكوى العادية (بالساعات)")}
                    type="number"
                    dir="ltr"
                    value={form.SLA_COMPLAINT_NORMAL_HOURS}
                    onChange={(e) => setForm({ ...form, SLA_COMPLAINT_NORMAL_HOURS: e.target.value })}
                    helperText={tx("الافتراضي: 48 ساعة (يومان عمل كاملان)")}
                  />
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
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
                    helperText={tx("الافتراضي: 24 ساعة (يوم عمل واحد)")}
                  />
                  <div style={{ marginTop: '0.4rem', display: 'flex', justifyContent: 'flex-end' }}>
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

                {/* Operations Room Pill */}
                <div
                  style={{
                    padding: '1.25rem',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(212, 175, 55, 0.05)',
                    border: '1px dashed rgba(212, 175, 55, 0.3)',
                    marginTop: '0.5rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <Clock size={16} style={{ color: 'var(--facss-gold-400)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--facss-gold-400)' }}>
                      {tx("مراقبة مستمرة بلا توقف")}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {tx("يتم فحص مهل SLA بشكل أوتوماتيكي بواسطة خادم المنصة. في حال تجاوز أي بلاغ للنسبة التحذيرية أو تجاوزه للحد الأقصى، يرتفع مستوى التصعيد تلقائياً ويُوسم البلاغ بحالة خرق SLA.")}
                  </p>
                </div>
              </div>
            </AdminSection>
          </div>

          {/* Tab Quick Save Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--admin-card-border, #E2E8F0)',
              borderRadius: '10px',
            }}
          >
            <AdminButton
              variant="primary"
              icon={<Save size={16} />}
              loading={savingKey === 'TAB_sla'}
              disabled={savingKey !== null}
              onClick={() => saveActiveTabFields('sla')}
            >
              {savingKey === 'TAB_sla' ? tx("جاري الحفظ...") : tx("حفظ مستهدفات محرك SLA")}
            </AdminButton>
          </div>
        </div>
      )}

      {/* TAB 4: Dynamic Operational Fields & Taxonomies */}
      {activeTab === 'fields' && (
        <div>
          <DynamicFieldsManager />
        </div>
      )}
    </div>
  );
}
