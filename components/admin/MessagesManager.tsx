'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Mail, 
  Phone, 
  Building, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Archive, 
  MessageSquare, 
  Check, 
  ArrowRight,
  Eye,
  Reply,
  User
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminDataTable,
  AdminStatusBadge,
  AdminTabs,
  AdminButton,
  AdminModal,
  AdminTextarea,
  AdminAlert,
  type ColumnDef,
} from '@/components/admin/ui';

export interface MessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  organization?: string | null;
  subject: string;
  message: string;
  status: 'UNREAD' | 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'REPLIED' | 'ARCHIVED';
  messageType?: 'GENERAL_INQUIRY' | 'COMPLAINT';
  referenceNumber?: string | null;
  priority?: 'NORMAL' | 'HIGH' | 'URGENT';
  assignedToUserId?: string | null;
  assignedTo?: { id: string; fullName: string; email: string } | null;
  dueAt?: string | null;
  resolvedAt?: string | null;
  resolutionSummary?: string | null;
  slaStatus?: string | null;
  slaDetails?: any;
  replyNotes?: string | null;
  createdAt: string;
}

interface Props {
  initialMessages: MessageItem[];
}

export default function MessagesManager({ initialMessages }: Props) {
  const { tx, txLocale } = useAdminT();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'COMPLAINT' | 'GENERAL_INQUIRY'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNREAD' | 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'REPLIED' | 'ARCHIVED'>('ALL');
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [replyNotes, setReplyNotes] = useState('');
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; fullName: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const typeParam = searchParams?.get('type')?.toUpperCase();
    if (typeParam && ['ALL', 'COMPLAINT', 'GENERAL_INQUIRY'].includes(typeParam)) {
      setTypeFilter(typeParam as any);
    }
    const statusParam = searchParams?.get('status')?.toUpperCase();
    if (statusParam && ['ALL', 'UNREAD', 'READ', 'IN_PROGRESS', 'RESOLVED', 'REPLIED', 'ARCHIVED'].includes(statusParam)) {
      setStatusFilter(statusParam as any);
    }
  }, [searchParams]);

  // Load available staff for assignment
  useEffect(() => {
    fetch('/api/admin/users?staffOnly=true')
      .then((res) => res.json())
      .then((data) => {
        if (data.users) setAvailableStaff(data.users);
      })
      .catch(() => {});
  }, []);

  const openMessage = (msg: MessageItem) => {
    setSelectedMessage(msg);
    setReplyNotes(msg.replyNotes || '');
    setResolutionSummary(msg.resolutionSummary || '');
    setAssignedToUserId(msg.assignedToUserId || '');
    setFeedback(null);
    if (msg.status === 'UNREAD') {
      handleUpdateStatus(msg.id, 'READ', msg.replyNotes || undefined, false);
    }
  };

  // Auto-open target message if navigated with ?id=
  useEffect(() => {
    const targetId = searchParams?.get('id');
    if (!targetId || messages.length === 0) return;
    const found = messages.find((m) => m.id === targetId);
    if (found) {
      openMessage(found);
    }
  }, [searchParams, messages]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'READ' | 'IN_PROGRESS' | 'RESOLVED' | 'REPLIED' | 'ARCHIVED',
    notes?: string,
    showToast: boolean = true,
    targetAssignedUserId?: string,
    targetResolutionSummary?: string
  ) => {
    setSubmitting(true);
    try {
      const payload: any = { status: newStatus, replyNotes: notes };
      if (targetAssignedUserId !== undefined) payload.assignedToUserId = targetAssignedUserId;
      if (targetResolutionSummary !== undefined) payload.resolutionSummary = targetResolutionSummary;

      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("تعذر تحديث حالة الرسالة/الشكوى"));

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...data.message } : m))
      );

      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, ...data.message } : null));
      }

      if (showToast) {
        setFeedback({ type: 'success', message: tx("تم تحديث الحالة بنجاح") });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = messages.filter((m) => {
    const matchesType = typeFilter === 'ALL' || m.messageType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const unreadCount = messages.filter((m) => m.status === 'UNREAD').length;
  const readCount = messages.filter((m) => m.status === 'READ').length;
  const repliedCount = messages.filter((m) => m.status === 'REPLIED').length;
  const archivedCount = messages.filter((m) => m.status === 'ARCHIVED').length;

  const columns: ColumnDef<MessageItem>[] = [
    {
      key: 'type',
      header: tx("النوع والمرجع"),
      render: (m) => (
        <div>
          {m.messageType === 'COMPLAINT' ? (
            <div>
              <span
                style={{
                  fontSize: '0.72rem',
                  background: 'var(--admin-warning-subtle)',
                  color: 'var(--admin-warning)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  display: 'inline-block',
                  marginBottom: '2px',
                }}
              >
                ⚠️ {tx("شكوى تشغيلية")}
              </span>
              {m.referenceNumber && (
                <span dir="ltr" style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-primary)', fontWeight: 700 }}>
                  {m.referenceNumber}
                </span>
              )}
            </div>
          ) : (
            <span
              style={{
                fontSize: '0.72rem',
                background: 'var(--admin-info-subtle)',
                color: 'var(--admin-info)',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              💬 {tx("استفسار عام")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: tx("المرسل"),
      render: (m) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{m.name}</strong>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-en)',
              direction: 'ltr',
              display: 'inline-block',
            }}
          >
            {m.email}
          </span>
        </div>
      ),
    },
    {
      key: 'subject',
      header: tx("الموضوع"),
      render: (m) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.subject}</span>
          <p
            style={{
              fontSize: '0.76rem',
              color: 'var(--text-muted)',
              margin: '0.15rem 0 0 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '300px',
            }}
          >
            {m.message}
          </p>
        </div>
      ),
    },
    {
      key: 'sla',
      header: tx("مؤشر SLA"),
      render: (m) => {
        if (m.messageType !== 'COMPLAINT') return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        const isLate = m.slaDetails?.isBreached || m.slaStatus === 'BREACHED';
        const isResolved = m.status === 'RESOLVED';
        return (
          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: isLate ? 'var(--admin-danger)' : isResolved ? 'var(--admin-success)' : 'var(--admin-info)',
                display: 'block',
              }}
            >
              {isResolved
                ? `✓ ${tx("تم الحل")}`
                : isLate
                ? `🚨 ${tx("تجاوز SLA")}`
                : `⏳ ${tx("ضمن المهلة")}`}
            </span>
            {m.dueAt && !isResolved && (
              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)' }}>
                {new Date(m.dueAt).toLocaleTimeString(txLocale("ar-YE"), { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: tx("الحالة"),
      render: (m) => (
        <div>
          <AdminStatusBadge status={m.status} />
          {m.assignedTo && (
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--admin-info)', marginTop: '2px' }}>
              👤 {m.assignedTo.fullName}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: tx("تاريخ الإرسال"),
      render: (m) => (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-en)',
            direction: 'ltr',
            display: 'inline-block',
          }}
        >
          {new Date(m.createdAt).toLocaleDateString(txLocale("ar-YE"))}
        </span>
      ),
    },
    {
      key: 'actions',
      header: tx("الإجراءات"),
      align: 'center',
      render: (m) => (
        <AdminButton
          variant="secondary"
          size="sm"
          icon={Eye}
          onClick={() => openMessage(m)}
        >
          {m.messageType === 'COMPLAINT' ? tx("معالجة الشكوى") : tx("عرض الرسالة")}
        </AdminButton>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={tx("منظومة المراسلات والشكاوى التشغيلية")}
        description={tx("متابعة استفسارات التواصل وقناة استقبال الشكاوى الرسمية مع تتبع المهلة الزمنية لاتفاقية SLA")}
        meta={
          unreadCount > 0 ? (
            <AdminStatusBadge status="UNREAD" label={tx("{0} وارد غير مقروء", unreadCount)} />
          ) : undefined
        }
      />

      {feedback && (
        <AdminAlert
          variant={feedback.type === 'success' ? 'success' : 'danger'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </AdminAlert>
      )}

      {/* Type Filter Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <AdminButton
          variant={typeFilter === 'ALL' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTypeFilter('ALL')}
        >
          {tx("كافة المراسلات")} ({messages.length})
        </AdminButton>
        <AdminButton
          variant={typeFilter === 'COMPLAINT' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTypeFilter('COMPLAINT')}
        >
          ⚠️ {tx("الشكاوى التشغيلية")} ({messages.filter((m) => m.messageType === 'COMPLAINT').length})
        </AdminButton>
        <AdminButton
          variant={typeFilter === 'GENERAL_INQUIRY' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTypeFilter('GENERAL_INQUIRY')}
        >
          💬 {tx("استفسارات التواصل")} ({messages.filter((m) => m.messageType !== 'COMPLAINT').length})
        </AdminButton>
      </div>

      {/* Tabs */}
      <AdminTabs
        tabs={[
          { id: 'ALL', label: tx("الكل"), count: filtered.length },
          { id: 'UNREAD', label: tx("غير مقروءة"), count: unreadCount },
          { id: 'READ', label: tx("تم الاطلاع"), count: readCount },
          { id: 'IN_PROGRESS', label: tx("قيد المعالجة"), count: messages.filter((m) => m.status === 'IN_PROGRESS').length },
          { id: 'RESOLVED', label: tx("تم الحل والمعالجة"), count: messages.filter((m) => m.status === 'RESOLVED').length },
          { id: 'REPLIED', label: tx("تم الرد"), count: repliedCount },
          { id: 'ARCHIVED', label: tx("مؤرشفة"), count: archivedCount },
        ]}
        activeTab={statusFilter}
        onChange={(tabId) => setStatusFilter(tabId as any)}
      />

      <AdminDataTable
        columns={columns}
        data={filtered}
        keyExtractor={(m) => m.id}
        emptyTitle={tx("لا توجد رسائل أو شكاوى في هذا التبويب")}
        emptyDescription={tx("لم يتم العثور على أي عناصر تطابق التصفية الحالية.")}
        mobileCardRender={(m) => (
          <div className="admin-card-inner">
            <div className="admin-card-top">
              <div>
                <strong className="admin-card-title">{m.name}</strong>
                <span className="admin-card-sub" dir="ltr">{m.email}</span>
                {m.referenceNumber && (
                  <span dir="ltr" style={{ fontFamily: 'monospace', color: 'var(--admin-primary)', fontSize: '0.75rem', display: 'block' }}>
                    {m.referenceNumber}
                  </span>
                )}
              </div>
              <AdminStatusBadge status={m.status} />
            </div>

            <div className="admin-card-body">
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{m.subject}</div>
              <p className="admin-card-snippet">{m.message}</p>
            </div>

            <div className="admin-card-footer">
              <span className="admin-card-date" dir="ltr">
                <Clock size={12} />
                <span>{new Date(m.createdAt).toLocaleDateString(txLocale("ar-YE"))}</span>
              </span>
              <AdminButton
                variant="secondary"
                size="sm"
                icon={Eye}
                onClick={() => openMessage(m)}
              >
                {tx("عرض")}
              </AdminButton>
            </div>
          </div>
        )}
      />

      {/* Detail & Action Modal */}
      {selectedMessage && (
        <AdminModal
          isOpen={Boolean(selectedMessage)}
          onClose={() => setSelectedMessage(null)}
          title={
            selectedMessage.messageType === 'COMPLAINT'
              ? tx("معالجة الشكوى: {0}", selectedMessage.referenceNumber || selectedMessage.name)
              : tx("رسالة من: {0}", selectedMessage.name)
          }
          description={selectedMessage.organization ? tx("الجهة: {0}", selectedMessage.organization) : undefined}
          maxWidth="700px"
        >
          {/* Metadata Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: 'var(--surface-bg)',
              borderRadius: '8px',
              border: '1px solid var(--admin-card-border)',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{tx("المرسل والبريد")}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{selectedMessage.name}</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', direction: 'ltr' }}>{selectedMessage.email}</span>
            </div>
            {selectedMessage.phone && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{tx("الهاتف")}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, direction: 'ltr', display: 'inline-block' }}>
                  {selectedMessage.phone}
                </span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{tx("تاريخ الإرسال")}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                {new Date(selectedMessage.createdAt).toLocaleString(txLocale("ar-YE"))}
              </span>
            </div>
            {selectedMessage.dueAt && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{tx("مهلة SLA المستهدفة")}</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: selectedMessage.slaStatus === 'BREACHED' ? 'var(--admin-danger)' : 'var(--admin-success)' }}>
                  {new Date(selectedMessage.dueAt).toLocaleString(txLocale("ar-YE"))}
                </span>
              </div>
            )}
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{tx("الحالة")}</span>
              <div style={{ marginTop: '0.2rem' }}>
                <AdminStatusBadge status={selectedMessage.status} />
              </div>
            </div>
          </div>

          {/* Subject & Message Content */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
              {tx("الموضوع:")} {selectedMessage.subject}
            </h4>
            <div
              style={{
                padding: '0.85rem 1rem',
                background: 'var(--surface-bg)',
                borderRadius: '8px',
                border: '1px solid var(--admin-card-border)',
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedMessage.message}
            </div>
          </div>

          {/* Complaint Specific: Responsible Staff Assignment */}
          {selectedMessage.messageType === 'COMPLAINT' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
                {tx("المسؤول المتابع والمكلف بالشكوى")}
              </label>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--admin-card-border)',
                  background: 'var(--surface-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                }}
              >
                <option value="">{tx("— غير مخصص —")}</option>
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Complaint Specific: Resolution Summary */}
          {selectedMessage.messageType === 'COMPLAINT' && (
            <div style={{ marginBottom: '1rem' }}>
              <AdminTextarea
                label={tx("ملخص المعالجة والحل المعتمد (Resolution Summary)")}
                rows={3}
                placeholder={tx("سجل الإجراءات المتخذة لمعالجة الشكوى وحلها نهائياً...")}
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
              />
            </div>
          )}

          {/* Operational Notes / Reply Action */}
          <div>
            <AdminTextarea
              label={tx("ملاحظات المتابعة والتواصل الداخلي")}
              rows={2}
              placeholder={tx("ملاحظات المتابعة الداخلية...")}
              value={replyNotes}
              onChange={(e) => setReplyNotes(e.target.value)}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginTop: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedMessage.status !== 'ARCHIVED' && (
                  <AdminButton
                    variant="ghost"
                    size="sm"
                    icon={Archive}
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'ARCHIVED', replyNotes, true, assignedToUserId, resolutionSummary)}
                  >
                    {tx("أرشفة")}
                  </AdminButton>
                )}
                {selectedMessage.messageType === 'COMPLAINT' && selectedMessage.status !== 'IN_PROGRESS' && (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'IN_PROGRESS', replyNotes, true, assignedToUserId, resolutionSummary)}
                  >
                    {tx("قيد المعالجة")}
                  </AdminButton>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedMessage.messageType === 'COMPLAINT' ? (
                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon={Check}
                    loading={submitting}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'RESOLVED', replyNotes, true, assignedToUserId, resolutionSummary)}
                  >
                    {tx("اعتماد الحل وإغلاق الشكوى")}
                  </AdminButton>
                ) : (
                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon={Reply}
                    loading={submitting}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'REPLIED', replyNotes, true)}
                  >
                    {tx("حفظ وتسجيل الرد")}
                  </AdminButton>
                )}
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
