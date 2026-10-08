'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Award,
  BookOpen,
  Upload,
  UserX,
  UserCheck,
  Search,
  Filter,
} from 'lucide-react';
import {
  AdminButton,
  AdminModal,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminAlert,
} from '@/components/admin/ui';

interface Trainer {
  id: string;
  fullNameAr: string;
  fullNameEn?: string | null;
  professionalTitleAr: string;
  professionalTitleEn?: string | null;
  specializations?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  courseAssignments?: {
    id: string;
    role: string;
    course: { id: string; titleAr: string; status: string };
  }[];
  documents?: {
    id: string;
    title: string;
    documentType: string;
    verificationStatus: string;
  }[];
}

interface CourseOption {
  id: string;
  titleAr: string;
}

interface Props {
  courses: CourseOption[];
}

export default function TrainersManager({ courses }: Props) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState('ALL');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullNameAr: '',
    fullNameEn: '',
    professionalTitleAr: '',
    professionalTitleEn: '',
    specializations: '',
    bioAr: '',
    email: '',
    phone: '',
    isActive: true,
  });

  // Assign Course Modal
  const [assignModalTrainer, setAssignModalTrainer] = useState<Trainer | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignRole, setAssignRole] = useState('LEAD_TRAINER');
  const [assigning, setAssigning] = useState(false);

  // Upload Document Modal
  const [docModalTrainer, setDocModalTrainer] = useState<Trainer | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('CERTIFICATION');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    loadTrainers();
  }, []);

  async function loadTrainers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/training/trainers');
      const data = await res.json();
      if (data.success) {
        setTrainers(data.trainers);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل تحميل سجل المدربين' });
    } finally {
      setLoading(false);
    }
  }

  const openCreateModal = () => {
    setEditingTrainer(null);
    setForm({
      fullNameAr: '',
      fullNameEn: '',
      professionalTitleAr: '',
      professionalTitleEn: '',
      specializations: '',
      bioAr: '',
      email: '',
      phone: '',
      isActive: true,
    });
    setIsTrainerModalOpen(true);
  };

  const openEditModal = (t: Trainer) => {
    setEditingTrainer(t);
    setForm({
      fullNameAr: t.fullNameAr,
      fullNameEn: t.fullNameEn || '',
      professionalTitleAr: t.professionalTitleAr,
      professionalTitleEn: t.professionalTitleEn || '',
      specializations: t.specializations || '',
      bioAr: '',
      email: t.email || '',
      phone: t.phone || '',
      isActive: t.isActive,
    });
    setIsTrainerModalOpen(true);
  };

  const handleSaveTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const url = editingTrainer
        ? `/api/admin/training/trainers/${editingTrainer.id}`
        : '/api/admin/training/trainers';
      const method = editingTrainer ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حفظ بيانات المدرب');

      setFeedback({ type: 'success', message: 'تم حفظ بيانات المدرب بنجاح' });
      setIsTrainerModalOpen(false);
      await loadTrainers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTrainerStatus = async (t: Trainer) => {
    try {
      const res = await fetch(`/api/admin/training/trainers/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تحديث حالة المدرب');
      setFeedback({
        type: 'success',
        message: `تم ${!t.isActive ? 'تفعيل' : 'تعطيل'} حساب المدرب بنجاح`,
      });
      await loadTrainers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleAssignCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalTrainer || !selectedCourseId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/training/trainers/${assignModalTrainer.id}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId, role: assignRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل تكليف المدرب بالدورة');

      setFeedback({ type: 'success', message: 'تم تكليف المدرب بالدورة بنجاح' });
      setAssignModalTrainer(null);
      await loadTrainers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setAssigning(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docModalTrainer || !docFile) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', docTitle);
      formData.append('documentType', docType);
      formData.append('file', docFile);

      const res = await fetch(`/api/admin/training/trainers/${docModalTrainer.id}/documents`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل رفع وثيقة المدرب');

      setFeedback({ type: 'success', message: 'تم رفع وثيقة المؤهل/الاعتماد بنجاح' });
      setDocModalTrainer(null);
      setDocFile(null);
      setDocTitle('');
      await loadTrainers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setUploadingDoc(false);
    }
  };

  const filteredTrainers = trainers.filter((t) => {
    const matchesSearch =
      t.fullNameAr.toLowerCase().includes(search.toLowerCase()) ||
      t.professionalTitleAr.toLowerCase().includes(search.toLowerCase()) ||
      (t.specializations && t.specializations.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      filterActive === 'ALL' ||
      (filterActive === 'ACTIVE' && t.isActive) ||
      (filterActive === 'INACTIVE' && !t.isActive);

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

      {/* Header & Actions */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
              سجل المدربين والخبراء المعتمدين (Trainer Registry)
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              إدارة الخبراء والمدربين، مؤهلاتهم، واعتماداتهم، وتكليفهم بالدورات التدريبية
            </span>
          </div>
          <AdminButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            إضافة مدرب جديد
          </AdminButton>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="البحث بالاسم، المسمى المهني، أو التخصص..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
          </div>
          <select
            className="form-select"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">جميع الحالات</option>
            <option value="ACTIVE">المدربون النشطون</option>
            <option value="INACTIVE">غير النشطين (معطل)</option>
          </select>
        </div>
      </div>

      {/* Trainers Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            جاري تحميل سجل المدربين...
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            لا يوجد مدربون مطابقون لخيارات البحث
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الاسم واللقب المهني</th>
                  <th>التخصصات</th>
                  <th>بيانات الاتصال</th>
                  <th>الدورات المكلف بها</th>
                  <th>الوثائق والمؤهلات</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        {t.fullNameAr}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>
                        {t.professionalTitleAr}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                        {t.specializations || 'غير محدد'}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>{t.email || '-'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.phone || '-'}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#3B82F620', color: '#3B82F6' }}>
                        {t.courseAssignments?.length || 0} دورة
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#10B98120', color: '#10B981' }}>
                        {t.documents?.length || 0} وثيقة
                      </span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: t.isActive ? '#22C55E20' : '#EF444420',
                          color: t.isActive ? '#22C55E' : '#EF4444',
                        }}
                      >
                        {t.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={<Edit2 size={13} />}
                          onClick={() => openEditModal(t)}
                          title="تعديل بيانات المدرب"
                        />
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={<BookOpen size={13} />}
                          onClick={() => {
                            setAssignModalTrainer(t);
                            setSelectedCourseId(courses[0]?.id || '');
                          }}
                          title="تكليف بدورة تدريبية"
                        />
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={<Upload size={13} />}
                          onClick={() => {
                            setDocModalTrainer(t);
                            setDocTitle('');
                            setDocFile(null);
                          }}
                          title="رفع وثيقة اعتماد"
                        />
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={t.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          onClick={() => toggleTrainerStatus(t)}
                          title={t.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Trainer Modal */}
      {isTrainerModalOpen && (
        <AdminModal
          isOpen={isTrainerModalOpen}
          onClose={() => setIsTrainerModalOpen(false)}
          title={editingTrainer ? 'تعديل بيانات المدرب' : 'إضافة مدرب جديد لسجل الخبراء'}
        >
          <form onSubmit={handleSaveTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label="الاسم الكامل بالعربية *"
              value={form.fullNameAr}
              onChange={(e) => setForm({ ...form, fullNameAr: e.target.value })}
              required
            />
            <AdminInput
              label="المسمى المهني بالعربية (مثال: خبير الأمن والسلامة الميدانية) *"
              value={form.professionalTitleAr}
              onChange={(e) => setForm({ ...form, professionalTitleAr: e.target.value })}
              required
            />
            <AdminInput
              label="مجالات التخصص (مفصولة بفواصل)"
              value={form.specializations}
              onChange={(e) => setForm({ ...form, specializations: e.target.value })}
              placeholder="الاستجابة للطوارئ، السلامة المهنية، مكافحة الحرائق..."
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <AdminInput
                label="البريد الإلكتروني"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <AdminInput
                label="رقم الهاتف"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setIsTrainerModalOpen(false)}>
                إلغاء
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={submitting}>
                {submitting ? 'جاري الحفظ...' : 'حفظ بيانات المدرب'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Assign Course Modal */}
      {assignModalTrainer && (
        <AdminModal
          isOpen={Boolean(assignModalTrainer)}
          onClose={() => setAssignModalTrainer(null)}
          title={`تكليف المدرب [${assignModalTrainer.fullNameAr}] بدورة تدريبية`}
        >
          <form onSubmit={handleAssignCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>اختر الدورة التدريبية *</label>
              <select
                className="form-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
              >
                <option value="">-- اختر الدورة --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleAr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>صفة التكليف *</label>
              <select
                className="form-select"
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
              >
                <option value="LEAD_TRAINER">المدرب الرئيسي (Lead Trainer)</option>
                <option value="ASSISTANT_TRAINER">مدرب مساعد (Assistant Trainer)</option>
                <option value="GUEST_LECTURER">محاضر زائر / خبير ضيف</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setAssignModalTrainer(null)}>
                إلغاء
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={assigning || !selectedCourseId}>
                {assigning ? 'جاري التكليف...' : 'تأكيد التكليف بالدورة'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Upload Document Modal */}
      {docModalTrainer && (
        <AdminModal
          isOpen={Boolean(docModalTrainer)}
          onClose={() => setDocModalTrainer(null)}
          title={`رفع وثيقة اعتماد للمدرب [${docModalTrainer.fullNameAr}]`}
        >
          <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label="عنوان الوثيقة أو المؤهل *"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="شهادة المدرب المعتمد TOT، دبلوم السلامة المهنية..."
              required
            />
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>نوع الوثيقة *</label>
              <select
                className="form-select"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="CERTIFICATION">شهادة تدريبية أو احترافية (Certification)</option>
                <option value="ACCREDITATION">اعتماد مهني (Accreditation)</option>
                <option value="DEGREE">مؤهل أكاديمي (Degree)</option>
                <option value="CV">السيرة الذاتية المفصلة (CV)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>الملف (PDF أو Word أو صورة) *</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setDocModalTrainer(null)}>
                إلغاء
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={uploadingDoc || !docFile || !docTitle}>
                {uploadingDoc ? 'جاري الرفع...' : 'رفع وحفظ الوثيقة'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
