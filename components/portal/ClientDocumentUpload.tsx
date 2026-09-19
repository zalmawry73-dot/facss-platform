'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  requestId: string;
}

export default function ClientDocumentUpload({ requestId }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setErrorMessage(null);
      setSuccessMessage(null);

      // Client-side quick check
      const ext = selected.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'png', 'jpg', 'jpeg'].includes(ext || '')) {
        setErrorMessage('صيغة الملف غير مدعومة. الصيغ المسموحة حصراً: PDF, PNG, JPG.');
        setFile(null);
        return;
      }

      if (selected.size > 4.5 * 1024 * 1024) {
        setErrorMessage('حجم الملف يتجاوز الحد الأقصى المسموح به (4.5 ميجابايت).');
        setFile(null);
        return;
      }

      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('يرجى اختيار ملف لرفعه أولاً.');
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', 'CLIENT_ATTACHMENT');
      formData.append('visibility', 'CLIENT_VISIBLE');
      if (title.trim()) {
        formData.append('title', title.trim());
      }

      const res = await fetch(`/api/requests/${requestId}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage('تم رفع المستند وتأمينه بنجاح.');
        setFile(null);
        setTitle('');
        router.refresh();
      } else {
        setErrorMessage(data.error || 'حدث خطأ أثناء رفع المستند.');
      }
    } catch {
      setErrorMessage('فشل الاتصال بالخادم. يرجى إعادة المحاولة.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '1.2rem', background: 'rgba(5, 14, 9, 0.6)', borderRadius: '8px', border: '1px dashed rgba(197, 155, 39, 0.4)', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
        <UploadCloud size={20} style={{ color: 'var(--color-gold)' }} />
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', margin: 0 }}>
          إرفاق مستندات داعمة أو مخططات للمنشأة
        </h4>
      </div>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        يمكنك إرفاق وثائق التفويض، المخططات الهندسية، أو صور الموقع لمساعدة فريق العمليات. الصيغ المسموحة: PDF, PNG, JPG (الحد الأقصى: 4.5MB).
      </p>

      {successMessage && (
        <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', color: '#34D399', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#F87171', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleUpload}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '0.3rem' }}>
              عنوان أو وصف المستند
            </label>
            <input
              type="text"
              className="form-input"
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem' }}
              placeholder="مثال: مخطط الطابق الأرضي"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '0.3rem' }}>
              اختيار الملف (PDF, PNG, JPG)
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              style={{
                display: 'block',
                width: '100%',
                fontSize: '0.82rem',
                color: 'var(--text-muted)',
                padding: '0.4rem',
                background: 'rgba(11,37,24,0.4)',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-gold btn-sm"
            disabled={uploading || !file}
            style={{ fontSize: '0.82rem', padding: '0.45rem 1.2rem' }}
          >
            {uploading ? 'جارٍ الفحص والرفع الآمن...' : 'رفع المستند'}
          </button>
        </div>
      </form>
    </div>
  );
}
