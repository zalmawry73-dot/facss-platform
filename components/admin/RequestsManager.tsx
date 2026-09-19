'use client';

import React, { useState, useEffect } from 'react';
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
  FileCheck2
} from 'lucide-react';

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
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        // Update selected request in-place if open
        if (selectedReq) {
          const updated = (data.requests || []).find((r: ServiceRequestItem) => r.id === selectedReq.id);
          if (updated) setSelectedReq(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialRequests) {
      fetchRequests();
    }
  }, [initialRequests]);

  const openEditor = (req: ServiceRequestItem) => {
    setSelectedReq(req);
    setActiveTab('status_notes');
    setNewStatus(req.status);
    setNewNote('');
    setIsClientVisibleNote(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setDocActionMessage(null);
    setDocActionError(null);
    setDocFile(null);
    setDocTitle('');
  };

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
          note: newNote,
          isClientVisible: isClientVisibleNote,
        }),
      });

      if (res.ok) {
        setSuccessMessage('تم تحديث حالة الطلب وإضافة الملاحظة بنجاح.');
        await fetchRequests();
        setTimeout(() => {
          setSelectedReq(null);
        }, 1200);
      } else {
        const d = await res.json();
        setErrorMessage(d.error || 'حدث خطأ أثناء حفظ التحديث. يرجى إعادة المحاولة.');
      }
    } catch {
      setErrorMessage('خطأ في الاتصال بالخادم.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !docFile) {
      setDocActionError('يرجى اختيار ملف أولاً.');
      return;
    }

    setUploadingDoc(true);
    setDocActionMessage(null);
    setDocActionError(null);

    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('documentType', docType);
      formData.append('visibility', docVisibility);
      if (docTitle.trim()) {
        formData.append('title', docTitle.trim());
      }

      const res = await fetch(`/api/requests/${selectedReq.id}/documents`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDocActionMessage('تم رفع وتأمين المستند بنجاح.');
        setDocFile(null);
        setDocTitle('');
        await fetchRequests();
      } else {
        setDocActionError(data.error || 'فشل رفع المستند.');
      }
    } catch {
      setDocActionError('خطأ في الاتصال بالخادم.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleArchiveDocument = async (docId: string) => {
    if (!confirm('هل أنت متأكد من أرشفة هذا المستند وحجبه؟')) return;

    setDocActionMessage(null);
    setDocActionError(null);

    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDocActionMessage('تمت أرشفة المستند بنجاح.');
        await fetchRequests();
      } else {
        setDocActionError(data.error || 'فشلت أرشفة المستند.');
      }
    } catch {
      setDocActionError('خطأ في الاتصال بالخادم.');
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

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
              إدارة ومتابعة طلبات الخدمات الأمنية
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              تحديث مسارات العمل الميداني، إصدار التقارير الأمنية، وإدارة مستندات العمليات
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="badge badge-gold">
              إجمالي الطلبات: {requests.length}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingRight: '2.5rem', fontSize: '0.88rem' }}
              placeholder="البحث برقم الطلب، اسم الجهة، أو اسم الخدمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select"
              style={{ fontSize: '0.88rem' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">كافة الحالات</option>
              <option value="NEW">جديد (NEW)</option>
              <option value="UNDER_REVIEW">قيد المراجعة (UNDER_REVIEW)</option>
              <option value="CONTACTED">تم التواصل (CONTACTED)</option>
              <option value="WAITING_FOR_CLIENT">بانتظار العميل (WAITING_FOR_CLIENT)</option>
              <option value="APPROVED">معتمد (APPROVED)</option>
              <option value="IN_PROGRESS">تنفيذ ميداني (IN_PROGRESS)</option>
              <option value="COMPLETED">مكتمل (COMPLETED)</option>
              <option value="CANCELLED">ملغي (CANCELLED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            جارٍ تحميل بيانات الطلبات...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            لا توجد طلبات تطابق معايير البحث الحالية.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>الجهة والاتصال</th>
                  <th>الخدمة المطلوبة</th>
                  <th>الأولوية</th>
                  <th>الحالة</th>
                  <th>المستندات</th>
                  <th>تاريخ التقديم</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const docCount = (req.documents || []).filter(d => !d.isArchived).length;
                  const hasFinalReport = (req.documents || []).some(d => d.documentType === 'FINAL_REPORT' && !d.isArchived);

                  return (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>
                        {req.requestNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#FFF' }}>{req.organization}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {req.contactName} • {req.contactPhone}
                        </div>
                      </td>
                      <td>{req.service.titleAr}</td>
                      <td>
                        <span className={`badge ${req.priority === 'URGENT' ? 'badge-red' : req.priority === 'HIGH' ? 'badge-yellow' : 'badge-gold'}`}>
                          {req.priority}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${req.status === 'COMPLETED' ? 'badge-green' : req.status === 'CANCELLED' ? 'badge-red' : 'badge-blue'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                            {docCount} ملف
                          </span>
                          {hasFinalReport && (
                            <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '0.15rem 0.4rem' }}>
                              تقرير جاهز
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(req.createdAt).toLocaleDateString('ar-YE')}
                      </td>
                      <td>
                        <button
                          onClick={() => openEditor(req)}
                          className="btn btn-gold btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                        >
                          <Edit3 size={14} />
                          <span>إدارة ومستندات</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operation Drawer / Modal */}
      {selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
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
              maxWidth: '750px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '2px solid var(--color-gold)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-gold-light)', margin: 0 }}>
                  إدارة الطلب: {selectedReq.requestNumber}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedReq.organization} — {selectedReq.service.titleAr}
                </span>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Sub-Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'status_notes' ? 'btn-gold' : 'btn-outline'}`}
                onClick={() => setActiveTab('status_notes')}
                style={{ fontSize: '0.82rem' }}
              >
                <Edit3 size={15} />
                <span>الحالة والملاحظات</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${activeTab === 'documents' ? 'btn-gold' : 'btn-outline'}`}
                onClick={() => setActiveTab('documents')}
                style={{ fontSize: '0.82rem' }}
              >
                <FileText size={15} />
                <span>المستندات والتقرير النهائي ({selectedReq.documents?.filter(d => !d.isArchived).length || 0})</span>
              </button>
            </div>

            {/* TAB 1: Status & Operational Notes */}
            {activeTab === 'status_notes' && (
              <div>
                {successMessage && (
                  <div style={{ padding: '0.85rem', background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', color: '#34D399', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div style={{ padding: '0.85rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#F87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                    {errorMessage}
                  </div>
                )}

                {/* Scope Summary */}
                <div style={{ padding: '0.85rem', background: 'rgba(5,14,9,0.6)', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <strong style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', display: 'block', marginBottom: '0.3rem' }}>
                    شرح نطاق الطلب من العميل:
                  </strong>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    {selectedReq.description}
                  </p>
                </div>

                <form onSubmit={handleSaveUpdate}>
                  <div className="form-group">
                    <label className="form-label">الحالة التشغيلية للطلب</label>
                    <select
                      className="form-select"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="NEW">طلب جديد (NEW)</option>
                      <option value="UNDER_REVIEW">قيد المراجعة والتقييم الأولي (UNDER_REVIEW)</option>
                      <option value="CONTACTED">تم الاتصال بالعميل (CONTACTED)</option>
                      <option value="WAITING_FOR_CLIENT">بانتظار مستندات العميل (WAITING_FOR_CLIENT)</option>
                      <option value="APPROVED">تمت الموافقة واعتماد الخطة (APPROVED)</option>
                      <option value="IN_PROGRESS">تنفيذ ميداني ونشر الكوادر (IN_PROGRESS)</option>
                      <option value="COMPLETED">مكتمل ومسلّم بنجاح (COMPLETED)</option>
                      <option value="CANCELLED">ملغي (CANCELLED)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">إضافة ملاحظة أو تحديث تشغيلي</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="اكتب تفاصيل التحديث أو الملاحظة الميدانية..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
                    <input
                      type="checkbox"
                      id="clientVisibleCheck"
                      checked={isClientVisibleNote}
                      onChange={(e) => setIsClientVisibleNote(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)' }}
                    />
                    <label htmlFor="clientVisibleCheck" style={{ fontSize: '0.85rem', color: '#FFF', cursor: 'pointer' }}>
                      إظهار هذه الملاحظة للعميل في بوابة المتابعة (Client-Visible Note)
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedReq(null)}
                      className="btn btn-outline btn-sm"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="btn btn-gold btn-sm"
                      disabled={saving}
                    >
                      {saving ? 'جارٍ الحفظ...' : 'حفظ التحديثات'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: Documents & Final Security Reports */}
            {activeTab === 'documents' && (
              <div>
                {docActionMessage && (
                  <div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', color: '#34D399', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={16} />
                    <span>{docActionMessage}</span>
                  </div>
                )}

                {docActionError && (
                  <div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#F87171', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} />
                    <span>{docActionError}</span>
                  </div>
                )}

                {/* Existing Documents List */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', marginBottom: '0.8rem' }}>
                    مستندات وتقارير هذا الطلب
                  </h4>

                  {(!selectedReq.documents || selectedReq.documents.filter(d => !d.isArchived).length === 0) ? (
                    <div style={{ padding: '1.5rem', background: 'rgba(5,14,9,0.5)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                      لا توجد مستندات مرفوعة لهذا الطلب حتى الآن.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {selectedReq.documents.filter(d => !d.isArchived).map((doc) => {
                        const isFinal = doc.documentType === 'FINAL_REPORT';
                        const isInternal = doc.visibility === 'INTERNAL_ONLY';

                        return (
                          <div
                            key={doc.id}
                            style={{
                              padding: '0.85rem 1rem',
                              background: isFinal ? 'rgba(197,155,39,0.15)' : 'rgba(11,37,24,0.5)',
                              border: isFinal ? '1px solid var(--color-gold)' : '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: '0.8rem',
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <span style={{ fontWeight: 700, color: '#FFF', fontSize: '0.9rem' }}>
                                  {doc.title}
                                </span>
                                {isFinal && (
                                  <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                                    التقرير النهائي (FINAL_REPORT)
                                  </span>
                                )}
                                {isInternal ? (
                                  <span className="badge badge-red" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Lock size={10} />
                                    <span>داخلي سري (INTERNAL_ONLY)</span>
                                  </span>
                                ) : (
                                  <span className="badge badge-blue" style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    <Eye size={10} />
                                    <span>مرئي للعميل (CLIENT_VISIBLE)</span>
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {doc.originalFilename} • {new Date(doc.createdAt).toLocaleDateString('ar-YE')} • {doc.sizeBytes ? (doc.sizeBytes / 1024).toFixed(0) + ' KB' : ''}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <a
                                href={`/api/documents/${doc.id}/download`}
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                title="تنزيل المستند"
                              >
                                <Download size={13} />
                                <span>تنزيل</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleArchiveDocument(doc.id)}
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: '#F87171' }}
                                title="أرشفة وحجب المستند"
                              >
                                <Trash2 size={13} />
                                <span>أرشفة</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Upload Form */}
                <div style={{ padding: '1.2rem', background: 'rgba(5,14,9,0.7)', borderRadius: '8px', border: '1px dashed rgba(197,155,39,0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                    <UploadCloud size={18} style={{ color: 'var(--color-gold)' }} />
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFF', margin: 0 }}>
                      رفع مستند جديد أو إصدار التقرير الأمني
                    </h4>
                  </div>

                  <form onSubmit={handleUploadDocument}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '0.8rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>عنوان المستند</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '0.85rem' }}
                          placeholder="مثال: تقرير التقييم الأمني الميداني"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>نوع المستند (Document Type)</label>
                        <select
                          className="form-select"
                          style={{ fontSize: '0.85rem' }}
                          value={docType}
                          onChange={(e) => {
                            setDocType(e.target.value);
                            if (e.target.value === 'FINAL_REPORT') {
                              setDocVisibility('CLIENT_VISIBLE');
                            }
                          }}
                        >
                          <option value="INTERNAL_DOCUMENT">مستند داخلي لغرفة العمليات (INTERNAL_DOCUMENT)</option>
                          <option value="CLIENT_ATTACHMENT">مرفق إجرائي داعم (CLIENT_ATTACHMENT)</option>
                          <option value="FINAL_REPORT">تقرير أمني نهائي (FINAL_REPORT)</option>
                        </select>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.78rem' }}>مستوى الظهور (Visibility)</label>
                        <select
                          className="form-select"
                          style={{ fontSize: '0.85rem' }}
                          value={docVisibility}
                          onChange={(e) => setDocVisibility(e.target.value)}
                        >
                          <option value="INTERNAL_ONLY">سري داخلي فقط (INTERNAL_ONLY)</option>
                          <option value="CLIENT_VISIBLE">مرئي للعميل في بوابته (CLIENT_VISIBLE)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label className="form-label" style={{ fontSize: '0.78rem' }}>
                        الملف (PDF, PNG, JPG — بحد أقصى 4.5MB)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const f = e.target.files[0];
                            setDocFile(f);
                            if (!docTitle) {
                              setDocTitle(f.name.replace(/\.[^/.]+$/, ''));
                            }
                          }
                        }}
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                      <button
                        type="submit"
                        className="btn btn-gold btn-sm"
                        disabled={uploadingDoc || !docFile}
                        style={{ fontSize: '0.82rem', padding: '0.45rem 1.2rem' }}
                      >
                        {uploadingDoc ? 'جارٍ الرفع والتأمين...' : 'رفع وتأمين المستند'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
