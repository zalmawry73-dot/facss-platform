'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Shield, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  User, 
  MessageSquare, 
  FileText, 
  Edit3, 
  AlertCircle,
  X,
  UploadCloud,
  Download,
  Trash2,
  Lock,
  Eye,
  FileCheck2,
  Calendar,
  Building,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminDataTable,
  AdminStatusBadge,
  AdminButton,
  AdminIconButton,
  AdminFilterBar,
  AdminSearchInput,
  AdminModal,
  AdminTabs,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminCheckbox,
  AdminAlert,
  type ColumnDef,
} from '@/components/admin/ui';

const PRIORITY_MAP: Record<string, { label: string; variant: 'danger' | 'warning' | 'neutral' }> = {
  NORMAL: { get label() { return tx("عادية"); }, variant: 'neutral' },
  HIGH: { get label() { return tx("عالية"); }, variant: 'warning' },
  URGENT: { get label() { return tx("عاجلة"); }, variant: 'danger' },
};

export interface ServiceRequestDocumentItem {
  id: string;
  title: string;
  originalFilename?: string | null;
  documentType: string;
  visibility: string;
  isArchived: boolean;
  sizeBytes?: number | null;
  fileSize?: number;
  mimeType?: string | null;
  createdAt: string;
}

export interface ServiceRequestItem {
  id: string;
  requestNumber: string;
  organization: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  service: {
    titleAr: string;
  };
  assignedEmployee?: {
    id: string;
    fullName: string;
  } | null;
  notes?: {
    id: string;
    authorName: string;
    note: string;
    isClientVisible: boolean;
    createdAt: string;
  }[];
  documents?: ServiceRequestDocumentItem[];
}

interface Props {
  initialRequests?: ServiceRequestItem[];
}

export default function RequestsManager({ initialRequests }: Props) {
  const { tx, txLocale } = useAdminT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<ServiceRequestItem[]>(initialRequests || []);
  const [loading, setLoading] = useState(!initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected request for editing
  const [selectedReq, setSelectedReq] = useState<ServiceRequestItem | null>(null);
  const [activeTab, setActiveTab] = useState<'status_notes' | 'documents'>('status_notes');
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isClientVisibleNote, setIsClientVisibleNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document upload state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('INTERNAL_DOCUMENT');
  const [docVisibility, setDocVisibility] = useState('INTERNAL_ONLY');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docActionMessage, setDocActionMessage] = useState<string | null>(null);
  const [docActionError, setDocActionError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        if (selectedReq) {
          const updated = (data.requests || []).find((r: ServiceRequestItem) => r.id === selectedReq.id);
          if (updated) setSelectedReq(updated);
        }
      }
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (req: ServiceRequestItem) => {
    setSelectedReq(req);
    setNewStatus(req.status);
    setNewNote('');
    setIsClientVisibleNote(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setDocActionMessage(null);
    setDocActionError(null);
    setActiveTab('status_notes');
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
    if (searchParams?.get('id') || searchParams?.get('requestNumber')) {
      router.replace('/admin/requests', { scroll: false });
    }
  };

  // Auto-open requested record when navigated with ?id= or ?requestNumber=
  useEffect(() => {
    const targetId = searchParams?.get('id') || searchParams?.get('requestNumber');
    if (!targetId) return;

    const found = requests.find((r) => r.id === targetId || r.requestNumber === targetId);
    if (found) {
      handleOpenEdit(found);
    } else {
      fetch(`/api/requests/${targetId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.request) {
            handleOpenEdit(data.request);
          }
        })
        .catch(() => {});
    }
  }, [searchParams, requests]);

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/requests/${selectedReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          note: newNote.trim() ? newNote.trim() : undefined,
          isClientVisible: isClientVisibleNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(tx("تم تحديث حالة الطلب وتسجيل الملاحظة بنجاح."));
        setNewNote('');
        setIsClientVisibleNote(false);
        await fetchRequests();
      } else {
        setErrorMessage(data.error || tx("فشل تحديث الطلب."));
      }
    } catch {
      setErrorMessage(tx("حدث خطأ في الاتصال بالخادم."));
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !docFile || !docTitle.trim()) {
      setDocActionError(tx("يرجى اختيار ملف وإدخال عنوان للمستند."));
      return;
    }

    setUploadingDoc(true);
    setDocActionMessage(null);
    setDocActionError(null);

    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('title', docTitle.trim());
      formData.append('documentType', docType);
      formData.append('visibility', docVisibility);

      const res = await fetch(`/api/requests/${selectedReq.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDocActionMessage(tx("تم رفع وتأمين المستند بنجاح."));
        setDocFile(null);
        setDocTitle('');
        await fetchRequests();
      } else {
        setDocActionError(data.error || tx("فشل رفع المستند."));
      }
    } catch {
      setDocActionError(tx("خطأ في الاتصال بالخادم."));
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleArchiveDocument = async (docId: string) => {
    if (!confirm(tx("هل أنت متأكد من أرشفة هذا المستند وحجبه؟"))) return;

    setDocActionMessage(null);
    setDocActionError(null);

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDocActionMessage(tx("تمت أرشفة المستند بنجاح."));
        await fetchRequests();
      } else {
        setDocActionError(data.error || tx("فشلت أرشفة المستند."));
      }
    } catch {
      setDocActionError(tx("خطأ في الاتصال بالخادم."));
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.requestNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.service.titleAr.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<ServiceRequestItem>[] = [
    {
      key: 'requestNumber',
      header: tx("رقم الطلب"),
      render: (req) => (
        <span
          style={{
            fontWeight: 800,
            color: 'var(--brand-gold-600)',
            fontFamily: 'var(--font-en)',
            direction: 'ltr',
            display: 'inline-block',
          }}
        >
          {req.requestNumber}
        </span>
      ),
    },
    {
      key: 'organization',
      header: tx("الجهة والاتصال"),
      render: (req) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{req.organization}</strong>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            {req.contactName} • <span style={{ direction: 'ltr', display: 'inline-block' }}>{req.contactPhone}</span>
          </span>
        </div>
      ),
    },
    {
      key: 'service',
      header: tx("الخدمة المطلوبة"),
      render: (req) => <span style={{ color: 'var(--text-secondary)' }}>{req.service.titleAr}</span>,
    },
    {
      key: 'priority',
      header: tx("الأولوية"),
      render: (req) => {
        const priorityInfo = PRIORITY_MAP[req.priority] || { label: req.priority, variant: 'neutral' };
        return (
          <AdminStatusBadge
            status={req.priority}
            variant={priorityInfo.variant}
            label={priorityInfo.label}
          />
        );
      },
    },
    {
      key: 'status',
      header: tx("الحالة"),
      render: (req) => <AdminStatusBadge status={req.status} />,
    },
    {
      key: 'documents',
      header: tx("المستندات"),
      render: (req) => {
        const docCount = (req.documents || []).filter((d) => !d.isArchived).length;
        const hasFinalReport = (req.documents || []).some(
          (d) => d.documentType === 'FINAL_REPORT' && !d.isArchived
        );
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.12rem 0.45rem',
                borderRadius: '4px',
                background: 'var(--surface-sunken)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
              }}
            >
              {docCount} {tx("ملف")}
            </span>
            {hasFinalReport && (
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.12rem 0.45rem',
                  borderRadius: '4px',
                  background: 'var(--admin-status-success-bg)',
                  color: 'var(--admin-status-success-text)',
                  fontWeight: 700,
                  border: '1px solid var(--admin-status-success-border)',
                }}
              >
                {tx("تقرير معتمد")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: tx("تاريخ التقديم"),
      render: (req) => (
        <span
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-en)',
            direction: 'ltr',
            display: 'inline-block',
          }}
        >
          {new Date(req.createdAt).toLocaleDateString(txLocale("ar-YE"))}
        </span>
      ),
    },
    {
      key: 'actions',
      header: tx("الإجراءات"),
      align: 'center',
      render: (req) => (
        <AdminButton
          variant="secondary"
          size="sm"
          icon={Edit3}
          onClick={() => handleOpenEdit(req)}
        >
          {tx("إدارة")}
        </AdminButton>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={tx("إدارة ومتابعة طلبات الخدمات الأمنية")}
        description={tx("تحديث مسارات العمل الميداني، إصدار التقارير الأمنية، وإدارة مستندات العمليات")}
        meta={
          <span style={{ fontSize: '0.78rem', color: 'var(--brand-gold-600)', fontWeight: 700 }}>
            {tx("إجمالي الطلبات المسجلة:")} {requests.length} {tx("طلب")}
          </span>
        }
      />

      <AdminFilterBar
        hasActiveFilters={Boolean(searchQuery || statusFilter !== 'ALL')}
        onReset={() => {
          setSearchQuery('');
          setStatusFilter('ALL');
        }}
      >
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={tx("البحث برقم الطلب، اسم الجهة، أو اسم الخدمة...")}
        />

        <div style={{ minWidth: '180px' }}>
          <select
            className="admin-select"
            style={{ height: 'var(--admin-control-height-md)', margin: 0 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{tx("كافة الحالات")}</option>
            <option value="NEW">{tx("طلب جديد (NEW)")}</option>
            <option value="UNDER_REVIEW">{tx("قيد المراجعة (UNDER_REVIEW)")}</option>
            <option value="CONTACTED">{tx("تم التواصل (CONTACTED)")}</option>
            <option value="WAITING_FOR_CLIENT">{tx("بانتظار العميل (WAITING_FOR_CLIENT)")}</option>
            <option value="APPROVED">{tx("معتمد (APPROVED)")}</option>
            <option value="IN_PROGRESS">{tx("تنفيذ ميداني (IN_PROGRESS)")}</option>
            <option value="COMPLETED">{tx("مكتمل (COMPLETED)")}</option>
            <option value="CANCELLED">{tx("ملغي (CANCELLED)")}</option>
          </select>
        </div>
      </AdminFilterBar>

      <AdminDataTable
        columns={columns}
        data={filteredRequests}
        keyExtractor={(r) => r.id}
        loading={loading}
        emptyTitle={tx("لا توجد طلبات تطابق معايير البحث")}
        emptyDescription={tx("جرّب تعديل مصطلح البحث أو تفريغ الفلاتر الحالية.")}
        mobileCardRender={(req) => {
          const docCount = (req.documents || []).filter((d) => !d.isArchived).length;
          const p = PRIORITY_MAP[req.priority] || { label: req.priority, variant: 'neutral' };
          return (
            <div className="admin-card-inner">
              <div className="admin-card-top">
                <div>
                  <span className="admin-card-title" dir="ltr" style={{ fontFamily: 'monospace' }}>
                    {req.requestNumber}
                  </span>
                  <span className="admin-card-sub">{req.service.titleAr}</span>
                </div>
                <AdminStatusBadge status={req.status} />
              </div>

              <div className="admin-card-body">
                <div className="admin-card-row">
                  <span className="admin-card-label">{tx("المؤسسة:")}</span>
                  <span className="admin-card-value">{req.organization}</span>
                  <span style={{ color: 'var(--text-muted)' }}>({req.contactName})</span>
                </div>

                <div className="admin-card-row">
                  <span className="admin-card-label">{tx("الأولوية:")}</span>
                  <AdminStatusBadge status={req.priority} label={p.label} variant={p.variant as any} />
                  <span
                    style={{
                      fontSize: '0.72rem',
                      padding: '0.12rem 0.45rem',
                      borderRadius: '4px',
                      background: 'var(--surface-sunken)',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {docCount} {tx("مستند")}
                  </span>
                </div>
              </div>

              <div className="admin-card-footer">
                <span className="admin-card-date" dir="ltr">
                  <Clock size={12} />
                  <span>{new Date(req.createdAt).toLocaleDateString(txLocale("ar-YE"))}</span>
                </span>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  icon={Eye}
                  onClick={() => handleOpenEdit(req)}
                >
                  {tx("إدارة ومتابعة")}
                </AdminButton>
              </div>
            </div>
          );
        }}
      />

      {/* Operation Drawer / Modal */}
      {selectedReq && (
        <AdminModal
          isOpen={Boolean(selectedReq)}
          onClose={handleCloseModal}
          title={tx("إدارة الطلب: {0}", selectedReq.requestNumber)}
          description={`${selectedReq.organization} — ${selectedReq.service.titleAr}`}
          maxWidth="720px"
        >
          {/* Sub-Tabs */}
          <AdminTabs
            tabs={[
              { id: 'status_notes', label: tx("الحالة والملاحظات"), icon: Edit3 },
              {
                id: 'documents',
                label: tx("المستندات والتقرير النهائي"),
                icon: FileText,
                count: selectedReq.documents?.filter((d) => !d.isArchived).length || 0,
              },
            ]}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId as any)}
          />

          {/* TAB 1: Status & Operational Notes */}
          {activeTab === 'status_notes' && (
            <div>
              {successMessage && <AdminAlert variant="success">{successMessage}</AdminAlert>}
              {errorMessage && <AdminAlert variant="danger">{errorMessage}</AdminAlert>}

              {/* Scope Summary */}
              <div
                style={{
                  padding: '0.85rem 1rem',
                  background: 'var(--surface-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--admin-card-border)',
                  marginBottom: '1.25rem',
                }}
              >
                <strong
                  style={{
                    fontSize: '0.82rem',
                    color: 'var(--brand-gold-600)',
                    display: 'block',
                    marginBottom: '0.25rem',
                  }}
                >
                  {tx("شرح نطاق الطلب من العميل:")}
                </strong>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {selectedReq.description}
                </p>
              </div>

              <form onSubmit={handleSaveUpdate}>
                <AdminSelect
                  label={tx("الحالة التشغيلية للطلب")}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="NEW">{tx("طلب جديد (NEW)")}</option>
                  <option value="UNDER_REVIEW">{tx("قيد المراجعة والتقييم الأولي (UNDER_REVIEW)")}</option>
                  <option value="CONTACTED">{tx("تم الاتصال بالعميل (CONTACTED)")}</option>
                  <option value="WAITING_FOR_CLIENT">{tx("بانتظار مستندات العميل (WAITING_FOR_CLIENT)")}</option>
                  <option value="APPROVED">{tx("تمت الموافقة واعتماد الخطة (APPROVED)")}</option>
                  <option value="IN_PROGRESS">{tx("تنفيذ ميداني ونشر الكوادر (IN_PROGRESS)")}</option>
                  <option value="COMPLETED">{tx("مكتمل ومسلّم بنجاح (COMPLETED)")}</option>
                  <option value="CANCELLED">{tx("ملغي (CANCELLED)")}</option>
                </AdminSelect>

                <AdminTextarea
                  label={tx("إضافة ملاحظة أو تحديث تشغيلي")}
                  rows={3}
                  placeholder={tx("اكتب تفاصيل التحديث أو الملاحظة الميدانية...")}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />

                <AdminCheckbox
                  label={tx("إظهار هذه الملاحظة للعميل في بوابة المتابعة (Client-Visible Note)")}
                  checked={isClientVisibleNote}
                  onChange={setIsClientVisibleNote}
                />

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <AdminButton variant="secondary" onClick={() => setSelectedReq(null)}>
                    {tx("إلغاء")}
                  </AdminButton>
                  <AdminButton variant="primary" type="submit" loading={saving}>
                    {tx("حفظ التحديثات")}
                  </AdminButton>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Documents & Final Security Reports */}
          {activeTab === 'documents' && (
            <div>
              {docActionMessage && <AdminAlert variant="success">{docActionMessage}</AdminAlert>}
              {docActionError && <AdminAlert variant="danger">{docActionError}</AdminAlert>}

              {/* Existing Documents List */}
              <div style={{ marginBottom: '1.75rem' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                  {tx("مستندات وتقارير هذا الطلب")}
                </h4>

                {!selectedReq.documents || selectedReq.documents.filter((d) => !d.isArchived).length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      background: 'var(--surface-bg)',
                      borderRadius: '8px',
                      color: 'var(--text-muted)',
                      fontSize: '0.84rem',
                      textAlign: 'center',
                    }}
                  >
                    {tx("لا توجد مستندات مرفوعة لهذا الطلب حتى الآن.")}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {selectedReq.documents
                      .filter((d) => !d.isArchived)
                      .map((doc) => {
                        const isFinal = doc.documentType === 'FINAL_REPORT';
                        const isInternal = doc.visibility === 'INTERNAL_ONLY';

                        return (
                          <div
                            key={doc.id}
                            style={{
                              padding: '0.75rem 1rem',
                              background: isFinal ? 'rgba(217, 119, 6, 0.06)' : 'var(--surface-bg)',
                              border: isFinal ? '1px solid var(--brand-gold-500)' : '1px solid var(--admin-card-border)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.86rem' }}>
                                  {doc.title}
                                </span>
                                {isFinal && (
                                  <AdminStatusBadge status="COMPLETED" label={tx("التقرير النهائي")} />
                                )}
                                {isInternal ? (
                                  <AdminStatusBadge status="INTERNAL" variant="danger" label={tx("داخلي فقط")} icon={Lock} />
                                ) : (
                                  <AdminStatusBadge status="CLIENT" variant="info" label={tx("متاح للعميل")} icon={Eye} />
                                )}
                              </div>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  color: 'var(--text-muted)',
                                  fontFamily: 'var(--font-en)',
                                  direction: 'ltr',
                                  display: 'inline-block',
                                }}
                              >
                                {doc.originalFilename || 'document.pdf'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <AdminButton
                                variant="secondary"
                                size="sm"
                                icon={Download}
                                href={`/api/documents/${doc.id}/download`}
                                target="_blank"
                              >
                                {tx("تحميل")}
                              </AdminButton>
                              <AdminButton
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                onClick={() => handleArchiveDocument(doc.id)}
                              >
                                {tx("أرشفة")}
                              </AdminButton>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Upload New Document Form */}
              <div
                style={{
                  padding: '1.25rem',
                  background: 'var(--surface-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--admin-card-border)',
                }}
              >
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                  {tx("رفع مستند أمني أو تقرير عمليات جديد")}
                </h4>

                <form onSubmit={handleUploadDocument}>
                  <AdminInput
                    label={tx("عنوان المستند")}
                    required
                    placeholder={tx("مثال: التقرير الأمني النهائي الميداني...")}
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <AdminSelect
                      label={tx("نوع المستند")}
                      value={docType}
                      onChange={(e) => setDocType(e.target.value)}
                    >
                      <option value="INTERNAL_DOCUMENT">{tx("وثيقة داخلية عادية")}</option>
                      <option value="FINAL_REPORT">{tx("التقرير النهائي المعتمد (FINAL_REPORT)")}</option>
                      <option value="OPERATIONAL_PLAN">{tx("خطة العمليات الميدانية")}</option>
                      <option value="FIELD_ASSESSMENT">{tx("تقرير التقييم الميداني")}</option>
                      <option value="CONTRACT">{tx("عقد أو اتفاقية")}</option>
                    </AdminSelect>

                    <AdminSelect
                      label={tx("مستوى الرؤية والصلاحية")}
                      value={docVisibility}
                      onChange={(e) => setDocVisibility(e.target.value)}
                    >
                      <option value="INTERNAL_ONLY">{tx("داخلي فقط (لإدارة المركز وفريق العمليات)")}</option>
                      <option value="CLIENT_VISIBLE">{tx("مرئي للعميل في بوابته الخاصة")}</option>
                    </AdminSelect>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">
                      <span>{tx("الملف المرفق")}</span>
                      <span className="admin-label-required">*</span>
                    </label>
                    <input
                      type="file"
                      className="admin-input"
                      style={{ height: 'auto', padding: '0.45rem' }}
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    />
                    <span className="admin-helper-text">
                      {tx("يدعم ملفات PDF, Word, والصور حتى 15 ميجابايت. يتم تشفير الملف وحمايته في مستودع آمن.")}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <AdminButton
                      variant="primary"
                      type="submit"
                      loading={uploadingDoc}
                      icon={UploadCloud}
                    >
                      {tx("رفع وتأمين المستند")}
                    </AdminButton>
                  </div>
                </form>
              </div>
            </div>
          )}
        </AdminModal>
      )}
    </div>
  );
}
