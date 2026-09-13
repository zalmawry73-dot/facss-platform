import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { BookOpen, Clock, MapPin, Users, Award, ArrowLeft } from 'lucide-react';

export const revalidate = 0;

export default async function TraineeCoursesPage() {
  const allCourses = await prisma.course.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
          الدورات التدريبية المتاحة للتسجيل
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
          استعرض البرامج والتخصصات الأمنية وسجّل في الدورات القادمة لترقية مهاراتك الميدانية.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
        {allCourses.map((c) => (
          <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span className="badge badge-gold">{c.category.titleAr}</span>
                <span className="badge badge-green">{c.status}</span>
              </div>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '0.5rem' }}>
                {c.titleAr}
              </h3>
              <h4 style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', fontWeight: 600, marginBottom: '1rem' }}>
                {c.titleEn}
              </h4>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                {c.descriptionAr}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', padding: '0.85rem', background: 'rgba(5,14,9,0.5)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={14} style={{ color: 'var(--color-gold-light)' }} />
                  <span>{c.duration}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={14} style={{ color: 'var(--color-gold-light)' }} />
                  <span>{c.location}</span>
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                السعة: {c.capacity} متدرب
              </span>

              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={() => alert(`تم استلام طلب تسجيلكم في ${c.titleAr} وسيتم مراجعته من إدارة التدريب.`)}
              >
                تأكيد التسجيل الآن
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
