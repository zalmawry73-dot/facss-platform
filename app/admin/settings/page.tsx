import React from 'react';
import prisma from '@/lib/prisma';
import { Settings, Phone, Mail, Globe, MapPin, Save } from 'lucide-react';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const settings = await prisma.systemSetting.findMany({
    orderBy: { category: 'asc' },
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
          إعدادات النظام ومعلومات الاتصال المعتمدة
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          تعديل أرقام الهواتف الحقيقية، عناوين البريد، الروابط، والنصوص الرسمية دون الحاجة لتعديل الكود
        </span>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-gold-light)', marginBottom: '1.5rem' }}>
          بيانات الاتصال والهوية المؤسسية المسجلة بقاعدة البيانات
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {settings.map((s) => (
            <div key={s.id} style={{ padding: '1.2rem', background: 'rgba(5,14,9,0.7)', borderRadius: '8px', border: '1px solid rgba(197,155,39,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-gold-light)' }}>
                  {s.key}
                </span>
                <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                  {s.category}
                </span>
              </div>
              <p style={{ color: '#FFF', fontSize: '0.95rem', fontWeight: 600, margin: 0, wordBreak: 'break-all' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2.5rem', padding: '1.2rem', background: 'rgba(11,37,24,0.4)', borderRadius: '8px', borderInlineStart: '4px solid var(--color-gold)' }}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            ملاحظة: يمكنك تحديث أي قيمة من خلال واجهة Prisma Studio أو تشغيل أمر التحديث المباشر عند استلام أرقام الهواتف أو الروابط الاجتماعية الرسمية.
          </p>
        </div>
      </div>
    </div>
  );
}
