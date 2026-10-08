'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2, MessageSquare, Send } from 'lucide-react';

interface Props {
  requestId: string;
  existingFeedback?: {
    overallRating: number;
    serviceQuality: number;
    timeliness: number;
    communication: number;
    comment?: string | null;
    submittedAt: string | Date;
  } | null;
  locale?: string;
}

export default function ClientFeedbackForm({ requestId, existingFeedback, locale = 'ar' }: Props) {
  const isAr = locale === 'ar';
  const [feedback, setFeedback] = useState(existingFeedback || null);
  const [overallRating, setOverallRating] = useState(5);
  const [serviceQuality, setServiceQuality] = useState(5);
  const [timeliness, setTimeliness] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/portal/client/requests/${requestId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overallRating,
          serviceQuality,
          timeliness,
          communication,
          comment: comment.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إرسال التقييم');
      }

      setFeedback(data.feedback);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarSelector = (value: number, onChange: (val: number) => void, label: string) => (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px',
              transition: 'transform 0.15s',
            }}
          >
            <Star
              size={22}
              style={{
                color: star <= value ? '#EAB308' : '#D1D5DB',
                fill: star <= value ? '#EAB308' : 'none',
              }}
            />
          </button>
        ))}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginInlineStart: '0.5rem', fontWeight: 700 }}>
          {value} / 5
        </span>
      </div>
    </div>
  );

  if (feedback) {
    return (
      <div
        className="card"
        style={{
          marginTop: '1.5rem',
          padding: '1.5rem',
          background: 'rgba(22, 163, 74, 0.04)',
          border: '1px solid rgba(22, 163, 74, 0.25)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#16A34A', marginBottom: '0.85rem' }}>
          <CheckCircle2 size={22} />
          <strong style={{ fontSize: '1rem' }}>
            {isAr ? 'تم استلام تقييمك لهذه الخدمة — شكراً لمشاركتنا رأيك!' : 'Feedback Submitted — Thank you!'}
          </strong>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'التقييم العام:' : 'Overall Rating:'}</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{feedback.overallRating} / 5 ⭐</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'جودة الخدمة:' : 'Quality:'}</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{feedback.serviceQuality} / 5</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'الالتزام بالمواعيد:' : 'Timeliness:'}</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{feedback.timeliness} / 5</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>{isAr ? 'التواصل والمتابعة:' : 'Communication:'}</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{feedback.communication} / 5</strong>
          </div>
        </div>

        {feedback.comment && (
          <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>{isAr ? 'ملاحظاتك:' : 'Your Comments:'}</span>
            <p style={{ margin: 0, color: 'var(--text-primary)' }}>{feedback.comment}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        marginTop: '1.5rem',
        padding: '1.5rem',
        background: 'var(--surface-bg)',
        border: '1px solid var(--admin-card-border)',
        borderRadius: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--brand-gold-600)', marginBottom: '0.5rem' }}>
        <Star size={20} style={{ fill: 'var(--brand-gold-600)' }} />
        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
          {isAr ? 'تقييم جودة الخدمة ورضا العميل' : 'Rate Service Quality & Experience'}
        </h4>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
        {isAr
          ? 'نظراً لاكتمال تنفيذ الخدمة بنجاح، يهمنا معرفة مستوى رضاكم للمساهمة في استمرار تحسين وتطوير خدماتنا.'
          : 'As this service request is completed, please share your feedback to help us maintain top quality.'}
      </p>

      {error && (
        <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(220, 38, 38, 0.08)', color: '#DC2626', fontSize: '0.82rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {renderStarSelector(overallRating, setOverallRating, isAr ? 'مستوى الرضا العام عن الخدمة *' : 'Overall Satisfaction *')}
          {renderStarSelector(serviceQuality, setServiceQuality, isAr ? 'جودة المخرجات والتنفيذ *' : 'Service & Deliverable Quality *')}
          {renderStarSelector(timeliness, setTimeliness, isAr ? 'الالتزام بالجدول والمواعيد *' : 'Timeliness & Punctuality *')}
          {renderStarSelector(communication, setCommunication, isAr ? 'كفاءة التواصل والمتابعة *' : 'Communication & Responsiveness *')}
        </div>

        <div style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            {isAr ? 'ملاحظات أو مقترحات إضافية (اختياري)' : 'Additional Comments (Optional)'}
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={isAr ? 'أدخل أي ملاحظات تساعدنا في تحسين وتطوير الخدمات...' : 'Share your constructive feedback...'}
            style={{
              width: '100%',
              padding: '0.65rem',
              borderRadius: '8px',
              border: '1px solid var(--admin-card-border)',
              background: 'var(--input-bg, #fff)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              resize: 'vertical',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.65rem 1.25rem',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Send size={16} />
          <span>{isSubmitting ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...') : (isAr ? 'إرسال التقييم' : 'Submit Feedback')}</span>
        </button>
      </form>
    </div>
  );
}
