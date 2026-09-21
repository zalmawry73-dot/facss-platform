'use client';

import React, { useState } from 'react';
import { Plus, Edit2, X, Check, Search, Filter, AlertCircle, Clock, MapPin, Users, CheckCircle2, Award, UserCheck, UserX, Loader2, ShieldAlert } from 'lucide-react';

interface Category {
  id: string;
  titleAr: string;
  titleEn: string;
}

interface CourseItem {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  descriptionAr: string;
  descriptionEn: string;
  trainerName: string;
  startDate?: string | null;
  endDate?: string | null;
  duration: string;
  location: string;
  capacity: number;
  status: string;
  categoryId: string;
  hasCertificate: boolean;
  category: { id: string; titleAr: string };
  registrationsCount?: number;
}

interface RegistrationItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  courseId: string;
  certificate?: {
    id: string;
    certificateNumber: string;
    isRevoked: boolean;
  } | null;
}

interface Props {
  initialCourses: CourseItem[];
  categories: Category[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  REVIEWING: 'تحت المراجعة',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  WAITLIST: 'قائمة انتظار',
  COMPLETED: 'أتم التدريب',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  REVIEWING: '#3B82F6',
  ACCEPTED: '#22C55E',
  REJECTED: '#EF4444',
  WAITLIST: '#A855F7',
  COMPLETED: '#10B981',
};

export default function TrainingManager({ initialCourses, categories }: Props) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Registration Management State
  const [activeTab, setActiveTab] = useState<'courses' | 'registrations'>('courses');
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const [regCourseFilter, setRegCourseFilter] = useState('ALL');
  const [regStatusFilter, setRegStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    trainerName: '',
    duration: '20 ساعة تدريبية (5 أيام)',
    location: 'قاعة مركز عدن للتدريب الأمني - خور مكسر',
    capacity: 25,
    status: 'OPEN',
    categoryId: categories[0]?.id || '',
    startDate: '',
    endDate: '',
    hasCertificate: true,
  });

  // ============================
  // COURSE MANAGEMENT
  // ============================
  const openCreateModal = () => {
    setEditingCourse(null);
    setForm({
      titleAr: '', titleEn: '', descriptionAr: '', descriptionEn: '',
      trainerName: '',
      duration: '20 ساعة تدريبية (5 أيام)',
      location: 'قاعة مركز عدن للتدريب الأمني - خور مكسر',
      capacity: 25, status: 'OPEN', categoryId: categories[0]?.id || '',
      startDate: '', endDate: '', hasCertificate: true,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: CourseItem) => {
    setEditingCourse(c);
    setForm({
      titleAr: c.titleAr, titleEn: c.titleEn,
      descriptionAr: c.descriptionAr, descriptionEn: c.descriptionEn,
      trainerName: c.trainerName, duration: c.duration,
      location: c.location, capacity: c.capacity, status: c.status,
      categoryId: c.categoryId,
      startDate: c.startDate ? c.startDate.substring(0, 10) : '',
      endDate: c.endDate ? c.endDate.substring(0, 10) : '',
      hasCertificate: c.hasCertificate,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const url = editingCourse ? `/api/admin/training/${editingCourse.id}` : '/api/admin/training';
      const method = editingCourse ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشلت العملية');
      if (editingCourse) {
        setCourses((prev) => prev.map((c) => (c.id === editingCourse.id ? { ...data.course, registrationsCount: c.registrationsCount } : c)));
        setFeedback({ type: 'success', message: `تم تحديث البرنامج [${data.course.titleAr}] بنجاح` });
      } else {
        setCourses((prev) => [{ ...data.course, registrationsCount: 0 }, ...prev]);
        setFeedback({ type: 'success', message: `تم إنشاء البرنامج [${data.course.titleAr}] بنجاح` });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (courseId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/training/${courseId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status: newStatus } : c)));
      setFeedback({ type: 'success', message: `تم تحديث حالة الدورة إلى [${newStatus}]` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // ============================
  // REGISTRATION MANAGEMENT
  // ============================
  const loadRegistrations = async () => {
    setRegLoading(true);
    try {
      const res = await fetch('/api/admin/training/registrations');
      const data = await res.json();
      if (data.success) {
        setRegistrations(data.registrations);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    } finally {
      setRegLoading(false);
    }
  };

  const handleTabChange = (tab: 'courses' | 'registrations') => {
    setActiveTab(tab);
    if (tab === 'registrations' && registrations.length === 0) {
      loadRegistrations();
    }
  };

  const handleRegistrationAction = async (regId: string, newStatus: string, adminNotes?: string) => {
    setActionLoading(regId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/training/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشلت العملية');
      setRegistrations((prev) =>
        prev.map((r) => (r.id === regId ? { ...r, status: newStatus } : r))
      );
      setFeedback({ type: 'success', message: data.message || `تم تحديث الحالة إلى [${newStatus}]` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleIssueCertificate = async (regId: string, grade?: string) => {
    setActionLoading(regId);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/training/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: regId, grade }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل إصدار الشهادة');
      setFeedback({ type: 'success', message: data.message || 'تم إصدار الشهادة بنجاح' });
      // Reload registrations to show certificate
      await loadRegistrations();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch = c.titleAr.toLowerCase().includes(search.toLowerCase()) ||
      c.trainerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredRegistrations = registrations.filter((r) => {
    const matchesCourse = regCourseFilter === 'ALL' || r.courseId === regCourseFilter;
    const matchesStatus = regStatusFilter === 'ALL' || r.status === regStatusFilter;
    return matchesCourse && matchesStatus;
  });

  return (
    <div>
      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem', marginBottom: '1.5rem', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: '#FFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={20} color="#22c55e" /> : <AlertCircle size={20} color="#ef4444" />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(197,155,39,0.25)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'courses' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => handleTabChange('courses')}
        >
          <Users size={16} />
          <span>إدارة الدورات</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === 'registrations' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => handleTabChange('registrations')}
        >
          <UserCheck size={16} />
          <span>طلبات التسجيل</span>
        </button>
      </div>

      {/* ============================
          TAB: COURSES MANAGEMENT
          ============================ */}
      {activeTab === 'courses' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  إدارة برامج التدريب والتأهيل الأمني
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  إضافة الدورات، تحديث المناهج والمحاضرين، وإدارة سعة المقاعد
                </span>
              </div>
              <button type="button" className="btn btn-gold btn-sm" onClick={openCreateModal}>
                <Plus size={16} />
                <span>إضافة برنامج تدريبي جديد</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" placeholder="بحث باسم الدورة أو المحاضر..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingRight: '2.5rem' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} color="var(--color-gold)" />
                <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ minWidth: '160px' }}>
                  <option value="ALL">جميع الحالات</option>
                  <option value="OPEN">مفتوح (OPEN)</option>
                  <option value="DRAFT">مسودة (DRAFT)</option>
                  <option value="FULL">مكتمل (FULL)</option>
                  <option value="ONGOING">جاري (ONGOING)</option>
                  <option value="COMPLETED">منتهي (COMPLETED)</option>
                  <option value="CANCELLED">ملغي (CANCELLED)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {filteredCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>لم يتم العثور على برامج تدريبية مطابقة.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>اسم البرنامج التدريبي</th>
                      <th>التصنيف</th>
                      <th>المحاضر</th>
                      <th>المدة</th>
                      <th>السعة</th>
                      <th>المسجلين</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCourses.map((c) => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 700, color: '#FFF' }}>
                          <div>{c.titleAr}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{c.titleEn}</div>
                        </td>
                        <td>{c.category?.titleAr || 'عام'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{c.trainerName}</td>
                        <td>{c.duration}</td>
                        <td>{c.capacity} مقعد</td>
                        <td><span className="badge badge-gold">{c.registrationsCount || 0}</span></td>
                        <td>
                          <select
                            value={c.status} onChange={(e) => handleQuickStatus(c.id, e.target.value)}
                            style={{ background: 'rgba(11,37,24,0.7)', color: '#FFF', border: '1px solid rgba(197,155,39,0.3)', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}
                          >
                            <option value="OPEN">مفتوح (OPEN)</option>
                            <option value="DRAFT">مسودة (DRAFT)</option>
                            <option value="FULL">مكتمل (FULL)</option>
                            <option value="ONGOING">جاري (ONGOING)</option>
                            <option value="COMPLETED">منتهي (COMPLETED)</option>
                            <option value="CANCELLED">ملغي (CANCELLED)</option>
                          </select>
                        </td>
                        <td>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => openEditModal(c)} title="تعديل تفاصيل البرنامج">
                            <Edit2 size={14} />
                            <span>تعديل</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================
          TAB: REGISTRATIONS MANAGEMENT
          ============================ */}
      {activeTab === 'registrations' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  إدارة طلبات التسجيل في الدورات التدريبية
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  مراجعة وقبول ورفض طلبات المتدربين وإصدار الشهادات
                </span>
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={loadRegistrations} disabled={regLoading}>
                {regLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
                <span>تحديث القائمة</span>
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <select className="form-control" value={regCourseFilter} onChange={(e) => setRegCourseFilter(e.target.value)} style={{ minWidth: '200px' }}>
                <option value="ALL">جميع الدورات</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.titleAr}</option>
                ))}
              </select>
              <select className="form-control" value={regStatusFilter} onChange={(e) => setRegStatusFilter(e.target.value)} style={{ minWidth: '160px' }}>
                <option value="ALL">جميع الحالات</option>
                <option value="PENDING">قيد المراجعة</option>
                <option value="REVIEWING">تحت المراجعة</option>
                <option value="ACCEPTED">مقبول</option>
                <option value="REJECTED">مرفوض</option>
                <option value="WAITLIST">قائمة انتظار</option>
                <option value="COMPLETED">أتم التدريب</option>
              </select>
            </div>
          </div>

          <div className="card">
            {regLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader2 size={32} style={{ color: 'var(--color-gold-light)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>جارٍ تحميل طلبات التسجيل...</p>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <UserCheck size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>لا توجد طلبات تسجيل مطابقة لمعايير البحث.</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>اسم المتدرب</th>
                      <th>البريد</th>
                      <th>الهاتف</th>
                      <th>الحالة</th>
                      <th>الشهادة</th>
                      <th>التاريخ</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr key={reg.id}>
                        <td style={{ fontWeight: 700, color: '#FFF' }}>{reg.fullName}</td>
                        <td style={{ fontSize: '0.82rem' }}>{reg.email}</td>
                        <td style={{ fontSize: '0.82rem' }}>{reg.phone}</td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              background: `${STATUS_COLORS[reg.status] || '#6B7280'}22`,
                              color: STATUS_COLORS[reg.status] || '#6B7280',
                              border: `1px solid ${STATUS_COLORS[reg.status] || '#6B7280'}44`,
                            }}
                          >
                            {STATUS_LABELS[reg.status] || reg.status}
                          </span>
                        </td>
                        <td>
                          {reg.certificate ? (
                            <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                              {reg.certificate.certificateNumber}
                              {reg.certificate.isRevoked && ' (ملغاة)'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(reg.createdAt).toLocaleDateString('ar-YE')}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {/* Action buttons based on current status */}
                            {(reg.status === 'PENDING' || reg.status === 'REVIEWING' || reg.status === 'WAITLIST') && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid #22C55E44', color: '#22C55E', padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                                disabled={actionLoading === reg.id}
                                onClick={() => handleRegistrationAction(reg.id, 'ACCEPTED')}
                                title="قبول"
                              >
                                <UserCheck size={13} />
                                <span>قبول</span>
                              </button>
                            )}
                            {(reg.status === 'PENDING' || reg.status === 'REVIEWING' || reg.status === 'WAITLIST' || reg.status === 'ACCEPTED') && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #EF444444', color: '#EF4444', padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                                disabled={actionLoading === reg.id}
                                onClick={() => handleRegistrationAction(reg.id, 'REJECTED')}
                                title="رفض"
                              >
                                <UserX size={13} />
                                <span>رفض</span>
                              </button>
                            )}
                            {reg.status === 'ACCEPTED' && (
                              <button
                                type="button"
                                className="btn btn-sm"
                                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10B98144', color: '#10B981', padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                                disabled={actionLoading === reg.id}
                                onClick={() => handleRegistrationAction(reg.id, 'COMPLETED')}
                                title="إتمام التدريب"
                              >
                                <CheckCircle2 size={13} />
                                <span>إتمام</span>
                              </button>
                            )}
                            {reg.status === 'COMPLETED' && !reg.certificate && (
                              <button
                                type="button"
                                className="btn btn-gold btn-sm"
                                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                                disabled={actionLoading === reg.id}
                                onClick={() => handleIssueCertificate(reg.id)}
                                title="إصدار شهادة"
                              >
                                <Award size={13} />
                                <span>إصدار شهادة</span>
                              </button>
                            )}
                            {actionLoading === reg.id && (
                              <Loader2 size={16} style={{ color: 'var(--color-gold-light)', animation: 'spin 1s linear infinite' }} />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="facss-modal-overlay"
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000, padding: '1rem',
          }}
        >
          <div
            className="card facss-modal-content"
            style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-gold)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                {editingCourse ? 'تعديل البرنامج التدريبي' : 'إضافة برنامج تدريبي جديد'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="facss-form-grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">اسم البرنامج (بالعربية) *</label>
                  <input type="text" className="form-control" required value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} placeholder="مثال: دورة حماية المنشآت الحيوية" />
                </div>
                <div>
                  <label className="form-label">اسم البرنامج (بالإنجليزية) *</label>
                  <input type="text" className="form-control" required value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} placeholder="e.g. Critical Infrastructure Protection" />
                </div>
              </div>

              <div className="facss-form-grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">تصنيف البرنامج *</label>
                  <select className="form-control" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.titleAr}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">اسم المدرب / المحاضر *</label>
                  <input type="text" className="form-control" required value={form.trainerName} onChange={(e) => setForm({ ...form, trainerName: e.target.value })} placeholder="مثال: عقيد / ناصر سالم اليافعي" />
                </div>
              </div>

              <div className="facss-form-grid-3" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">المدة التدريبية *</label>
                  <input type="text" className="form-control" required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="5 أيام (25 ساعة)" />
                </div>
                <div>
                  <label className="form-label">سعة المقاعد *</label>
                  <input type="number" min="1" max="500" className="form-control" required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="form-label">الحالة *</label>
                  <select className="form-control" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="OPEN">مفتوح (OPEN)</option>
                    <option value="DRAFT">مسودة (DRAFT)</option>
                    <option value="FULL">مكتمل (FULL)</option>
                    <option value="ONGOING">جاري (ONGOING)</option>
                    <option value="COMPLETED">منتهي (COMPLETED)</option>
                    <option value="CANCELLED">ملغي (CANCELLED)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">مكان الانعقاد *</label>
                <input type="text" className="form-control" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>

              <div className="facss-form-grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">تاريخ البدء</label>
                  <input type="date" className="form-control" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">تاريخ الانتهاء</label>
                  <input type="date" className="form-control" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">الوصف التفصيلي (بالعربية) *</label>
                <textarea className="form-control" rows={3} required value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} placeholder="وصف أهداف البرنامج والمحاور الرئيسية..." />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">الوصف بالإنجليزية *</label>
                <textarea className="form-control" rows={2} required value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} placeholder="Course summary and objectives..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setIsModalOpen(false)} disabled={submitting}>إلغاء</button>
                <button type="submit" className="btn btn-gold btn-sm" disabled={submitting}>
                  {submitting ? 'جاري الحفظ...' : editingCourse ? 'حفظ التعديلات' : 'إنشاء الدورة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
