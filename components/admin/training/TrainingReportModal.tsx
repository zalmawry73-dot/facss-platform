'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Star,
  Printer,
  Calendar,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react';
import { AdminModal, AdminButton } from '@/components/admin/ui';

interface Props {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TrainingReportModal({ courseId, isOpen, onClose }: Props) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && courseId) {
      loadReport();
    }
  }, [isOpen, courseId]);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/training/${courseId}/report`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تحميل تقرير الدورة التدريبية');
      }
      setReport(data.report);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const printReport = () => {
    window.print();
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="تقرير اكتمال الدورة التدريبية (Training Completion Report)"
    >
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 1rem', color: 'var(--color-gold)' }} />
          <div>جاري تجميع وحساب بيانات التقرير من قاعدة البيانات الفعلية...</div>
        </div>
      ) : error ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#EF4444' }}>
          {error}
        </div>
      ) : report ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {/* Header Banner */}
          <div style={{ background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', padding: '1.25rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="badge" style={{ background: '#3B82F620', color: '#3B82F6', marginBottom: '0.5rem', display: 'inline-block' }}>
                  {report.categoryTitleAr} • {report.courseType === 'PRIVATE_CLIENT' ? 'برنامج خاص لعميل' : 'برنامج تدريب عام'}
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.5rem', color: 'var(--admin-text-primary)' }}>
                  {report.courseTitleAr}
                </h3>
                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span><Clock size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {report.duration}</span>
                  <span><MapPin size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {report.location}</span>
                  {report.startDate && (
                    <span><Calendar size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {new Date(report.startDate).toLocaleDateString('ar-EG')}</span>
                  )}
                </div>
              </div>
              <AdminButton variant="outline" size="sm" icon={<Printer size={14} />} onClick={printReport}>
                طباعة التقرير
              </AdminButton>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--admin-card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي المسجلين</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--admin-text-primary)', marginTop: '0.25rem' }}>
                {report.metrics.totalRegistered} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>متدرب</span>
              </div>
            </div>

            <div style={{ background: 'var(--admin-card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>نسبة الحضور الفعلي</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#3B82F6', marginTop: '0.25rem' }}>
                {report.metrics.attendanceRate !== null ? `${report.metrics.attendanceRate}%` : 'لا توجد بيانات'}
              </div>
            </div>

            <div style={{ background: 'var(--admin-card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>معدل التحسن المعرفي</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22C55E', marginTop: '0.25rem' }}>
                {report.metrics.averageImprovementRate !== null ? `+${report.metrics.averageImprovementRate}%` : 'غير متاح'}
              </div>
            </div>

            <div style={{ background: 'var(--admin-card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الشهادات الصادرة</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-gold)', marginTop: '0.25rem' }}>
                {report.metrics.certificatesIssued} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>شهادة</span>
              </div>
            </div>
          </div>

          {/* Trainers Section */}
          <div style={{ background: 'var(--admin-card-bg)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--admin-text-primary)' }}>
              المدربون والخبراء المكلفون
            </h4>
            {report.trainers.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لم يتم تعيين مدربين محددين في السجل لهذه الدورة</div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {report.trainers.map((t: any) => (
                  <div key={t.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--admin-border)' }}>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>{t.title}</div>
                    <span className="badge" style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>{t.role === 'LEAD_TRAINER' ? 'مدرب رئيسي' : 'مدرب مشارك'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evaluations & Knowledge Gain */}
          <div style={{ background: 'var(--admin-card-bg)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--admin-text-primary)' }}>
              تحليل التقييم القبلي والبعدي ونسبة التحسن (Gain Rate)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <strong>التقييم القبلي (PRE):</strong> {report.metrics.preEvaluationsTaken} مكتمل
              </div>
              <div>
                <strong>التقييم البعدي (POST):</strong> {report.metrics.postEvaluationsTaken} مكتمل
              </div>
              <div>
                <strong>الأزواج المكتملة المقارنة:</strong> {report.metrics.evaluationPairsAnalyzed} متدرب
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
              المعادلة المعتمدة: Gain Rate = (POST - PRE) / max(1, 100 - PRE) × 100 مع معالجة الصفر كخط أساس والحالات الكاملة.
            </div>
          </div>

          {/* Satisfaction Evaluation Section */}
          <div style={{ background: 'var(--admin-card-bg)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--admin-border)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem', color: 'var(--admin-text-primary)' }}>
              تقييم رضا المتدربين عن البرنامج
            </h4>
            {report.metrics.satisfactionResponseCount === 0 ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا توجد استجابات تقييم رضا مسجلة حتى الآن</div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Star size={20} fill="#F59E0B" color="#F59E0B" />
                  <span style={{ fontSize: '1.3rem', fontWeight: 800 }}>{report.metrics.averageSatisfactionOverall} / 5</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    (بناءً على {report.metrics.satisfactionResponseCount} استجابة)
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
                  <div>المحتوى التدريبي: <strong>{report.metrics.averageSatisfactionContent || '-'}</strong>/5</div>
                  <div>أداء المدرب: <strong>{report.metrics.averageSatisfactionTrainer || '-'}</strong>/5</div>
                  <div>تنظيم البرنامج: <strong>{report.metrics.averageSatisfactionOrganization || '-'}</strong>/5</div>
                  <div>الفائدة العملية: <strong>{report.metrics.averageSatisfactionUsefulness || '-'}</strong>/5</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </AdminModal>
  );
}
