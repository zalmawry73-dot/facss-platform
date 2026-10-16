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
import { useAdminT } from '@/lib/admin-i18n';

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
  titleEn?: string | null;
}

interface Props {
  courses: CourseOption[];
}

export default function TrainersManager({ courses }: Props) {
  const { tx, isAr, locale } = useAdminT();
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
      setFeedback({ type: 'error', message: err.message || tx('فشل تحميل قائمة المدربين') });
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
      if (!res.ok) throw new Error(data.error || tx('فشل حفظ بيانات المدرب'));

      setFeedback({ type: 'success', message: tx('تم حفظ بيانات المدرب بنجاح') });
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
      if (!res.ok) throw new Error(data.error || tx('فشل تحديث حالة المدرب'));
      setFeedback({
        type: 'success',
        message: tx('تم تحديث حالة المدرب بنجاح'),
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
      if (!res.ok) throw new Error(data.error || tx('فشل تكليف المدرب بالدورة'));

      setFeedback({ type: 'success', message: tx('تم تكليف المدرب بالدورة بنجاح') });
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
      if (!res.ok) throw new Error(data.error || tx('فشل رفع الوثيقة'));

      setFeedback({ type: 'success', message: tx('تم رفع وثيقة المؤهل/الاعتماد بنجاح') });
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
      (t.fullNameEn && t.fullNameEn.toLowerCase().includes(search.toLowerCase())) ||
      t.professionalTitleAr.toLowerCase().includes(search.toLowerCase()) ||
      (t.professionalTitleEn && t.professionalTitleEn.toLowerCase().includes(search.toLowerCase())) ||
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
              {tx("سجل المدربين والخبراء المعتمدين (Trainer Registry)")}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {tx("إدارة الخبراء والمدربين، مؤهلاتهم، واعتماداتهم، وتكليفهم بالدورات التدريبية")}
            </span>
          </div>
          <AdminButton
            variant="primary"
            size="md"
            icon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            {tx("إضافة مدرب جديد")}
          </AdminButton>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', insetInlineEnd: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder={tx("البحث بالاسم، المسمى المهني، أو التخصص...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingInlineEnd: '2.5rem' }}
            />
          </div>
          <select
            className="form-select"
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">{tx("جميع الحالات")}</option>
            <option value="ACTIVE">{tx("المدربون النشطون")}</option>
            <option value="INACTIVE">{tx("غير النشطين (معطل)")}</option>
          </select>
        </div>
      </div>

      {/* Trainers Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {tx("جاري تحميل سجل المدربين...")}
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            {tx("لا يوجد مدربون مطابقون لخيارات البحث")}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{tx("الاسم واللقب المهني")}</th>
                  <th>{tx("التخصصات")}</th>
                  <th>{tx("بيانات الاتصال")}</th>
                  <th>{tx("الدورات المكلف بها")}</th>
                  <th>{tx("الوثائق والمؤهلات")}</th>
                  <th>{tx("الحالة")}</th>
                  <th>{tx("الإجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        {isAr ? t.fullNameAr : (t.fullNameEn || t.fullNameAr)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-gold)' }}>
                        {isAr ? t.professionalTitleAr : (t.professionalTitleEn || t.professionalTitleAr)}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                        {t.specializations || tx("غير محدد")}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem' }}>{t.email || '-'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.phone || '-'}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#3B82F620', color: '#3B82F6' }}>
                        {t.courseAssignments?.length || 0} {tx("دورة")}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#10B98120', color: '#10B981' }}>
                        {t.documents?.length || 0} {tx("وثيقة")}
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
                        {t.isActive ? tx("نشط") : tx("معطل")}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={<Edit2 size={13} />}
                          onClick={() => openEditModal(t)}
                          title={tx("تعديل بيانات المدرب")}
                        />
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={<BookOpen size={13} />}
                          onClick={() => {
                            setAssignModalTrainer(t);
                            setSelectedCourseId(courses[0]?.id || '');
                          }}
                          title={tx("تكليف بدورة تدريبية")}
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
                          title={tx("رفع وثيقة اعتماد")}
                        />
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={t.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          onClick={() => toggleTrainerStatus(t)}
                          title={t.isActive ? tx("تعطيل الحساب") : tx("تفعيل الحساب")}
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
          title={editingTrainer ? tx("تعديل بيانات المدرب") : tx("إضافة مدرب جديد لسجل الخبراء")}
        >
          <form onSubmit={handleSaveTrainer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label={tx("الاسم الكامل بالعربية *")}
              value={form.fullNameAr}
              onChange={(e) => setForm({ ...form, fullNameAr: e.target.value })}
              required
            />
            <AdminInput
              label={tx("المسمى المهني بالعربية (مثال: خبير الأمن والسلامة الميدانية) *")}
              value={form.professionalTitleAr}
              onChange={(e) => setForm({ ...form, professionalTitleAr: e.target.value })}
              required
            />
            <AdminInput
              label={tx("مجالات التخصص (مفصولة بفواصل)")}
              value={form.specializations}
              onChange={(e) => setForm({ ...form, specializations: e.target.value })}
              placeholder={tx("الاستجابة للطوارئ، السلامة المهنية، مكافحة الحرائق...")}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <AdminInput
                label={tx("البريد الإلكتروني المهني")}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <AdminInput
                label={tx("رقم الهاتف")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setIsTrainerModalOpen(false)}>
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={submitting}>
                {submitting ? tx("جاري الحفظ...") : (editingTrainer ? tx("تحديث بيانات المدرب") : tx("حفظ بيانات المدرب"))}
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
          title={tx("تكليف المدرب [{0}] بدورة تدريبية", isAr ? assignModalTrainer.fullNameAr : (assignModalTrainer.fullNameEn || assignModalTrainer.fullNameAr))}
        >
          <form onSubmit={handleAssignCourse} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>{tx("اختر الدورة التدريبية *")}</label>
              <select
                className="form-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                required
              >
                <option value="">{tx("-- اختر الدورة --")}</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAr ? c.titleAr : (c.titleEn || c.titleAr)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>{tx("صفة التكليف *")}</label>
              <select
                className="form-select"
                value={assignRole}
                onChange={(e) => setAssignRole(e.target.value)}
              >
                <option value="LEAD_TRAINER">{tx("المدرب الرئيسي (Lead Trainer)")}</option>
                <option value="ASSISTANT_TRAINER">{tx("مدرب مساعد (Assistant Trainer)")}</option>
                <option value="GUEST_LECTURER">{tx("محاضر زائر / خبير ضيف")}</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setAssignModalTrainer(null)}>
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={assigning || !selectedCourseId}>
                {assigning ? tx("جاري التكليف...") : tx("تأكيد التكليف بالدورة")}
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
          title={tx("رفع وثيقة اعتماد للمدرب [{0}]", isAr ? docModalTrainer.fullNameAr : (docModalTrainer.fullNameEn || docModalTrainer.fullNameAr))}
        >
          <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label={tx("عنوان الوثيقة أو المؤهل *")}
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder={tx("شهادة المدرب المعتمد TOT، دبلوم السلامة المهنية...")}
              required
            />
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>{tx("نوع الوثيقة *")}</label>
              <select
                className="form-select"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="CERTIFICATION">{tx("شهادة تدريبية أو احترافية (Certification)")}</option>
                <option value="ACCREDITATION">{tx("اعتماد مهني (Accreditation)")}</option>
                <option value="DEGREE">{tx("مؤهل أكاديمي (Degree)")}</option>
                <option value="CV">{tx("السيرة الذاتية المفصلة (CV)")}</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>{tx("الملف (PDF أو Word أو صورة) *")}</label>
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
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={uploadingDoc || !docFile || !docTitle}>
                {uploadingDoc ? tx("جاري الرفع...") : tx("رفع وحفظ الوثيقة")}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
