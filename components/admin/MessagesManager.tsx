'use client';

import React, { useState } from 'react';
import { Mail, Phone, Building, Clock, CheckCircle2, AlertCircle, X, Archive, MessageSquare, Check, ArrowRight } from 'lucide-react';

export interface MessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
  replyNotes?: string | null;
  createdAt: string;
}

interface Props {
  initialMessages: MessageItem[];
}

export default function MessagesManager({ initialMessages }: Props) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED'>('ALL');
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const openMessage = (msg: MessageItem) => {
    setSelectedMessage(msg);
    setReplyNotes(msg.replyNotes || '');
    setFeedback(null);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'READ' | 'REPLIED' | 'ARCHIVED', notes?: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, replyNotes: notes }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر تحديث حالة الرسالة');

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus, replyNotes: notes || m.replyNotes } : m))
      );

      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, status: newStatus, replyNotes: notes || prev.replyNotes } : null));
      }

      setFeedback({ type: 'success', message: `تم تحديث حالة الرسالة بنجاح إلى [${newStatus}]` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = messages.filter((m) => {
    if (statusFilter === 'ALL') return true;
    return m.status === statusFilter;
  });

  const unreadCount = messages.filter((m) => m.status === 'UNREAD').length;
  const readCount = messages.filter((m) => m.status === 'READ').length;
  const repliedCount = messages.filter((m) => m.status === 'REPLIED').length;
  const archivedCount = messages.filter((m) => m.status === 'ARCHIVED').length;

  return (
    <div>
      {/* Feedback Banner */}
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

      {/* Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
          صندوق رسائل واستفسارات التواصل المؤسسي
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          متابعة استفسارات الشركات والمؤسسات، مراجعة الرسائل، وتوثيق سجلات الرد والأرشفة
        </span>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setStatusFilter('ALL')}
          >
            <span>جميع الرسائل</span>
            <span style={{ padding: '2px 6px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', fontSize: '0.75rem' }}>
              {messages.length}
            </span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'UNREAD' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setStatusFilter('UNREAD')}
          >
            <span>غير مقروءة</span>
            {unreadCount > 0 && (
              <span className="badge badge-yellow" style={{ fontSize: '0.75rem' }}>
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'READ' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setStatusFilter('READ')}
          >
            <span>تمت المراجعة</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({readCount})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'REPLIED' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setStatusFilter('REPLIED')}
          >
            <span>تم الرد</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({repliedCount})</span>
          </button>

          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'ARCHIVED' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setStatusFilter('ARCHIVED')}
          >
            <span>الأرشيف</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>({archivedCount})</span>
          </button>
        </div>
      </div>

      {/* Messages Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Mail size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>لا توجد رسائل في هذا القسم.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المرسل</th>
                  <th>المؤسسة</th>
                  <th>الموضوع</th>
                  <th>مقتطف الرسالة</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((msg) => (
                  <tr
                    key={msg.id}
                    style={{
                      background: msg.status === 'UNREAD' ? 'rgba(197, 155, 39, 0.05)' : 'transparent',
                    }}
                  >
                    <td>
                      <strong style={{ display: 'block', color: '#FFF' }}>{msg.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{msg.email}</span>
                      {msg.phone && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', display: 'block' }}>
                          {msg.phone}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{msg.organization || 'فرد / غير محدد'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--color-gold-light)', fontSize: '0.9rem' }}>
                      {msg.subject}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.message}
                    </td>
                    <td>
                      {msg.status === 'UNREAD' && <span className="badge badge-yellow">غير مقروءة</span>}
                      {msg.status === 'READ' && <span className="badge badge-green">تمت المراجعة</span>}
                      {msg.status === 'REPLIED' && <span className="badge badge-gold">تم الرد</span>}
                      {msg.status === 'ARCHIVED' && <span className="badge badge-blue">مؤرشف</span>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(msg.createdAt).toLocaleDateString('ar-YE', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => openMessage(msg)}
                      >
                        <span>معاينة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Message Detail Modal / Drawer */}
      {selectedMessage && (
        <div
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
            className="card"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--color-gold)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={22} color="var(--color-gold)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  تفاصيل رسالة التواصل
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMessage(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Sender Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(5, 14, 9, 0.7)',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>اسم المرسل</span>
                <strong style={{ color: '#FFF', fontSize: '0.9rem' }}>{selectedMessage.name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>البريد الإلكتروني</span>
                <span style={{ color: 'var(--color-gold-light)', fontSize: '0.88rem' }}>{selectedMessage.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>الهاتف</span>
                <span style={{ color: '#FFF', fontSize: '0.88rem' }}>{selectedMessage.phone || 'غير مدخل'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>الجهة أو المؤسسة</span>
                <span style={{ color: '#FFF', fontSize: '0.88rem' }}>{selectedMessage.organization || 'فرد / غير محدد'}</span>
              </div>
            </div>

            {/* Subject and Body */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.25rem' }}>
                موضوع الرسالة
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-gold-light)', margin: '0 0 1rem 0' }}>
                {selectedMessage.subject}
              </h4>

              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block', marginBottom: '0.25rem' }}>
                نص الرسالة
              </span>
              <div
                style={{
                  padding: '1rem',
                  background: 'rgba(11,37,24,0.4)',
                  borderRadius: '6px',
                  color: '#FFF',
                  lineHeight: 1.7,
                  fontSize: '0.92rem',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {selectedMessage.message}
              </div>
            </div>

            {/* Reply Notes / Actions */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.85rem' }}>
                توثيق ملاحظات الرد الداخلي (Audit Trail):
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder="اكتب ملاحظات الرد أو ملخص المكالمة/البريد..."
                value={replyNotes}
                onChange={(e) => setReplyNotes(e.target.value)}
              />
            </div>

            {/* Operational Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedMessage.status === 'UNREAD' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'READ', replyNotes)}
                  >
                    <Check size={14} />
                    <span>تمييز كمقروء</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-gold btn-sm"
                  disabled={submitting}
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'REPLIED', replyNotes)}
                >
                  <MessageSquare size={14} />
                  <span>حفظ وتوثيق الرد</span>
                </button>

                {selectedMessage.status !== 'ARCHIVED' && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'ARCHIVED', replyNotes)}
                  >
                    <Archive size={14} />
                    <span>أرشفة</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedMessage(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
