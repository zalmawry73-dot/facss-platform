'use client';

import React, { useState } from 'react';
import { Plus, Edit2, X, Search, Filter, AlertCircle, CheckCircle2, Archive, Globe, Lock, BookOpen } from 'lucide-react';

interface Category {
  id: string;
  titleAr: string;
  titleEn: string;
}

interface PublicationItem {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
  author: string;
  categoryId: string;
  visibility: string;
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  publicationDate: string;
  category: { id: string; titleAr: string };
}

interface Props {
  initialPublications: PublicationItem[];
  categories: Category[];
}

export default function ResearchManager({ initialPublications, categories }: Props) {
  const [publications, setPublications] = useState<PublicationItem[]>(initialPublications);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPub, setEditingPub] = useState<PublicationItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    summaryAr: '',
    summaryEn: '',
    contentAr: '',
    contentEn: '',
    author: 'وحدة التحليل والتقييم الميداني — مركز عدن الدولي للسلامة والدراسات الميدانية',
    categoryId: categories[0]?.id || '',
    visibility: 'PUBLIC',
    status: 'PUBLISHED',
    isFeatured: false,
  });

  const openCreateModal = () => {
    setEditingPub(null);
    setForm({
      titleAr: '',
      titleEn: '',
      summaryAr: '',
      summaryEn: '',
      contentAr: '',
      contentEn: '',
      author: 'وحدة التحليل والتقييم الميداني — مركز عدن الدولي للسلامة والدراسات الميدانية',
      categoryId: categories[0]?.id || '',
      visibility: 'PUBLIC',
      status: 'PUBLISHED',
      isFeatured: false,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pub: PublicationItem) => {
    setEditingPub(pub);
    setForm({
      titleAr: pub.titleAr,
      titleEn: pub.titleEn,
      summaryAr: pub.summaryAr,
      summaryEn: pub.summaryEn,
      contentAr: pub.contentAr,
      contentEn: pub.contentEn,
      author: pub.author,
      categoryId: pub.categoryId,
      visibility: pub.visibility,
      status: pub.status || 'PUBLISHED',
      isFeatured: pub.isFeatured,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const url = editingPub ? `/api/admin/research/${editingPub.id}` : '/api/admin/research';
      const method = editingPub ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'فشلت العملية، يرجى مراجعة الحقول المطلوبة');
      }

      if (editingPub) {
        setPublications((prev) =>
          prev.map((p) => (p.id === editingPub.id ? { ...data.publication, viewsCount: p.viewsCount } : p))
        );
        setFeedback({ type: 'success', message: `تم تحديث الدراسة [${data.publication.titleAr}] بنجاح` });
      } else {
        setPublications((prev) => [data.publication, ...prev]);
        setFeedback({ type: 'success', message: `تم نشر الدراسة [${data.publication.titleAr}] بنجاح` });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (pubId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/research/${pubId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تغيير الحالة');

      setPublications((prev) =>
        prev.map((p) => (p.id === pubId ? { ...p, status: newStatus } : p))
      );
      setFeedback({ type: 'success', message: `تم تحديث حالة الدراسة إلى [${newStatus}]` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const filtered = publications.filter((p) => {
    const matchesSearch =
      p.titleAr.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (p.status || 'PUBLISHED') === statusFilter;
    const matchesVisibility = visibilityFilter === 'ALL' || p.visibility === visibilityFilter;
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  return (
    <div>
      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: '#FFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={20} color="#22c55e" /> : <AlertCircle size={20} color="#ef4444" />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header & Controls Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              إدارة الدراسات الأمنية والتقارير الاستراتيجية
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              إعداد ونشر الأوراق البحثية، تحديد درجات السرية، وإدارة دورة النشر والأرشفة
            </span>
          </div>

          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={openCreateModal}
          >
            <Plus size={16} />
            <span>نشر دراسة جديدة</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="بحث بعنوان الدراسة أو اسم الباحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--color-gold)" />
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="ALL">جميع الحالات</option>
              <option value="PUBLISHED">منشور (PUBLISHED)</option>
              <option value="DRAFT">مسودة (DRAFT)</option>
              <option value="ARCHIVED">مؤرشف (ARCHIVED)</option>
            </select>

            <select
              className="form-control"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="ALL">جميع مستويات الرؤية</option>
              <option value="PUBLIC">متاح للعموم (PUBLIC)</option>
              <option value="CLIENT_ONLY">حصري للعملاء (CLIENT_ONLY)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Publications Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>لم يتم العثور على أبحاث أو دراسات مطابقة لمعايير البحث.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>عنوان الدراسة</th>
                  <th>التصنيف</th>
                  <th>الباحث / المؤلف</th>
                  <th>الرؤية (Visibility)</th>
                  <th>حالة النشر</th>
                  <th>المشاهدات</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((pub) => (
                  <tr key={pub.id}>
                    <td style={{ fontWeight: 700, color: '#FFF', maxWidth: '280px' }}>
                      <div>{pub.titleAr}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{pub.titleEn}</div>
                    </td>
                    <td>{pub.category?.titleAr || 'دراسات عامة'}</td>
                    <td style={{ fontSize: '0.85rem' }}>{pub.author}</td>
                    <td>
                      {pub.visibility === 'PUBLIC' ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} />
                          <span>عام</span>
                        </span>
                      ) : (
                        <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={12} />
                          <span>حصري للعملاء</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <select
                        value={pub.status || 'PUBLISHED'}
                        onChange={(e) => handleStatusChange(pub.id, e.target.value)}
                        style={{
                          background: 'rgba(11,37,24,0.7)',
                          color: '#FFF',
                          border: '1px solid rgba(197,155,39,0.3)',
                          borderRadius: '4px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="PUBLISHED">منشور (PUBLISHED)</option>
                        <option value="DRAFT">مسودة (DRAFT)</option>
                        <option value="ARCHIVED">مؤرشف (ARCHIVED)</option>
                      </select>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--color-gold-light)' }}>
                        {pub.viewsCount || 0}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openEditModal(pub)}
                        title="تعديل الدراسة"
                      >
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="facss-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="card facss-modal-content"
            style={{
              maxWidth: '740px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--color-gold)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                {editingPub ? 'تعديل الدراسة الاستراتيجية' : 'إضافة دراسة استراتيجية جديدة'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="facss-form-grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">عنوان الدراسة (بالعربية) *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.titleAr}
                    onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                    placeholder="مثال: تحليل التهديدات الأمنية للموانئ البحرية"
                  />
                </div>

                <div>
                  <label className="form-label">العنوان (بالإنجليزية) *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    placeholder="e.g. Maritime Ports Security Threat Analysis"
                  />
                </div>
              </div>

              <div className="facss-form-grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">تصنيف البحث *</label>
                  <select
                    className="form-control"
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.titleAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">المؤلف / الباحث *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                  />
                </div>
              </div>

              <div className="facss-form-grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">مستوى الرؤية والسرية *</label>
                  <select
                    className="form-control"
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  >
                    <option value="PUBLIC">متاح للعموم (PUBLIC)</option>
                    <option value="CLIENT_ONLY">حصري للعملاء المصرح لهم (CLIENT_ONLY)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">حالة النشر *</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="PUBLISHED">نشر فوري (PUBLISHED)</option>
                    <option value="DRAFT">حفظ كمسودة (DRAFT)</option>
                    <option value="ARCHIVED">مؤرشف (ARCHIVED)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">الملخص التنفيذي (بالعربية) *</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  value={form.summaryAr}
                  onChange={(e) => setForm({ ...form, summaryAr: e.target.value })}
                  placeholder="ملخص يوضح أبعاد الدراسة وأهم الخلاصات الاستراتيجية..."
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">الملخص بالإنجليزية *</label>
                <textarea
                  className="form-control"
                  rows={2}
                  required
                  value={form.summaryEn}
                  onChange={(e) => setForm({ ...form, summaryEn: e.target.value })}
                  placeholder="Executive summary in English..."
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">نص ومحتوى الدراسة (بالعربية) *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  required
                  value={form.contentAr}
                  onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
                  placeholder="المحتوى الكامل للدراسة..."
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">المحتوى بالإنجليزية *</label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  value={form.contentEn}
                  onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                  placeholder="Full text content in English..."
                />
              </div>

              {/* Secure note regarding PDF file upload (Deferred to Phase 2C Storage) */}
              <div
                style={{
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  borderRadius: '6px',
                  background: 'rgba(197, 155, 39, 0.1)',
                  borderInlineStart: '4px solid var(--color-gold)',
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                }}
              >
                ملاحظة أمنية: رفع ملفات PDF المستندية مؤجل لمرحلة نظام التخزين المؤمن (Storage Phase 2C) لمنع رفع ملفات غير مفحوصة. يتم نشر نصوص وملخصات الدراسات مباشرة عبر المنصة.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-gold btn-sm"
                  disabled={submitting}
                >
                  {submitting ? 'جاري الحفظ...' : editingPub ? 'حفظ التعديلات' : 'نشر الدراسة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
