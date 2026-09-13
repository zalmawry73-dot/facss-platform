import React from 'react';
import prisma from '@/lib/prisma';
import { GraduationCap, Award, Users, Plus, CheckCircle, Clock } from 'lucide-react';

export const revalidate = 0;

export default async function AdminTrainingManagerPage() {
  const [courses, registrations] = await Promise.all([
    prisma.course.findMany({
      include: { category: true, registrations: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trainingRegistration.findMany({
      include: { course: true, certificate: true },
      orderBy: { createdAt: 'desc' },
    })
  ]);

  return (
    <div>
      {/* Top Header Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              إدارة قطاع التدريب والتأهيل الأمني
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              إدارة البرامج التدريبية، مراجعة طلبات الالتحاق، واعتماد الشهادات
            </span>
          </div>

          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={undefined}
          >
            <Plus size={16} />
            <span>إضافة برنامج تدريبي جديد</span>
          </button>
        </div>
      </div>

      {/* Courses List */}
      <div className="card" style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
          الدورات التدريبية المعتمدة
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الدورة</th>
                <th>التصنيف</th>
                <th>المدة</th>
                <th>السعة</th>
                <th>المسجلين</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 700, color: '#FFF' }}>{c.titleAr}</td>
                  <td>{c.category.titleAr}</td>
                  <td>{c.duration}</td>
                  <td>{c.capacity}</td>
                  <td>
                    <span className="badge badge-gold">{c.registrations.length}</span>
                  </td>
                  <td>
                    <span className="badge badge-green">{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trainees Applications */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '1.2rem' }}>
          سجل طلبات الالتحاق والمتدربين
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم المتدرب</th>
                <th>الدورة</th>
                <th>الهاتف</th>
                <th>الحالة</th>
                <th>الشهادة الصادرة</th>
                <th>تاريخ التقديم</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((reg) => (
                <tr key={reg.id}>
                  <td style={{ fontWeight: 700, color: '#FFF' }}>{reg.fullName}</td>
                  <td>{reg.course.titleAr}</td>
                  <td>{reg.phone}</td>
                  <td>
                    <span className={`badge ${reg.status === 'COMPLETED' ? 'badge-green' : 'badge-gold'}`}>
                      {reg.status}
                    </span>
                  </td>
                  <td>
                    {reg.certificate ? (
                      <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                        {reg.certificate.certificateNumber}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>قيد الاختبار</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {new Date(reg.createdAt).toLocaleDateString('ar-YE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
