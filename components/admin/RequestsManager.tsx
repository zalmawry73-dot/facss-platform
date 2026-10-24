'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  AlertTriangle,
  GraduationCap,
  Package,
  Truck,
  Plus,
  RefreshCw
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

export interface StaffMember {
  id: string;
  fullName: string;
  email?: string;
  role?: string;
}

interface Props {
  initialRequests?: ServiceRequestItem[];
  staffList?: StaffMember[];
}

export default function RequestsManager({ initialRequests, staffList }: Props) {
  const { tx, txLocale } = useAdminT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<ServiceRequestItem[]>(initialRequests || []);
  const [loading, setLoading] = useState(!initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Staff list & assignment state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(staffList || []);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');

  // Course conversion state
  const [convertingToCourse, setConvertingToCourse] = useState(false);
  const [convertedCourseInfo, setConvertedCourseInfo] = useState<{
    id: string;
    title: string;
    slug: string;
    message: string;
  } | null>(null);

  // Selected request for editing
  const [selectedReq, setSelectedReq] = useState<ServiceRequestItem | null>(null);
  const [activeTab, setActiveTab] = useState<'status_notes' | 'documents' | 'equipment_supply'>('status_notes');
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isClientVisibleNote, setIsClientVisibleNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Equipment Supply Integration State
  const [supplyLoading, setSupplyLoading] = useState(false);
  const [supplyData, setSupplyData] = useState<any>(null);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [supplyActionLoading, setSupplyActionLoading] = useState(false);
  const [supplyMessage, setSupplyMessage] = useState<string | null>(null);
  const [supplyError, setSupplyError] = useState<string | null>(null);
  const [showAddSupplyForm, setShowAddSupplyForm] = useState(false);
  const [newSupplyItem, setNewSupplyItem] = useState({
    productId: '',
    quantityRequested: 1,
    specifications: '',
    notes: '',
  });

  // Document upload state
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('INTERNAL_DOCUMENT');
  const [docVisibility, setDocVisibility] = useState('INTERNAL_ONLY');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docActionMessage, setDocActionMessage] = useState<string | null>(null);
  const [docActionError, setDocActionError] = useState<string | null>(null);

  // Fetch supply data for the active request
  const fetchSupplyData = async (reqId: string) => {
    try {
      setSupplyLoading(true);
      setSupplyError(null);
      const [resSupply, resProds] = await Promise.all([
        fetch(`/api/admin/equipment/supply-requests?serviceRequestId=${reqId}`),
        fetch('/api/admin/equipment/products'),
      ]);
      const dataSupply = await resSupply.json();
      const dataProds = await resProds.json();

      if (dataSupply.success && dataSupply.requests && dataSupply.requests.length > 0) {
        setSupplyData(dataSupply.requests[0]);
      } else {
        setSupplyData(null);
      }
      if (dataProds.success && Array.isArray(dataProds.products)) {
        setAvailableProducts(dataProds.products);
        if (dataProds.products.length > 0 && !newSupplyItem.productId) {
          setNewSupplyItem((prev) => ({ ...prev, productId: dataProds.products[0].id }));
        }
      }
    } catch (err: any) {
      console.error('Error fetching supply data:', err);
      setSupplyError(err.message || tx('تعذر جلب بيانات توريد المعدات'));
    } finally {
      setSupplyLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReq && activeTab === 'equipment_supply') {
      fetchSupplyData(selectedReq.id);
    }
  }, [selectedReq?.id, activeTab]);

  const handleReserveStock = async (itemId?: string) => {
    if (!selectedReq || !supplyData) return;
    try {
      setSupplyActionLoading(true);
      setSupplyMessage(null);
      setSupplyError(null);

      const itemsToReserve = (supplyData.supplyItems || [])
        .filter((it: any) => (!itemId || it.id === itemId) && it.quantityReserved < it.quantityRequested)
        .map((it: any) => {
          const needed = it.quantityRequested - it.quantityReserved;
          const qty = Math.min(needed, it.productAvailableStock ?? 0);
          return {
            productId: it.productId,
            quantityToReserve: qty,
          };
        })
        .filter((it: any) => it.quantityToReserve > 0);

      if (itemsToReserve.length === 0) {
        throw new Error(tx('لا توجد أصناف تتوفر لها كميات متاحة بالمخزون للحجز حالياً'));
      }

      const res = await fetch(`/api/admin/equipment/supply-requests/${selectedReq.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToReserve }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx('فشل حجز المخزون'));

      setSupplyMessage(data.message || tx('تم حجز الكميات المطلوبة من المخزون بنجاح'));
      await fetchSupplyData(selectedReq.id);
    } catch (err: any) {
      setSupplyError(err.message);
    } finally {
      setSupplyActionLoading(false);
    }
  };

  const handleReleaseStock = async () => {
    if (!selectedReq) return;
    try {
      setSupplyActionLoading(true);
      setSupplyMessage(null);
      setSupplyError(null);

      const res = await fetch(`/api/admin/equipment/supply-requests/${selectedReq.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx('فشل تحرير الحجز'));

      setSupplyMessage(data.message || tx('تم تحرير حجز الكميات وإعادتها للمخزون المتاح'));
      await fetchSupplyData(selectedReq.id);
    } catch (err: any) {
      setSupplyError(err.message);
    } finally {
      setSupplyActionLoading(false);
    }
  };

  const handleAddSupplyItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !newSupplyItem.productId) return;
    try {
      setSupplyActionLoading(true);
      setSupplyMessage(null);
      setSupplyError(null);

      const res = await fetch('/api/admin/equipment/supply-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: selectedReq.id,
          items: [
            {
              productId: newSupplyItem.productId,
              quantityRequested: Number(newSupplyItem.quantityRequested),
              specifications: newSupplyItem.specifications,
              notes: newSupplyItem.notes,
            },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx('فشل إضافة صنف التوريد'));

      setSupplyMessage(tx('تم إضافة صنف التوريد وتحديث حالة طلب الخدمة'));
      setShowAddSupplyForm(false);
      setNewSupplyItem({
        productId: availableProducts[0]?.id || '',
        quantityRequested: 1,
        specifications: '',
        notes: '',
      });
      await fetchSupplyData(selectedReq.id);
    } catch (err: any) {
      setSupplyError(err.message);
    } finally {
      setSupplyActionLoading(false);
    }
  };

  // Fetch staff list if not provided
  useEffect(() => {
    if (staffMembers.length === 0) {
      fetch('/api/admin/staff')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (Array.isArray(data?.staff)) setStaffMembers(data.staff);
        })
        .catch(() => {});
    }
  }, [staffMembers.length]);

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
    setAssignedEmployeeId(req.assignedEmployee?.id || '');
    setNewNote('');
    setIsClientVisibleNote(false);
    setSuccessMessage(null);
    setErrorMessage(null);
    setDocActionMessage(null);
    setDocActionError(null);
    setConvertedCourseInfo(null);
    setSupplyMessage(null);
    setSupplyError(null);
    setShowAddSupplyForm(false);
    setActiveTab('status_notes');
  };

  const handleCloseModal = () => {
    setSelectedReq(null);
    setConvertedCourseInfo(null);
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
          assignedEmployeeId: assignedEmployeeId || null,
          note: newNote.trim() ? newNote.trim() : undefined,
          isClientVisible: isClientVisibleNote,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(tx("تم تحديث حالة الطلب وإسناد الموظف وتسجيل الملاحظة بنجاح."));
        setNewNote('');
        setIsClientVisibleNote(false);
        const assignedStaffObj = staffMembers.find((s) => s.id === assignedEmployeeId);
        setSelectedReq((prev) =>
          prev
            ? {
                ...prev,
                status: newStatus,
                assignedEmployee: assignedStaffObj
                  ? { id: assignedStaffObj.id, fullName: assignedStaffObj.fullName }
                  : null,
              }
            : null
        );
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

  const handleConvertToCourse = async () => {
    if (!selectedReq) return;
    setConvertingToCourse(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/admin/requests/${selectedReq.id}/convert-to-course`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConvertedCourseInfo({
          id: data.courseId,
          title: data.courseTitle,
          slug: data.courseSlug,
          message: data.message,
        });
        setNewStatus('APPROVED');
        setSelectedReq((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
        await fetchRequests();
      } else {
        setErrorMessage(data.error || tx("فشل تحويل الطلب لدورة تدريبية."));
      }
    } catch {
      setErrorMessage(tx("حدث خطأ في الاتصال بالخادم."));
    } finally {
      setConvertingToCourse(false);
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
            color: 'var(--color-gold-600)',
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
      key: 'assignedEmployee',
      header: tx("الموظف المسؤول"),
      render: (req) => (
        <span
          style={{
            fontSize: '0.82rem',
            color: req.assignedEmployee ? 'var(--color-gold-700)' : 'var(--text-muted)',
            fontWeight: req.assignedEmployee ? 700 : 400,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {req.assignedEmployee ? (
            <>
              <User size={13} style={{ color: 'var(--color-gold-600)' }} />
              <span>{req.assignedEmployee.fullName}</span>
            </>
          ) : (
            <span>{tx("غير مسند")}</span>
          )}
        </span>
      ),
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
          <span style={{ fontSize: '0.78rem', color: 'var(--color-gold-700)', fontWeight: 700 }}>
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

                <div className="admin-card-row">
                  <span className="admin-card-label">{tx("الموظف المسؤول:")}</span>
                  <span className="admin-card-value" style={{ color: req.assignedEmployee ? 'var(--color-gold-700)' : 'var(--text-muted)', fontWeight: req.assignedEmployee ? 700 : 400 }}>
                    {req.assignedEmployee ? req.assignedEmployee.fullName : tx("غير مسند")}
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
              {
                id: 'equipment_supply',
                label: tx("المعدات وتجهيزات السلامة"),
                icon: Package,
                count: supplyData?.supplyItems?.length || 0,
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
                    color: 'var(--color-gold-700)',
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

              {/* Converted Course Success Banner */}
              {convertedCourseInfo && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <AdminAlert
                    variant="success"
                    title={tx("تم تحويل الطلب لدورة خاصة بنجاح")}
                  >
                    <div>
                      <span>{convertedCourseInfo.message}</span>
                      <div style={{ marginTop: '0.5rem' }}>
                        <Link
                          href="/admin/training"
                          target="_blank"
                          className="btn btn-sm btn-gold"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                        >
                          <GraduationCap size={15} />
                          <span>{tx("فتح لوحة إدارة الأكاديمية والتدريب")}</span>
                        </Link>
                      </div>
                    </div>
                  </AdminAlert>
                </div>
              )}

              {/* Training Provisioning Integration Card */}
              {(selectedReq.service.titleAr.includes('تدريب') ||
                selectedReq.service.titleAr.includes('بناء القدرات') ||
                selectedReq.description.includes('تدريب') ||
                selectedReq.description.toLowerCase().includes('training')) &&
                !convertedCourseInfo && (
                  <div
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      marginBottom: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <GraduationCap size={22} style={{ color: 'var(--facss-gold-400, #D4AF37)' }} />
                      <div>
                        <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)', display: 'block' }}>
                          {tx("طلب خدمة تدريبية — تكامل مباشر مع الأكاديمية")}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {tx("يمكنك تحويل هذا الطلب آلياً إلى دورة تدريبية خاصة لجهة العميل بالأكاديمية.")}
                        </span>
                      </div>
                    </div>

                    <AdminButton
                      variant="secondary"
                      size="sm"
                      icon={<GraduationCap size={15} />}
                      loading={convertingToCourse}
                      disabled={convertingToCourse}
                      onClick={handleConvertToCourse}
                      style={{ borderColor: 'rgba(212, 175, 55, 0.5)', color: 'var(--facss-gold-400, #D4AF37)' }}
                    >
                      {convertingToCourse ? tx("جارٍ التحويل...") : tx("تحويل إلى دورة خاصة")}
                    </AdminButton>
                  </div>
                )}

              <form onSubmit={handleSaveUpdate}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
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

                  <AdminSelect
                    label={tx("الموظف / الضابط المسؤول عن متابعة الطلب (Assigned Staff)")}
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                  >
                    <option value="">{tx("-- بدون إسناد (قيد الانتظار) --")}</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} {s.role ? `(${s.role})` : ''}
                      </option>
                    ))}
                  </AdminSelect>
                </div>

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
                              background: isFinal ? 'rgba(181, 146, 84, 0.08)' : 'var(--surface-bg)',
                              border: isFinal ? '1px solid var(--color-gold-500)' : '1px solid var(--admin-card-border)',
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

          {/* TAB 3: Equipment & Supply Management Integration */}
          {activeTab === 'equipment_supply' && (
            <div>
              {supplyMessage && (
                <div style={{ marginBottom: '1rem' }}>
                  <AdminAlert variant="success" onClose={() => setSupplyMessage(null)}>
                    {supplyMessage}
                  </AdminAlert>
                </div>
              )}
              {supplyError && (
                <div style={{ marginBottom: '1rem' }}>
                  <AdminAlert variant="danger" onClose={() => setSupplyError(null)}>
                    {supplyError}
                  </AdminAlert>
                </div>
              )}

              {/* Top Overview & Actions Bar */}
              <div
                style={{
                  padding: '1rem',
                  background: 'var(--surface-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--admin-card-border)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={16} style={{ color: 'var(--facss-gold-400)' }} />
                    <span>{tx("حالة توريد وتجهيزات السلامة للطلب:")}</span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        background:
                          supplyData?.fulfillmentStatus === 'DELIVERED'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : supplyData?.isFullyReserved
                            ? 'rgba(59, 130, 246, 0.15)'
                            : supplyData?.hasShortage
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(234, 179, 8, 0.15)',
                        color:
                          supplyData?.fulfillmentStatus === 'DELIVERED'
                            ? '#4ADE80'
                            : supplyData?.isFullyReserved
                            ? '#60A5FA'
                            : supplyData?.hasShortage
                            ? '#F87171'
                            : '#FACC15',
                        fontWeight: 700,
                      }}
                    >
                      {supplyData?.fulfillmentStatus === 'DELIVERED'
                        ? tx('تم التسليم للعميل (DELIVERED)')
                        : supplyData?.isFullyReserved
                        ? tx('محجوز بالكامل من المخزون (FULLY_RESERVED)')
                        : supplyData?.hasShortage
                        ? tx('يوجد عجز بالمخزون (SHORTAGE)')
                        : supplyData?.supplyItems?.length
                        ? tx('بانتظار الحجز (PENDING_RESERVATION)')
                        : tx('لا توجد أصناف توريد مضافة')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {tx("إجمالي البنود: {0} | المحجوز كلياً: {1} قطعة", 
                      supplyData?.supplyItems?.length || 0,
                      supplyData?.supplyItems?.reduce((s: number, i: any) => s + (i.quantityReserved || 0), 0) || 0
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <AdminButton
                    size="sm"
                    variant="outline"
                    icon={<RefreshCw size={12} className={supplyLoading ? 'animate-spin' : ''} />}
                    onClick={() => fetchSupplyData(selectedReq.id)}
                  >
                    {tx("تحديث")}
                  </AdminButton>

                  <AdminButton
                    size="sm"
                    variant="primary"
                    icon={<CheckCircle2 size={13} />}
                    loading={supplyActionLoading}
                    onClick={() => handleReserveStock()}
                    disabled={!supplyData?.supplyItems?.length || supplyData?.isFullyReserved}
                  >
                    {tx("حجز تلقائي من المخزون")}
                  </AdminButton>

                  {supplyData?.supplyItems?.some((i: any) => i.quantityReserved > 0) && (
                    <AdminButton
                      size="sm"
                      variant="outline"
                      loading={supplyActionLoading}
                      onClick={handleReleaseStock}
                    >
                      {tx("تحرير الحجز")}
                    </AdminButton>
                  )}

                  <AdminButton
                    size="sm"
                    variant="secondary"
                    icon={<Plus size={13} />}
                    onClick={() => setShowAddSupplyForm(!showAddSupplyForm)}
                  >
                    {showAddSupplyForm ? tx("إلغاء الإضافة") : tx("إضافة صنف")}
                  </AdminButton>
                </div>
              </div>

              {/* Add Item Sub-Form */}
              {showAddSupplyForm && (
                <form
                  onSubmit={handleAddSupplyItem}
                  style={{
                    background: 'rgba(212, 175, 55, 0.05)',
                    border: '1px solid rgba(212, 175, 55, 0.25)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                  }}
                >
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                    {tx("إضافة صنف تجهيزات وسلامة إلى نطاق طلب الخدمة:")}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        {tx("صنف المعدات والمخزون")} <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select
                        className="admin-select"
                        required
                        value={newSupplyItem.productId}
                        onChange={(e) => setNewSupplyItem({ ...newSupplyItem, productId: e.target.value })}
                        style={{ width: '100%', height: 'var(--admin-control-height-md)', margin: 0 }}
                      >
                        <option value="">{tx("— اختر الصنف —")}</option>
                        {availableProducts.map((p) => {
                          const avail = p.quantityAvailable ?? Math.max(0, p.quantityOnHand - p.quantityReserved);
                          return (
                            <option key={p.id} value={p.id}>
                              {p.sku} - {p.nameAr} ({tx("المتاح بالمستودع:")} {avail} {p.unit})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                        {tx("الكمية المطلوبة")} <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="admin-input"
                        value={newSupplyItem.quantityRequested}
                        onChange={(e) => setNewSupplyItem({ ...newSupplyItem, quantityRequested: Math.max(1, Number(e.target.value)) })}
                        style={{ width: '100%', height: 'var(--admin-control-height-md)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input
                      type="text"
                      placeholder={tx("المواصفات الفنية المطلوبة (مثال: طراز ABC، سعة 6 كجم)...")}
                      className="admin-input"
                      value={newSupplyItem.specifications}
                      onChange={(e) => setNewSupplyItem({ ...newSupplyItem, specifications: e.target.value })}
                      style={{ height: 'var(--admin-control-height-md)', fontSize: '0.82rem' }}
                    />
                    <input
                      type="text"
                      placeholder={tx("ملاحظات البند التشغيلية...")}
                      className="admin-input"
                      value={newSupplyItem.notes}
                      onChange={(e) => setNewSupplyItem({ ...newSupplyItem, notes: e.target.value })}
                      style={{ height: 'var(--admin-control-height-md)', fontSize: '0.82rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <AdminButton size="sm" variant="outline" type="button" onClick={() => setShowAddSupplyForm(false)}>
                      {tx("إلغاء")}
                    </AdminButton>
                    <AdminButton size="sm" variant="primary" type="submit" loading={supplyActionLoading}>
                      {tx("إضافة الصنف وتحديث الطلب")}
                    </AdminButton>
                  </div>
                </form>
              )}

              {/* Items List Table */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {tx("أصناف التجهيزات المربوطة بالطلب:")}
                </div>

                {supplyLoading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
                    <div>{tx("جاري جلب بيانات المخزون والحجوزات...")}</div>
                  </div>
                ) : !supplyData?.supplyItems || supplyData.supplyItems.length === 0 ? (
                  <div
                    style={{
                      padding: '1.5rem',
                      textAlign: 'center',
                      background: 'var(--surface-bg)',
                      borderRadius: '8px',
                      border: '1px dashed var(--admin-card-border)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <Package size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
                    <p style={{ margin: 0, fontSize: '0.86rem' }}>
                      {tx("لم يتم إدراج أصناف معدات وتجهيزات أمنية أو سلامة لهذا الطلب حتى الآن.")}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddSupplyForm(true)}
                      style={{
                        marginTop: '0.75rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--facss-gold-400)',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {tx("+ انقر هنا لإضافة أول صنف")}
                    </button>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid var(--admin-card-border)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'right' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-sunken)', borderBottom: '1px solid var(--admin-card-border)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.6rem 0.75rem' }}>{tx("الرمز SKU")}</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>{tx("بيان الصنف")}</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>{tx("المطلوب")}</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>{tx("المحجوز")}</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>{tx("المتاح بالمخزون")}</th>
                          <th style={{ padding: '0.6rem 0.75rem' }}>{tx("حالة الحجز")}</th>
                          <th style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>{tx("إجراء")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplyData.supplyItems.map((it: any) => {
                          const isFullyReserved = it.quantityReserved >= it.quantityRequested;
                          const hasShortage = (it.shortage ?? 0) > 0;
                          return (
                            <tr key={it.id} style={{ borderBottom: '1px solid var(--admin-card-border)' }}>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--facss-gold-400)' }}>
                                {it.product?.sku}
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {it.product?.nameAr}
                                {it.specifications && (
                                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                                    {it.specifications}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700 }}>
                                {it.quantityRequested} {it.product?.unit}
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: isFullyReserved ? '#4ADE80' : '#FACC15' }}>
                                {it.quantityReserved} {it.product?.unit}
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem', color: (it.productAvailableStock ?? 0) > 0 ? 'var(--text-primary)' : '#EF4444' }}>
                                {it.productAvailableStock ?? 0} {it.product?.unit}
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem' }}>
                                {isFullyReserved ? (
                                  <span style={{ fontSize: '0.72rem', padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ADE80', fontWeight: 700 }}>
                                    {tx("محجوز بالكامل")}
                                  </span>
                                ) : hasShortage ? (
                                  <span style={{ fontSize: '0.72rem', padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', fontWeight: 700 }}>
                                    {tx("عجز: {0}", it.shortage)}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.72rem', padding: '0.12rem 0.45rem', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.15)', color: '#FACC15', fontWeight: 700 }}>
                                    {tx("جاهز للحجز")}
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>
                                {!isFullyReserved && (it.productAvailableStock ?? 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleReserveStock(it.id)}
                                    style={{
                                      background: 'none',
                                      border: '1px solid var(--facss-gold-400)',
                                      color: 'var(--facss-gold-400)',
                                      padding: '0.2rem 0.5rem',
                                      borderRadius: '4px',
                                      fontSize: '0.74rem',
                                      cursor: 'pointer',
                                      fontWeight: 600,
                                    }}
                                  >
                                    {tx("حجز")}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Deliveries & Dispatch History */}
              {supplyData?.equipmentDeliveries && supplyData.equipmentDeliveries.length > 0 && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--surface-bg)', borderRadius: '8px', border: '1px solid var(--admin-card-border)' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Truck size={16} style={{ color: 'var(--facss-gold-400)' }} />
                    <span>{tx("محاضر التسليم والتسليمات المعتمدة للطلب:")}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {supplyData.equipmentDeliveries.map((del: any) => (
                      <div
                        key={del.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.6rem 0.75rem',
                          background: 'var(--surface-sunken)',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--facss-gold-400)', fontFamily: 'monospace' }}>
                            {del.deliveryNumber}
                          </strong>
                          <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>•</span>
                          <span>{tx("المستلم:")} {del.receivedByName}</span>
                          <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>•</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(del.deliveryDate).toLocaleDateString('ar-YE')}</span>
                        </div>
                        <Link
                          href="/admin/equipment"
                          target="_blank"
                          style={{
                            color: 'var(--facss-gold-400)',
                            fontSize: '0.78rem',
                            textDecoration: 'none',
                            fontWeight: 700,
                          }}
                        >
                          {tx("عرض في سجل المعدات ←")}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Quick Link */}
              <div style={{ marginTop: '1.25rem', textAlign: 'center', borderTop: '1px solid var(--admin-card-border)', paddingTop: '0.75rem' }}>
                <Link
                  href="/admin/equipment"
                  target="_blank"
                  style={{
                    color: 'var(--facss-gold-400)',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Package size={14} />
                  <span>{tx("فتح لوحة إدارة المعدات وسلاسل الإمداد الكاملة")}</span>
                </Link>
              </div>
            </div>
          )}
        </AdminModal>
      )}
    </div>
  );
}
