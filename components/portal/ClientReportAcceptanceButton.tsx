'use client';

import React, { useState } from 'react';
import { CheckCircle2, FileCheck2, Loader2 } from 'lucide-react';

interface Props {
  documentId: string;
  initialQaStatus: string;
  initialAcceptedAt?: string | null;
  locale?: string;
}

export default function ClientReportAcceptanceButton({
  documentId,
  initialQaStatus,
  initialAcceptedAt,
  locale = 'ar',
}: Props) {
  const isAr = locale === 'ar';
  const [qaStatus, setQaStatus] = useState(initialQaStatus);
  const [acceptedAt, setAcceptedAt] = useState(initialAcceptedAt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/portal/client/documents/${documentId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل قبول التقرير');
      }
      setQaStatus('CLIENT_ACCEPTED');
      setAcceptedAt(new Date().toISOString());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (qaStatus === 'CLIENT_ACCEPTED') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#16A34A', fontSize: '0.78rem', fontWeight: 700 }}>
        <CheckCircle2 size={16} />
        <span>{isAr ? 'تم استلام وقبول التقرير' : 'Report Accepted'}</span>
        {acceptedAt && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ({new Date(acceptedAt).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')})
          </span>
        )}
      </div>
    );
  }

  if (qaStatus === 'DELIVERED') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={handleAccept}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid #16A34A',
            background: 'rgba(22, 163, 74, 0.08)',
            color: '#16A34A',
            fontSize: '0.78rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <FileCheck2 size={14} />}
          <span>{isAr ? 'تأكيد استلام وقبول التقرير' : 'Accept Report'}</span>
        </button>
        {error && <span style={{ color: '#DC2626', fontSize: '0.72rem' }}>{error}</span>}
      </div>
    );
  }

  return (
    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
      {qaStatus === 'UNDER_REVIEW' || qaStatus === 'PENDING_QA'
        ? (isAr ? 'قيد المراجعة الفنية (QA)' : 'Under QA Review')
        : (isAr ? 'تقرير معتمد' : 'Approved')}
    </span>
  );
}
