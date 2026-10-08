'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  X,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Archive,
  Globe,
  Lock,
  BookOpen,
  Send,
  Eye,
  Check,
  RotateCcw,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  FolderLock,
  UserCheck,
  History,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
  AdminTabs,
  AdminAlert,
} from '@/components/admin/ui';


interface Category {
  id: string;
  titleAr: string;
  titleEn: string;
}

interface PublicationItem {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  summaryAr: string;
  summaryEn: string;
  contentAr: string;
  contentEn: string;
  author: string;
  categoryId: string;
  visibility: string;
  status: string;
  isFeatured: boolean;
  viewsCount: number;
  publicationDate: string;
  category: { id: string; titleAr: string };
  submittedById?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
}

interface ReviewLogItem {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  reviewerName: string;
  comments: string | null;
  createdAt: string;
}

interface AccessGrantItem {
  id: string;
  publicationId: string;
  grantedToUserId: string;
  isActive: boolean;
  createdAt: string;
  revokedAt?: string | null;
  revokedReason?: string | null;
  notes?: string | null;
  client?: {
    id: string;
    fullName: string;
    email: string;
    organization?: string | null;
  } | null;
}

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  organization?: string | null;
  role: string;
}

interface Props {
  initialPublications: PublicationItem[];
  categories: Category[];
}

const STATUS_LABELS: Record<string, string> = {
  get DRAFT() { return tx("مسودة"); },
  get SUBMITTED() { return tx("مرسلة للمراجعة"); },
  get UNDER_REVIEW() { return tx("قيد المراجعة"); },
  get APPROVED() { return tx("معتمدة"); },
  get REJECTED() { return tx("مرفوضة"); },
  get PUBLISHED() { return tx("منشورة"); },
  get ARCHIVED() { return tx("مؤرشفة"); },
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94A3B8',
  SUBMITTED: '#3B82F6',
  UNDER_REVIEW: '#A855F7',
  APPROVED: '#22C55E',
  REJECTED: '#EF4444',
  PUBLISHED: '#10B981',
  ARCHIVED: '#64748B',
};

export default function ResearchManager({ initialPublications, categories }: Props) {
  const { tx, txLocale } = useAdminT();
  const [publications, setPublications] = useState<PublicationItem[]>(initialPublications);
  const [activeTab, setActiveTab] = useState<'studies' | 'grants'>('studies');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPub, setEditingPub] = useState<PublicationItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Review Workflow State
  const [reviewModalTarget, setReviewModalTarget] = useState<PublicationItem | null>(null);
  const [reviewAction, setReviewAction] = useState<string>('APPROVE');
  const [reviewComments, setReviewComments] = useState('');
  const [processingReview, setProcessingReview] = useState(false);

  // Review Logs State
  const [logsModalTarget, setLogsModalTarget] = useState<PublicationItem | null>(null);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Access Grants State
  const [selectedGrantPubId, setSelectedGrantPubId] = useState<string>('');
  const [grants, setGrants] = useState<AccessGrantItem[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [availableClients, setAvailableClients] = useState<UserItem[]>([]);
  const [grantTargetUserId, setGrantTargetUserId] = useState('');
  const [grantNotes, setGrantNotes] = useState('');
  const [grantingAccess, setGrantingAccess] = useState(false);

  // Revoke Modal
  const [revokeTarget, setRevokeTarget] = useState<AccessGrantItem | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revoking, setRevoking] = useState(false);

  // Form State
  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    summaryAr: '',
    summaryEn: '',
    contentAr: '',
    contentEn: '',
    author: tx("وحدة التحليل والتقييم الميداني — المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية"),
    categoryId: categories[0]?.id || '',
    visibility: 'PUBLIC',
    status: 'DRAFT',
    isFeatured: false,
  });

  const clientOnlyPubs = publications.filter((p) => p.visibility === 'CLIENT_ONLY');

  // Load clients for granting access
  useEffect(() => {
    if (activeTab === 'grants') {
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.users)) {
            // Filter clients or all users
            setAvailableClients(data.users);
          }
        })
        .catch(console.error);

      if (clientOnlyPubs.length > 0 && !selectedGrantPubId) {
        setSelectedGrantPubId(clientOnlyPubs[0].id);
      }
    }
  }, [activeTab]);

  // Load grants when selected publication changes
  const loadGrants = async (pubId: string) => {
    if (!pubId) return;
    setGrantsLoading(true);
    try {
      const res = await fetch(`/api/admin/research/${pubId}/access-grants`);
      const data = await res.json();
      if (data.success) {
        setGrants(data.grants || []);
      }
    } catch (err) {
      console.error('Failed to load grants:', err);
    } finally {
      setGrantsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'grants' && selectedGrantPubId) {
      loadGrants(selectedGrantPubId);
    }
  }, [activeTab, selectedGrantPubId]);

  // Load review logs
  const loadReviewLogs = async (pub: PublicationItem) => {
    setLogsModalTarget(pub);
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/admin/research/${pub.id}/review`);
      const data = await res.json();
      if (data.success) {
        setReviewLogs(data.reviewLogs || []);
      }
    } catch (err) {
      console.error('Failed to load review logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPub(null);
    setForm({
      titleAr: '',
      titleEn: '',
      summaryAr: '',
      summaryEn: '',
      contentAr: '',
      contentEn: '',
      author: tx("وحدة التحليل والتقييم الميداني — المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية"),
      categoryId: categories[0]?.id || '',
      visibility: 'PUBLIC',
      status: 'DRAFT',
      isFeatured: false,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pub: PublicationItem) => {
    setEditingPub(pub);
    setForm({
      titleAr: pub.titleAr,
      titleEn: pub.titleEn,
      summaryAr: pub.summaryAr,
      summaryEn: pub.summaryEn,
      contentAr: pub.contentAr,
      contentEn: pub.contentEn,
      author: pub.author,
      categoryId: pub.categoryId,
      visibility: pub.visibility,
      status: pub.status || 'DRAFT',
      isFeatured: pub.isFeatured,
    });
    setFeedback(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const url = editingPub ? `/api/admin/research/${editingPub.id}` : '/api/admin/research';
      const method = editingPub ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || tx("فشلت العملية، يرجى مراجعة الحقول المطلوبة"));
      }

      if (editingPub) {
        setPublications((prev) =>
          prev.map((p) => (p.id === editingPub.id ? { ...data.publication, viewsCount: p.viewsCount } : p))
        );
        setFeedback({ type: 'success', message: tx("تم تحديث الدراسة [{0}] بنجاح", data.publication.titleAr) });
      } else {
        setPublications((prev) => [data.publication, ...prev]);
        setFeedback({ type: 'success', message: tx("تم حفظ مسودة الدراسة [{0}] بنجاح", data.publication.titleAr) });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Review Workflow Action
  const handleReviewActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalTarget) return;
    setProcessingReview(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/research/${reviewModalTarget.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          comments: reviewComments,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل تنفيذ إجراء المراجعة"));

      setPublications((prev) =>
        prev.map((p) => (p.id === reviewModalTarget.id ? { ...p, status: data.publication.status } : p))
      );

      setFeedback({ type: 'success', message: data.message || tx("تم تحديث حالة المراجعة بنجاح") });
      setReviewModalTarget(null);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setProcessingReview(false);
    }
  };

  // Quick action (e.g. submit for review, start review, publish)
  const handleQuickReview = async (pub: PublicationItem, action: string, comments?: string) => {
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/research/${pub.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل تنفيذ الإجراء"));

      setPublications((prev) =>
        prev.map((p) => (p.id === pub.id ? { ...p, status: data.publication.status } : p))
      );
      setFeedback({ type: 'success', message: data.message || tx("تم تحديث حالة الدراسة بنجاح") });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Grant Access
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrantPubId || !grantTargetUserId) return;
    setGrantingAccess(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/research/${selectedGrantPubId}/access-grants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantedToUserId: grantTargetUserId,
          notes: grantNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل منح التصريح"));

      setFeedback({ type: 'success', message: data.message || tx("تم منح تصريح الوصول بنجاح") });
      setIsGrantModalOpen(false);
      setGrantNotes('');
      await loadGrants(selectedGrantPubId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setGrantingAccess(false);
    }
  };

  // Revoke Access
  const handleRevokeAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrantPubId || !revokeTarget) return;
    setRevoking(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/research/${selectedGrantPubId}/access-grants`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grantId: revokeTarget.id,
          revokedReason: revokeReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل سحب التصريح"));

      setFeedback({ type: 'success', message: tx("تم سحب تصريح الوصول وتوثيق السبب في مسار التدقيق") });
      setRevokeTarget(null);
      await loadGrants(selectedGrantPubId);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setRevoking(false);
    }
  };

  const filtered = publications.filter((p) => {
    const matchesSearch =
      p.titleAr.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || (p.status || 'DRAFT') === statusFilter;
    const matchesVisibility = visibilityFilter === 'ALL' || p.visibility === visibilityFilter;
    return matchesSearch && matchesStatus && matchesVisibility;
  });

  return (
    <div>
      {/* Feedback Alert */}
      {feedback && (
        <div style={{ marginBottom: '1.25rem' }}>
          <AdminAlert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Admin Page Header */}
      <AdminPageHeader
        title={tx("إدارة الدراسات الأمنية ودورة المراجعة والاعتماد")}
        description={tx("إعداد الأوراق، مراجعتها، اعتمادها رسمياً، وتحديد ضوابط الوصول والسرية وتصاريح العملاء")}
        actions={
          activeTab === 'studies' ? (
            <AdminButton
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={openCreateModal}
            >
              {tx("إعداد دراسة جديدة (مسودة)")}
            </AdminButton>
          ) : selectedGrantPubId ? (
            <AdminButton
              variant="primary"
              size="md"
              icon={<Plus size={16} />}
              onClick={() => setIsGrantModalOpen(true)}
            >
              {tx("منح تصريح لعميل جديد")}
            </AdminButton>
          ) : null
        }
      />

      {/* Main Tab Switcher */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminTabs
          tabs={[
            { id: 'studies', label: tx("الدراسات والأوراق البحثية"), icon: BookOpen, count: publications.length },
            { id: 'grants', label: tx("تصاريح وصول العملاء (CLIENT_ONLY)"), icon: FolderLock },
          ]}
          activeTab={activeTab}
          onChange={(t) => setActiveTab(t as any)}
        />
      </div>

      {/* ============================
          TAB 1: STUDIES & REVIEW WORKFLOW
          ============================ */}
      {activeTab === 'studies' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
                  {tx("تصفية وفرز الأوراق البحثية")}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {tx("البحث بالعنوان أو الباحث وفرز الحالات ودرجات السرية")}
                </span>
              </div>
            </div>


            {/* Filter Toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  placeholder={tx("بحث بعنوان الدراسة أو اسم الباحث...")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ paddingRight: '2.5rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Filter size={16} color="var(--color-gold)" />
                <select
                  className="form-control"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ minWidth: '160px' }}
                >
                  <option value="ALL">{tx("جميع الحالات")}</option>
                  <option value="DRAFT">{tx("مسودة (DRAFT)")}</option>
                  <option value="SUBMITTED">{tx("مرسلة للمراجعة (SUBMITTED)")}</option>
                  <option value="UNDER_REVIEW">{tx("قيد المراجعة (UNDER_REVIEW)")}</option>
                  <option value="APPROVED">{tx("معتمدة (APPROVED)")}</option>
                  <option value="PUBLISHED">{tx("منشورة (PUBLISHED)")}</option>
                  <option value="REJECTED">{tx("مرفوضة (REJECTED)")}</option>
                  <option value="ARCHIVED">{tx("مؤرشفة (ARCHIVED)")}</option>
                </select>

                <select
                  className="form-control"
                  value={visibilityFilter}
                  onChange={(e) => setVisibilityFilter(e.target.value)}
                  style={{ minWidth: '160px' }}
                >
                  <option value="ALL">{tx("جميع مستويات الرؤية")}</option>
                  <option value="PUBLIC">{tx("متاح للعموم (PUBLIC)")}</option>
                  <option value="CLIENT_ONLY">{tx("خاص بالعملاء (CLIENT_ONLY)")}</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card">
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{tx("لم يتم العثور على أوراق بحثية مطابقة.")}</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{tx("عنوان الدراسة")}</th>
                      <th>{tx("التصنيف")}</th>
                      <th>{tx("درجة السرية")}</th>
                      <th>{tx("حالة دورة المراجعة")}</th>
                      <th>{tx("الباحث / المشاهدات")}</th>
                      <th>{tx("إجراءات دورة العمل")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((pub) => {
                      const status = pub.status || 'DRAFT';
                      return (
                        <tr key={pub.id}>
                          <td style={{ fontWeight: 700 }}>
                            <div>{pub.titleAr}</div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pub.titleEn}</span>
                          </td>
                          <td>
                            <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-gold)' }}>
                              {pub.category?.titleAr || tx("عام")}
                            </span>
                          </td>
                          <td>
                            {pub.visibility === 'PUBLIC' ? (
                              <span className="badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Globe size={13} />
                                <span>{tx("عام")}</span>
                              </span>
                            ) : (
                              <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Lock size={13} />
                                <span>{tx("خاص بالعملاء")}</span>
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: `${STATUS_COLORS[status] || '#666'}20`,
                                color: STATUS_COLORS[status] || '#FFF',
                                border: `1px solid ${STATUS_COLORS[status] || '#666'}50`,
                                fontWeight: 700,
                              }}
                            >
                              {STATUS_LABELS[status] || status}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{pub.author}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pub.viewsCount} {tx("مشاهدة")}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* Workflow action buttons */}
                              {status === 'DRAFT' && (
                                <AdminButton
                                  variant="secondary"
                                  size="sm"
                                  icon={<Send size={12} />}
                                  onClick={() => handleQuickReview(pub, 'SUBMIT_FOR_REVIEW')}
                                  title={tx("إرسال للمراجعة")}
                                >
                                  {tx("إرسال")}
                                </AdminButton>
                              )}

                              {(status === 'SUBMITTED' || status === 'UNDER_REVIEW') && (
                                <AdminButton
                                  variant="secondary"
                                  size="sm"
                                  icon={<ShieldCheck size={12} />}
                                  onClick={() => {
                                    setReviewModalTarget(pub);
                                    setReviewAction('APPROVE');
                                    setReviewComments('');
                                  }}
                                  title={tx("مراجعة واعتماد الدراسة")}
                                >
                                  {tx("مراجعة / اعتماد")}
                                </AdminButton>
                              )}

                              {status === 'APPROVED' && (
                                <AdminButton
                                  variant="primary"
                                  size="sm"
                                  icon={<Globe size={12} />}
                                  onClick={() => handleQuickReview(pub, 'PUBLISH')}
                                  title={tx("نشر الدراسة رسمياً")}
                                >
                                  {tx("نشر رسمي")}
                                </AdminButton>
                              )}

                              {status === 'PUBLISHED' && (
                                <AdminButton
                                  variant="outline"
                                  size="sm"
                                  icon={<Archive size={12} />}
                                  onClick={() => handleQuickReview(pub, 'RETURN_FOR_REVISION', tx("أرشفة الدراسة من العرض"))}
                                  title={tx("أرشفة")}
                                />
                              )}

                              {/* Review log button */}
                              <AdminButton
                                variant="outline"
                                size="sm"
                                icon={<History size={12} />}
                                onClick={() => loadReviewLogs(pub)}
                                title={tx("سجل المراجعة والاعتمادات")}
                              />

                              {/* Edit metadata button */}
                              <AdminButton
                                variant="outline"
                                size="sm"
                                icon={<Edit2 size={12} />}
                                onClick={() => openEditModal(pub)}
                                title={tx("تعديل المحتوى")}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================
          TAB 2: ACCESS GRANTS (CLIENT_ONLY)
          ============================ */}
      {activeTab === 'grants' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("إدارة تصاريح الوصول للدراسات المقيدة (CLIENT_ONLY)")}
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {tx("منح وسحب التراخيص الرقمية للعملاء للاطلاع على الدراسات الحصرية والتقارير الاستراتيجية")}
                </span>
              </div>

              {selectedGrantPubId && (
                <AdminButton
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => setIsGrantModalOpen(true)}
                >
                  {tx("منح تصريح لعميل جديد")}
                </AdminButton>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{tx("اختر الدراسة المقيدة:")}</span>
              <select
                className="form-control"
                value={selectedGrantPubId}
                onChange={(e) => setSelectedGrantPubId(e.target.value)}
                style={{ minWidth: '280px' }}
              >
                {clientOnlyPubs.length === 0 ? (
                  <option value="">{tx("لا توجد دراسات بمستوى رؤية CLIENT_ONLY")}</option>
                ) : (
                  clientOnlyPubs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.titleAr} ({p.status})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="card">
            {grantsLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                <p>{tx("جاري تحميل قائمة التصاريح...")}</p>
              </div>
            ) : clientOnlyPubs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <AlertCircle size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>
                  {tx("لا توجد حالياً دراسات مصنفة كـ CLIENT_ONLY. يمكنك تعديل مستوى الرؤية لأي دراسة إلى CLIENT_ONLY لإدارتها هنا.")}
                </p>
              </div>
            ) : grants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                <FolderLock size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
                <p style={{ margin: 0, fontWeight: 600 }}>{tx("لم يتم منح تصاريح وصول لهذه الدراسة بعد.")}</p>
                <div style={{ marginTop: '1rem' }}>
                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon={<Plus size={15} />}
                    onClick={() => setIsGrantModalOpen(true)}
                  >
                    {tx("منح أول تصريح")}
                  </AdminButton>
                </div>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{tx("العميل المصرح له")}</th>
                      <th>{tx("البريد الإلكتروني")}</th>
                      <th>{tx("المؤسسة / الجهة")}</th>
                      <th>{tx("تاريخ المنح")}</th>
                      <th>{tx("حالة التصريح")}</th>
                      <th>{tx("ملاحظات / سبب السحب")}</th>
                      <th>{tx("الإجراء")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grants.map((g) => (
                      <tr key={g.id}>
                        <td style={{ fontWeight: 700 }}>{g.client?.fullName || g.grantedToUserId}</td>
                        <td style={{ fontSize: '0.85rem' }}>{g.client?.email || '-'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{g.client?.organization || '-'}</td>
                        <td style={{ fontSize: '0.85rem' }}>{new Date(g.createdAt).toLocaleDateString(txLocale("ar-YE"))}</td>
                        <td>
                          {g.isActive ? (
                            <span className="badge" style={{ background: 'rgba(34,197,94,0.18)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)' }}>
                              {tx("نشط وسارٍ")}
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(239,68,68,0.18)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}>
                              {tx("مسحوب / ملغي")}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {g.revokedReason ? (
                            <span style={{ color: '#ef4444' }}>{tx("سبب السحب:")} {g.revokedReason}</span>
                          ) : (
                            g.notes || '-'
                          )}
                        </td>
                        <td>
                          {g.isActive ? (
                            <AdminButton
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setRevokeTarget(g);
                                setRevokeReason('');
                              }}
                            >
                              {tx("سحب التصريح")}
                            </AdminButton>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx("مغلق")}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ============================
          MODAL: CREATE / EDIT PUBLICATION
          ============================ */}
      {isModalOpen && (
        <div
          className="facss-modal-overlay"
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
            className="card facss-modal-content"
            style={{ maxWidth: '780px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--color-gold)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                {editingPub ? tx("تعديل بيانات الدراسة") : tx("إعداد دراسة وبحث جديد")}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="facss-form-grid-2" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">{tx("عنوان الدراسة (بالعربية) *")}</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.titleAr}
                    onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                    placeholder={tx("مثال: تقييم المخاطر الأمنية في ميناء عدن")}
                  />
                </div>
                <div>
                  <label className="form-label">{tx("عنوان الدراسة (بالإنجليزية) *")}</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.titleEn}
                    onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                    placeholder="e.g. Aden Port Security Risk Assessment"
                  />
                </div>
              </div>

              <div className="facss-form-grid-3" style={{ marginBottom: '1rem' }}>
                <div>
                  <label className="form-label">{tx("التصنيف *")}</label>
                  <select
                    className="form-control"
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.titleAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">{tx("درجة السرية / الرؤية *")}</label>
                  <select
                    className="form-control"
                    value={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                  >
                    <option value="PUBLIC">{tx("متاح للعموم (PUBLIC)")}</option>
                    <option value="CLIENT_ONLY">{tx("حصري للعملاء المصرح لهم (CLIENT_ONLY)")}</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">{tx("حالة المسودة *")}</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="DRAFT">{tx("مسودة (DRAFT)")}</option>
                    <option value="SUBMITTED">{tx("إرسال للمراجعة (SUBMITTED)")}</option>
                    <option value="UNDER_REVIEW">{tx("قيد المراجعة (UNDER_REVIEW)")}</option>
                    <option value="APPROVED">{tx("معتمدة (APPROVED)")}</option>
                    <option value="PUBLISHED">{tx("منشورة رسمياً (PUBLISHED)")}</option>
                    <option value="ARCHIVED">{tx("مؤرشفة (ARCHIVED)")}</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">{tx("اسم الباحث / الوحدة المعدة *")}</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">{tx("الملخص التنفيذي (بالعربية) *")}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  value={form.summaryAr}
                  onChange={(e) => setForm({ ...form, summaryAr: e.target.value })}
                  placeholder={tx("ملخص يوضح نطاق الدراسة ومنهجيتها وأهم النتائج...")}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">{tx("الملخص بالإنجليزية *")}</label>
                <textarea
                  className="form-control"
                  rows={2}
                  required
                  value={form.summaryEn}
                  onChange={(e) => setForm({ ...form, summaryEn: e.target.value })}
                  placeholder="Executive summary in English..."
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">{tx("محتوى الدراسة الكامل (بالعربية) *")}</label>
                <textarea
                  className="form-control"
                  rows={5}
                  required
                  value={form.contentAr}
                  onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
                  placeholder={tx("نص الدراسة التفصيلي والتحليلات الميدانية والتوصيات...")}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">{tx("محتوى الدراسة الكامل (بالإنجليزية) *")}</label>
                <textarea
                  className="form-control"
                  rows={4}
                  required
                  value={form.contentEn}
                  onChange={(e) => setForm({ ...form, contentEn: e.target.value })}
                  placeholder="Full research content in English..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <AdminButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  {tx("إلغاء")}
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? tx("جاري الحفظ...") : editingPub ? tx("حفظ التعديلات") : tx("حفظ الدراسة")}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================
          MODAL: REVIEW WORKFLOW ACTION
          ============================ */}
      {reviewModalTarget && (
        <div
          className="facss-modal-overlay"
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
            className="card facss-modal-content"
            style={{ maxWidth: '540px', width: '100%', border: '1px solid var(--color-gold)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={22} color="var(--color-gold)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("دورة مراجعة واعتماد الدراسة")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalTarget(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {tx("الدراسة:")} <strong style={{ color: '#FFF' }}>{reviewModalTarget.titleAr}</strong> {tx("| الحالة الحالية:")} <span style={{ color: 'var(--color-gold-light)', fontWeight: 700 }}>{STATUS_LABELS[reviewModalTarget.status] || reviewModalTarget.status}</span>
            </p>

            <form onSubmit={handleReviewActionSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">{tx("الإجراء المطلوب تنفيذه *")}</label>
                <select
                  className="form-control"
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                >
                  <option value="APPROVE">{tx("اعتماد الدراسة رسمياً (APPROVE - إدارة عليا)")}</option>
                  <option value="RETURN_FOR_REVISION">{tx("إعادة للباحث لإجراء تعديلات (RETURN_FOR_REVISION)")}</option>
                  <option value="REJECT">{tx("رفض الدراسة (REJECT - إدارة عليا)")}</option>
                  <option value="PUBLISH">{tx("اعتماد ونشر فوري (PUBLISH - إدارة عليا)")}</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">
                  {tx("ملاحظات ومبررات القرار")} {reviewAction === 'REJECT' || reviewAction === 'RETURN_FOR_REVISION' ? '*' : tx("(اختياري)")}
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  required={reviewAction === 'REJECT' || reviewAction === 'RETURN_FOR_REVISION'}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={tx("ملاحظات المراجعة أو التعديلات المطلوبة بدقة...")}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <AdminButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewModalTarget(null)}
                  disabled={processingReview}
                >
                  {tx("إلغاء")}
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={processingReview}
                  disabled={processingReview}
                >
                  {tx("اعتماد الإجراء وتوثيق السجل")}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================
          MODAL: REVIEW LOGS HISTORY
          ============================ */}
      {logsModalTarget && (
        <div
          className="facss-modal-overlay"
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
            className="card facss-modal-content"
            style={{ maxWidth: '640px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--color-gold)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} color="var(--color-gold)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("سجل مراجعات واعتمادات الدراسة")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLogsModalTarget(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              {logsModalTarget.titleAr}
            </p>

            {logsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.5rem' }} />
                <p>{tx("جاري تحميل السجل...")}</p>
              </div>
            ) : reviewLogs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                {tx("لا توجد حركات مراجعة مسجلة لهذه الدراسة بعد.")}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {reviewLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'var(--surface-sunken)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      borderRight: '4px solid var(--color-gold)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, color: '#FFF', fontSize: '0.9rem' }}>
                        {log.action}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.createdAt).toLocaleString(txLocale("ar-YE"))}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--color-gold-light)', marginBottom: '0.35rem' }}>
                      {tx("بواسطة:")} {log.reviewerName} {tx("| من [")}{STATUS_LABELS[log.fromStatus] || log.fromStatus}{tx("] إلى [")}{STATUS_LABELS[log.toStatus] || log.toStatus}]
                    </div>

                    {log.comments && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-line' }}>
                        {tx("الملاحظات:")} {log.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================
          MODAL: GRANT ACCESS
          ============================ */}
      {isGrantModalOpen && (
        <div
          className="facss-modal-overlay"
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
            className="card facss-modal-content"
            style={{ maxWidth: '520px', width: '100%', border: '1px solid var(--color-gold)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FolderLock size={20} color="var(--color-gold)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("منح تصريح وصول لدراسة مقيدة")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGrantModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGrantAccess}>
              <div style={{ marginBottom: '1rem' }}>
                <label className="form-label">{tx("اختر العميل / المستخدم *")}</label>
                <select
                  className="form-control"
                  required
                  value={grantTargetUserId}
                  onChange={(e) => setGrantTargetUserId(e.target.value)}
                >
                  <option value="">{tx("-- حدد العميل لمنحه التصريح --")}</option>
                  {availableClients.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.email}) {u.organization ? `— ${u.organization}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">{tx("ملاحظات الترخيص أو رقم العقد (اختياري)")}</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={grantNotes}
                  onChange={(e) => setGrantNotes(e.target.value)}
                  placeholder={tx("مثال: تصريح بموجب العقد الأمني السنوي رقم 2026-SEC-01...")}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <AdminButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsGrantModalOpen(false)}
                  disabled={grantingAccess}
                >
                  {tx("إلغاء")}
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={grantingAccess}
                  disabled={grantingAccess}
                >
                  {tx("إصدار التصريح وإشعار العميل")}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================
          MODAL: REVOKE ACCESS
          ============================ */}
      {revokeTarget && (
        <div
          className="facss-modal-overlay"
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
            className="card facss-modal-content"
            style={{ maxWidth: '480px', width: '100%', border: '1px solid #ef4444' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  {tx("سحب تصريح الوصول الرسمي")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              {tx("هل أنت متأكد من سحب تصريح العميل")} <strong style={{ color: '#FFF' }}>{revokeTarget.client?.fullName || revokeTarget.grantedToUserId}</strong>{tx("؟ يتطلب النظام تدوين سبب السحب لتوثيق مسار التدقيق.")}
            </p>

            <form onSubmit={handleRevokeAccess}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">{tx("سبب ومبرر سحب التصريح الإلزامي *")}</label>
                <textarea
                  className="form-control"
                  rows={3}
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder={tx("مثال: انتهاء صلاحية العقد الأمني أو طلب العميل إلغاء الخدمة...")}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <AdminButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokeTarget(null)}
                  disabled={revoking}
                >
                  {tx("إلغاء")}
                </AdminButton>
                <AdminButton
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={revoking}
                  disabled={revoking}
                >
                  {tx("تأكيد سحب التصريح")}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
