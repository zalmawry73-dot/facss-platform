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
  X 
} from 'lucide-react';

interface ServiceRequestItem {
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
}

export default function AdminRequestsManager() {
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected request for editing
  const [selectedReq, setSelectedReq] = useState<ServiceRequestItem | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isClientVisibleNote, setIsClientVisibleNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openEditor = (req: ServiceRequestItem) => {
    setSelectedReq(req);
    setNewStatus(req.status);
    setNewNote('');
    setIsClientVisibleNote(false);
    setSuccessMessage(null);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;
    setSaving(true);
    setSuccessMessage(null);

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
        alert('حدث خطأ أثناء حفظ التحديث');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
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
              تحديث مسارات العمل الميداني، إسناد الكوادر، وإرسال التقارير للعملاء
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="بحث برقم الطلب أو المنشأة..."
                style={{ width: '260px', paddingInlineStart: '2rem' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', insetInlineStart: '0.7rem', color: 'var(--text-subtle)' }} />
            </div>

            <select
              className="form-select"
              style={{ width: '180px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">كافة الحالات</option>
              <option value="NEW">جديد (NEW)</option>
              <option value="UNDER_REVIEW">قيد المراجعة</option>
              <option value="APPROVED">معتمد</option>
              <option value="IN_PROGRESS">تنفيذ ميداني</option>
              <option value="REPORT_READY">التقرير جاهز</option>
              <option value="COMPLETED">مكتمل</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-gold-light)' }}>جارٍ تحميل الطلبات...</p>
        ) : filteredRequests.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>لا توجد طلبات مطابقة لمعايير البحث.</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>المنشأة / العميل</th>
                  <th>الخدمة الأمنية</th>
                  <th>الأولوية</th>
                  <th>الحالة التشغيلية</th>
                  <th>التاريخ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 800, color: 'var(--color-gold-light)' }}>
                      {req.requestNumber}
                    </td>
                    <td>
                      <strong style={{ display: 'block', color: '#FFF' }}>{req.organization}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.contactName}</span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{req.service.titleAr}</td>
                    <td>
                      <span className={`badge ${req.priority === 'URGENT' ? 'badge-red' : req.priority === 'HIGH' ? 'badge-yellow' : 'badge-gold'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-green">
                        {req.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(req.createdAt).toLocaleDateString('ar-YE')}
                    </td>
                    <td>
                      <button
                        onClick={() => openEditor(req)}
                        className="btn btn-gold btn-sm"
                        style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Edit3 size={14} />
                        <span>إدارة وتحديث</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Slide-over for Updating Request */}
      {selectedReq && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
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
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '2px solid var(--color-gold)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-gold-light)', margin: 0 }}>
                  تحديث الطلب: {selectedReq.requestNumber}
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

            {successMessage && (
              <div style={{ padding: '0.85rem', background: 'rgba(16,185,129,0.15)', border: '1px solid #10B981', color: '#34D399', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {successMessage}
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
                  <option value="REPORT_READY">التقرير الأمني جاهز (REPORT_READY)</option>
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
        </div>
      )}
    </div>
  );
}
