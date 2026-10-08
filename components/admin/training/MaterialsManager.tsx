'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Lock,
  Globe,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  AdminButton,
  AdminModal,
  AdminInput,
  AdminTextarea,
  AdminAlert,
} from '@/components/admin/ui';

interface Material {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  visibility: 'INTERNAL' | 'ENROLLED_TRAINEES' | 'PUBLIC';
  sortOrder: number;
  createdAt: string;
  uploadedBy?: { fullName: string; email: string };
}

interface CourseOption {
  id: string;
  titleAr: string;
  courseType?: string;
}

interface Props {
  courses: CourseOption[];
}

export default function MaterialsManager({ courses }: Props) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState('ENROLLED_TRAINEES');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (selectedCourseId) {
      loadMaterials(selectedCourseId);
    }
  }, [selectedCourseId]);

  async function loadMaterials(courseId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/training/${courseId}/materials`);
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'فشل تحميل المواد التدريبية' });
    } finally {
      setLoading(false);
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !selectedCourseId) return;
    setUploading(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('description', uploadDesc);
      formData.append('visibility', uploadVisibility);
      formData.append('file', uploadFile);

      const res = await fetch(`/api/admin/training/${selectedCourseId}/materials`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل رفع المادة التدريبية');

      setFeedback({ type: 'success', message: 'تم رفع المادة التدريبية بنجاح' });
      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadFile(null);
      await loadMaterials(selectedCourseId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف المادة التدريبية [${title}]؟`)) return;
    try {
      const res = await fetch(`/api/admin/training/materials/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'فشل حذف المادة التدريبية');

      setFeedback({ type: 'success', message: 'تم حذف المادة بنجاح' });
      await loadMaterials(selectedCourseId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getVisibilityBadge = (v: string) => {
    if (v === 'PUBLIC') {
      return (
        <span className="badge" style={{ background: '#22C55E20', color: '#22C55E', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={11} /> عامة للجميع
        </span>
      );
    }
    if (v === 'ENROLLED_TRAINEES') {
      return (
        <span className="badge" style={{ background: '#3B82F620', color: '#3B82F6', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <Users size={11} /> للمتدربين المسجلين
        </span>
      );
    }
    return (
      <span className="badge" style={{ background: '#F59E0B20', color: '#F59E0B', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        <Lock size={11} /> داخلية للمدربين
      </span>
    );
  };

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

      {/* Course Selector & Actions */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
              المواد والحقائب التدريبية (Training Materials & Content)
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              رفع وإدارة المستندات، العروض التقديمية، والحقائب التدريبية مع حماية الخصوصية ومستويات الصلاحية
            </span>
          </div>
          <AdminButton
            variant="primary"
            size="md"
            icon={<Upload size={16} />}
            onClick={() => setIsUploadOpen(true)}
            disabled={!selectedCourseId}
          >
            رفع مادة تدريبية جديدة
          </AdminButton>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>اختر البرنامج التدريبي:</label>
          <select
            className="form-select"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{ minWidth: '320px', maxWidth: '500px' }}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titleAr} {c.courseType === 'PRIVATE_CLIENT' ? '(دورة خاصة)' : '(دورة عامة)'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Materials Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            جاري تحميل المواد التدريبية...
          </div>
        ) : materials.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            لا توجد مواد تدريبية مرفوعة لهذه الدورة حتى الآن. يمكنك رفع أول حقيبة تدريبية الآن.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>عنوان المادة</th>
                  <th>اسم الملف والنوع</th>
                  <th>الحجم</th>
                  <th>مستوى الصلاحية</th>
                  <th>تاريخ الرفع</th>
                  <th>المسؤول</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>{m.title}</div>
                      {m.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.description}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', direction: 'ltr', textAlign: 'right' }}>
                        {m.fileName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.mimeType}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{formatSize(m.fileSize)}</span>
                    </td>
                    <td>{getVisibilityBadge(m.visibility)}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>
                        {new Date(m.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>{m.uploadedBy?.fullName || '-'}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <a
                          href={`/api/training/materials/${m.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline"
                          title="تحميل الملف"
                          style={{ padding: '4px 8px' }}
                        >
                          <Download size={13} />
                        </a>
                        <AdminButton
                          variant="outline"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          onClick={() => handleDelete(m.id, m.title)}
                          title="حذف المادة"
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

      {/* Upload Modal */}
      {isUploadOpen && (
        <AdminModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          title="رفع مادة / حقيبة تدريبية جديدة"
        >
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label="عنوان المادة التدريبية *"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="الحقيبة التدريبية الكاملة، العرض التقديمي للجلسة الأولى..."
              required
            />
            <AdminTextarea
              label="وصف المادة (اختياري)"
              value={uploadDesc}
              onChange={(e) => setUploadDesc(e.target.value)}
              rows={2}
            />
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>مستوى الرؤية والصلاحية *</label>
              <select
                className="form-select"
                value={uploadVisibility}
                onChange={(e) => setUploadVisibility(e.target.value)}
              >
                <option value="ENROLLED_TRAINEES">المتدربون المسجلون في الدورة فقط (Enrolled Trainees)</option>
                <option value="PUBLIC">عامة لجميع الزوار (Public Download)</option>
                <option value="INTERNAL">داخلية للمدربين والإدارة فقط (Internal Staff Only)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>الملف (PDF, Word, PPT, Excel, Images) *</label>
              <input
                type="file"
                className="form-control"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" size="md" onClick={() => setIsUploadOpen(false)}>
                إلغاء
              </AdminButton>
              <AdminButton variant="primary" size="md" type="submit" disabled={uploading || !uploadFile || !uploadTitle}>
                {uploading ? 'جاري الرفع...' : 'رفع وحفظ المادة'}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
