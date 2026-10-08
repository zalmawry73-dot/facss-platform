'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  BookOpen,
} from 'lucide-react';
import {
  AdminButton,
  AdminModal,
  AdminInput,
  AdminTextarea,
  AdminAlert,
} from '@/components/admin/ui';

interface TnaItem {
  id: string;
  referenceNumber: string;
  title: string;
  targetAudience: string;
  participantCount: number;
  requestedTopics: string;
  currentCompetency: string;
  desiredCompetency: string;
  operationalContext?: string | null;
  recommendations?: string | null;
  assessmentDate: string;
  status: string;
  client?: { id: string; fullName: string; organization?: string | null };
  course?: { id: string; titleAr: string; status: string } | null;
  createdBy?: { fullName: string };
}

interface CourseOption {
  id: string;
  titleAr: string;
}

interface Props {
  courses: CourseOption[];
}

const TNA_STATUS_COLORS: Record<string, string> = {
  DRAFT: '#64748B',
  SUBMITTED: '#F59E0B',
  REVIEWED: '#3B82F6',
  APPROVED: '#10B981',
  IMPLEMENTED: '#22C55E',
};

const TNA_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مقدم للدراسة',
  REVIEWED: 'تمت المراجعة',
  APPROVED: 'معتمد للتنفيذ',
  IMPLEMENTED: 'تم تنفيذ البرنامج',
};

export default function TnaManager({ courses }: Props) {
  const [assessments, setAssessments] = useState<TnaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    targetAudience: '',
    participantCount: 10,
    requestedTopics: '',
    currentCompetency: '',
    desiredCompetency: '',
    operationalContext: '',
    recommendations: '',
    courseId: '',
  });

  // Edit / Review Modal
  const [editingTna, setEditingTna] = useState<TnaItem | null>(null);
  const [editStatus, setEditStatus] = useState('SUBMITTED');
  const [editRecommendations, setEditRecommendations] = useState('');
  const [editCourseId, setEditCourseId] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadTnas();
  }, []);

  async function loadTnas() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/training/tna');
      const data = await res.json();
      if (data.success) {
        setAssessments(data.assessments);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل تحميل تقييمات الاحتياج' });
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/training/tna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ تقييم الاحتياج');

      setFeedback({ type: 'success', message: 'تم حفظ تقييم الاحتياج التدريبي بنجاح' });
      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        targetAudience: '',
        participantCount: 10,
        requestedTopics: '',
        currentCompetency: '',
        desiredCompetency: '',
        operationalContext: '',
        recommendations: '',
        courseId: '',
      });
      await loadTnas();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (t: TnaItem) => {
    setEditingTna(t);
    setEditStatus(t.status);
    setEditRecommendations(t.recommendations || '');
    setEditCourseId(t.course?.id || '');
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTna) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/training/tna/${editingTna.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          recommendations: editRecommendations,
          courseId: editCourseId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث التقييم');

      setFeedback({ type: 'success', message: 'تم تحديث حالة وتوصيات تقييم الاحتياج بنجاح' });
      setEditingTna(null);
      await loadTnas();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredTnas = assessments.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.targetAudience.toLowerCase().includes(search.toLowerCase()) ||
      (t.client && t.client.fullName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {feedback && (
        <div style={{ marginBottom: '1.25rem' }}>
          <AdminAlert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
              تقييم الاحتياجات التدريبية (Training Needs Assessment - TNA)
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              تحليل الفجوات المهارية والكفاءات المستهدفة للمؤسسات والشركاء وتحويلها إلى برامج تدريبية تنفيذية
            </span>
          </div>
          <AdminButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={() => setIsCreateOpen(true)}
          >
            إنشاء تقييم احتياج جديد
          </AdminButton>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="البحث بالعنوان، الكود المرجعي، أو الجهة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
          </div>
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="ALL">جميع الحالات</option>
            <option value="SUBMITTED">مقدم للدراسة</option>
            <option value="REVIEWED">تمت المراجعة</option>
            <option value="APPROVED">معتمد للتنفيذ</option>
            <option value="IMPLEMENTED">تم تنفيذ البرنامج</option>
          </select>
        </div>
      </div>

      {/* TNA Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            جاري تحميل سجل الاحتياجات التدريبية...
          </div>
        ) : filteredTnas.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            لا توجد تقييمات احتياج تدريبي مطابقة
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الرقم المرجعي والعنوان</th>
                  <th>الجهة المستفيدة</th>
                  <th>الفئة المستهدفة والعدد</th>
                  <th>المواضيع والكفاءات</th>
                  <th>الدورة المرتبطة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTnas.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>{t.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-gold)' }}>{t.referenceNumber}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{t.client?.fullName || 'طلب داخلي / عام'}</div>
                      {t.client?.organization && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.client.organization}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{t.targetAudience}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t.participantCount} مشارك
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.requestedTopics}
                      </div>
                    </td>
                    <td>
                      {t.course ? (
                        <span className="badge" style={{ background: '#22C55E20', color: '#22C55E' }}>
                          {t.course.titleAr}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>لم يتم الربط بعد</span>
                      )}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: `${TNA_STATUS_COLORS[t.status] || '#666'}20`,
                          color: TNA_STATUS_COLORS[t.status] || '#FFF',
                        }}
                      >
                        {TNA_STATUS_LABELS[t.status] || t.status}
                      </span>
                    </td>
                    <td>
                      <AdminButton
                        variant="outline"
                        size="sm"
                        icon={<Edit2 size={13} />}
                        onClick={() => openReviewModal(t)}
                        title="مراجعة التقييم وتحديث الحالة"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create TNA Modal */}
      {isCreateOpen && (
        <AdminModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="إنشاء تقييم احتياج تدريبي (TNA)"
        >
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label="عنوان التقييم / البرنامج المطلوب *"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="تقييم احتياجات السلامة الميدانية لفرق الاستجابة السريعة..."
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <AdminInput
                label="الفئة المستهدفة *"
                value={createForm.targetAudience}
                onChange={(e) => setCreateForm({ ...createForm, targetAudience: e.target.value })}
                placeholder="ضباط الأمن، فرق الحراسة، مسؤولو السلامة..."
                required
              />
              <AdminInput
                label="العدد المتوقع للمشاركين"
                type="number"
                value={String(createForm.participantCount)}
                onChange={(e) => setCreateForm({ ...createForm, participantCount: Number(e.target.value) || 1 })}
                required
              />
            </div>
            <AdminTextarea
              label="المهارات والمواضيع التدريبية المطلوبة *"
              value={createForm.requestedTopics}
              onChange={(e) => setCreateForm({ ...createForm, requestedTopics: e.target.value })}
              rows={2}
              required
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <AdminTextarea
                label="مستوى الكفاءة الحالي (Current Competency) *"
                value={createForm.currentCompetency}
                onChange={(e) => setCreateForm({ ...createForm, currentCompetency: e.target.value })}
                rows={2}
                required
              />
              <AdminTextarea
                label="مستوى الكفاءة المستهدف (Desired Competency) *"
                value={createForm.desiredCompetency}
                onChange={(e) => setCreateForm({ ...createForm, desiredCompetency: e.target.value })}
                rows={2}
                required
              />
            </div>
            <AdminTextarea
              label="السياق التشغيلي والتحديات الميدانية (اختياري)"
              value={createForm.operationalContext}
              onChange={(e) => setCreateForm({ ...createForm, operationalContext: e.target.value })}
              rows={2}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setIsCreateOpen(false)}>
                إلغاء
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={submitting}>
                {submitting ? 'جاري الحفظ...' : 'حفظ تقييم الاحتياج'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Review / Link Modal */}
      {editingTna && (
        <AdminModal
          isOpen={Boolean(editingTna)}
          onClose={() => setEditingTna(null)}
          title={`مراجعة واعتماد تقييم الاحتياج [${editingTna.referenceNumber}]`}
        >
          <form onSubmit={handleSaveReview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'var(--admin-card-bg)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
              <strong>العنوان:</strong> {editingTna.title}
              <br />
              <strong>المواضيع:</strong> {editingTna.requestedTopics}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>حالة التقييم *</label>
              <select
                className="form-select"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="SUBMITTED">مقدم للدراسة (Submitted)</option>
                <option value="REVIEWED">تمت المراجعة والتحليل (Reviewed)</option>
                <option value="APPROVED">معتمد للتنفيذ (Approved)</option>
                <option value="IMPLEMENTED">تم تنفيذ البرنامج بالكامل (Implemented)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>ربط بدورة تدريبية معتمدة</label>
              <select
                className="form-select"
                value={editCourseId}
                onChange={(e) => setEditCourseId(e.target.value)}
              >
                <option value="">-- بدون ربط مباشر --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAr}
                  </option>
                ))}
              </select>
            </div>

            <AdminTextarea
              label="توصيات الإدارة التدريبية وخطة التنفيذ"
              value={editRecommendations}
              onChange={(e) => setEditRecommendations(e.target.value)}
              placeholder="يوصى بتنفيذ برنامج مكثف لمدة 3 أيام يتضمن محاكاة عملية..."
              rows={3}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setEditingTna(null)}>
                إلغاء
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={savingEdit}>
                {savingEdit ? 'جاري الحفظ...' : 'تأكيد التحديث'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
