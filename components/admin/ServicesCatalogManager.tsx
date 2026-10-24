'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  ShieldCheck,
  Compass, 
  GraduationCap, 
  HeartHandshake, 
  Users, 
  FileText, 
  Briefcase,
  ExternalLink,
  Layers,
  Inbox,
  Archive,
  Activity,
  Cpu,
  Edit3,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminStatCard,
  AdminButton,
  AdminDataTable,
  AdminStatusBadge,
  AdminModal,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminAlert,
  AdminCheckbox,
} from '@/components/admin/ui';

interface ServiceItem {
  id: string;
  order: number;
  titleAr: string;
  titleEn: string;
  slug: string;
  shortDescAr?: string | null;
  shortDescEn?: string | null;
  fullDescAr?: string | null;
  fullDescEn?: string | null;
  featuresAr?: string | null;
  featuresEn?: string | null;
  processAr?: string | null;
  processEn?: string | null;
  targetSectorsAr?: string | null;
  targetSectorsEn?: string | null;
  isActive: boolean;
  requestsCount: number;
}

function jsonToLines(jsonStr?: string | null): string {
  if (!jsonStr) return '';
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) return parsed.join('\n');
  } catch {}
  return jsonStr;
}

interface CategoryItem {
  id: string;
  titleAr: string;
  titleEn: string;
  slug: string;
  isActive: boolean;
  services: ServiceItem[];
}

interface Props {
  categories: CategoryItem[];
  totalRequests: number;
}

export default function ServicesCatalogManager({
  categories: initialCategories,
  totalRequests,
}: Props) {
  const { tx, txLocale } = useAdminT();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [formData, setFormData] = useState<Partial<ServiceItem>>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create Service State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    categoryId: initialCategories[0]?.id || '',
    titleAr: '',
    titleEn: '',
    slug: '',
    order: 0,
    isActive: true,
    shortDescAr: '',
    shortDescEn: '',
    fullDescAr: '',
    fullDescEn: '',
    featuresAr: '',
    featuresEn: '',
    processAr: '',
    processEn: '',
    targetSectorsAr: '',
    targetSectorsEn: '',
  });
  const [creating, setCreating] = useState(false);

  // Category Modal States
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    id: '',
    titleAr: '',
    titleEn: '',
    slug: '',
    order: 0,
    isActive: true,
  });
  const [savingCategory, setSavingCategory] = useState(false);

  const activeCategories = categories.filter(c => c.isActive);
  const inactiveCategories = categories.filter(c => !c.isActive);

  const totalActiveServices = activeCategories.reduce((acc, c) => acc + c.services.filter(s => s.isActive).length, 0);
  const totalInactiveServices = categories.reduce((acc, c) => acc + c.services.filter(s => !s.isActive).length, 0);

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'guarding-protective-security': return ShieldCheck;
      case 'field-monitoring-early-warning': return Activity;
      case 'field-studies-analysis-monitoring': return FileText;
      case 'training-capacity-coordination': return GraduationCap;
      case 'safety-systems-equipment': return Cpu;
      case 'access-risk-analysis': return Compass;
      case 'operational-security-services': return ShieldAlert;
      default: return Briefcase;
    }
  };

  const openEditModal = (srv: ServiceItem) => {
    setEditingService(srv);
    setFormData({
      titleAr: srv.titleAr || '',
      titleEn: srv.titleEn || '',
      order: srv.order ?? 0,
      isActive: srv.isActive,
      shortDescAr: srv.shortDescAr || '',
      shortDescEn: srv.shortDescEn || '',
      fullDescAr: srv.fullDescAr || '',
      fullDescEn: srv.fullDescEn || '',
      featuresAr: jsonToLines(srv.featuresAr),
      featuresEn: jsonToLines(srv.featuresEn),
      processAr: jsonToLines(srv.processAr),
      processEn: jsonToLines(srv.processEn),
      targetSectorsAr: jsonToLines(srv.targetSectorsAr),
      targetSectorsEn: jsonToLines(srv.targetSectorsEn),
    });
    setFeedback(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleAr: formData.titleAr,
          titleEn: formData.titleEn,
          order: Number(formData.order) || 0,
          isActive: formData.isActive,
          shortDescAr: formData.shortDescAr,
          shortDescEn: formData.shortDescEn,
          fullDescAr: formData.fullDescAr,
          fullDescEn: formData.fullDescEn,
          featuresAr: formData.featuresAr,
          featuresEn: formData.featuresEn,
          processAr: formData.processAr,
          processEn: formData.processEn,
          targetSectorsAr: formData.targetSectorsAr,
          targetSectorsEn: formData.targetSectorsEn,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("حدث خطأ أثناء حفظ التعديلات"));
      }

      // Update local state across categories
      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          services: cat.services.map((srv) =>
            srv.id === editingService.id
              ? {
                  ...srv,
                  titleAr: formData.titleAr || srv.titleAr,
                  titleEn: formData.titleEn || srv.titleEn,
                  order: Number(formData.order) ?? srv.order,
                  isActive: formData.isActive !== undefined ? formData.isActive : srv.isActive,
                  shortDescAr: formData.shortDescAr,
                  shortDescEn: formData.shortDescEn,
                  fullDescAr: formData.fullDescAr,
                  fullDescEn: formData.fullDescEn,
                  featuresAr: typeof formData.featuresAr === 'string' ? JSON.stringify(formData.featuresAr.split('\n').map(l => l.trim()).filter(Boolean)) : srv.featuresAr,
                  featuresEn: typeof formData.featuresEn === 'string' ? JSON.stringify(formData.featuresEn.split('\n').map(l => l.trim()).filter(Boolean)) : srv.featuresEn,
                  processAr: typeof formData.processAr === 'string' ? JSON.stringify(formData.processAr.split('\n').map(l => l.trim()).filter(Boolean)) : srv.processAr,
                  processEn: typeof formData.processEn === 'string' ? JSON.stringify(formData.processEn.split('\n').map(l => l.trim()).filter(Boolean)) : srv.processEn,
                  targetSectorsAr: typeof formData.targetSectorsAr === 'string' ? JSON.stringify(formData.targetSectorsAr.split('\n').map(l => l.trim()).filter(Boolean)) : srv.targetSectorsAr,
                  targetSectorsEn: typeof formData.targetSectorsEn === 'string' ? JSON.stringify(formData.targetSectorsEn.split('\n').map(l => l.trim()).filter(Boolean)) : srv.targetSectorsEn,
                }
              : srv
          ),
        }))
      );

      setFeedback({
        type: 'success',
        message: tx("تم تحديث بيانات الخدمة [{0}] بنجاح، وانعكست في واجهات الموقع فوراً.", formData.titleAr || editingService.titleAr),
      });

      setEditingService(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || tx("فشل حفظ التعديلات"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createFormData.categoryId || !createFormData.titleAr || !createFormData.titleEn) {
      setFeedback({ type: 'error', message: tx("يرجى تعبئة الحقول الإلزامية واختيار القطاع") });
      return;
    }

    setCreating(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("حدث خطأ أثناء إضافة الخدمة"));
      }

      const created: ServiceItem = {
        ...data.service,
        requestsCount: 0,
      };

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === createFormData.categoryId
            ? { ...cat, services: [...cat.services, created] }
            : cat
        )
      );

      setShowCreateModal(false);
      setFeedback({
        type: 'success',
        message: tx("تمت إضافة الخدمة [{0}] بنجاح، وظهرت في دليل الخدمات وصفحة طلب الخدمة.", created.titleAr),
      });

      setCreateFormData({
        categoryId: categories[0]?.id || '',
        titleAr: '',
        titleEn: '',
        slug: '',
        order: 0,
        isActive: true,
        shortDescAr: '',
        shortDescEn: '',
        fullDescAr: '',
        fullDescEn: '',
        featuresAr: '',
        featuresEn: '',
        processAr: '',
        processEn: '',
        targetSectorsAr: '',
        targetSectorsEn: '',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || tx("حدث خطأ أثناء إضافة الخدمة") });
    } finally {
      setCreating(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.titleAr.trim() || !categoryFormData.titleEn.trim()) {
      setFeedback({ type: 'error', message: tx("يرجى كتابة اسم مجال النشاط المؤسسي بالعربية والإنجليزية") });
      return;
    }

    setSavingCategory(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/services/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل إنشاء مجال النشاط"));

      const createdCat: CategoryItem = {
        id: data.category.id,
        titleAr: data.category.titleAr,
        titleEn: data.category.titleEn,
        slug: data.category.slug,
        isActive: data.category.isActive,
        services: [],
      };

      setCategories((prev) => [...prev, createdCat]);
      setShowCreateCategoryModal(false);
      setCategoryFormData({ id: '', titleAr: '', titleEn: '', slug: '', order: 0, isActive: true });
      setFeedback({
        type: 'success',
        message: tx("تمت إضافة مجال النشاط المؤسسي [{0}] بنجاح.", createdCat.titleAr),
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setSavingCategory(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/services/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل تحديث مجال النشاط"));

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === editingCategory.id
            ? {
                ...cat,
                titleAr: categoryFormData.titleAr,
                titleEn: categoryFormData.titleEn,
                slug: categoryFormData.slug || cat.slug,
                order: Number(categoryFormData.order) || 0,
                isActive: categoryFormData.isActive,
              }
            : cat
        )
      );

      setEditingCategory(null);
      setFeedback({
        type: 'success',
        message: tx("تم تحديث بيانات مجال النشاط المؤسسي بنجاح."),
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setSavingCategory(false);
    }
  };

  const serviceTableColumns = [
    {
      key: 'order',
      title: tx("الترتيب"),
      align: 'center' as const,
      width: '75px',
      render: (srv: ServiceItem) => (
        <span style={{ fontWeight: 800, color: 'var(--admin-gold-hover)' }}>{srv.order}</span>
      ),
    },
    {
      key: 'titleAr',
      title: tx("اسم الخدمة (عربي)"),
      render: (srv: ServiceItem) => (
        <div>
          <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)', display: 'block' }}>
            {srv.titleAr}
          </span>
          {srv.shortDescAr && (
            <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', lineHeight: 1.4, display: 'block', marginTop: '0.2rem' }}>
              {srv.shortDescAr.slice(0, 90)}...
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'titleEn',
      title: tx("اسم الخدمة (إنجليزي)"),
      render: (srv: ServiceItem) => (
        <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>{srv.titleEn}</span>
      ),
    },
    {
      key: 'slug',
      title: tx("المعرف البرمجي"),
      render: (srv: ServiceItem) => (
        <code
          dir="ltr"
          style={{
            fontFamily: 'monospace',
            fontSize: '0.78rem',
            background: 'var(--admin-canvas-bg)',
            padding: '0.2rem 0.45rem',
            borderRadius: '4px',
            border: '1px solid var(--admin-card-border)',
            color: 'var(--admin-text-secondary)',
          }}
        >
          {srv.slug}
        </code>
      ),
    },
    {
      key: 'status',
      title: tx("الحالة"),
      render: (srv: ServiceItem) => (
        <AdminStatusBadge
          variant={srv.isActive ? 'success' : 'danger'}
          label={srv.isActive ? tx("متاحة للطلب") : tx("موقوفة")}
        />
      ),
    },
    {
      key: 'requests',
      title: tx("الطلبات"),
      align: 'center' as const,
      width: '80px',
      render: (srv: ServiceItem) => (
        <span
          style={{
            fontWeight: 800,
            color: srv.requestsCount > 0 ? 'var(--admin-gold-hover)' : 'var(--admin-text-muted)',
          }}
        >
          {srv.requestsCount}
        </span>
      ),
    },
    {
      key: 'actions',
      title: tx("الإجراء"),
      align: 'center' as const,
      width: '150px',
      render: (srv: ServiceItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
          <AdminButton
            variant="secondary"
            size="sm"
            icon={<Edit3 size={13} />}
            onClick={() => openEditModal(srv)}
          >
            {tx("تعديل")}
          </AdminButton>
          <Link href={`/services/${srv.slug}`} target="_blank" style={{ textDecoration: 'none' }}>
            <AdminButton variant="ghost" size="sm" icon={<ExternalLink size={13} />}>
              {tx("عرض")}
            </AdminButton>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <AdminPageHeader
        title={tx("دليل الخدمات والتصنيفات المؤسسية")}
        description={tx("إدارة ومراجعة وتعديل تفاصيل الخدمات الميدانية المعتمدة لكافة مجالات نشاط المركز")}
        actions={
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <AdminButton
              variant="outline"
              size="md"
              icon={<Layers size={16} />}
              onClick={() => {
                setCategoryFormData({ id: '', titleAr: '', titleEn: '', slug: '', order: categories.length + 1, isActive: true });
                setShowCreateCategoryModal(true);
              }}
              style={{ borderColor: 'rgba(212, 175, 55, 0.5)', color: 'var(--facss-gold-400)' }}
            >
              {tx("إضافة مجال نشاط مؤسسي")}
            </AdminButton>
            <AdminButton
              variant="primary"
              size="md"
              icon={<PlusCircle size={16} />}
              onClick={() => {
                setCreateFormData((prev) => ({
                  ...prev,
                  categoryId: prev.categoryId || categories[0]?.id || '',
                }));
                setShowCreateModal(true);
              }}
            >
              {tx("إضافة خدمة جديدة")}
            </AdminButton>
            <Link href="/services" target="_blank" style={{ textDecoration: 'none' }}>
              <AdminButton variant="secondary" size="md" icon={<ExternalLink size={15} />}>
                {tx("معاينة دليل الخدمات العام")}
              </AdminButton>
            </Link>
          </div>
        }
      />

      {/* Global Feedback Banner */}
      {feedback && (
        <AdminAlert
          variant={feedback.type === 'success' ? 'success' : 'danger'}
          title={feedback.type === 'success' ? tx("تم الحفظ بنجاح") : tx("تنبيه خطأ")}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </AdminAlert>
      )}

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <AdminStatCard
          icon={<Layers size={22} />}
          label={tx("المجالات والتصنيفات المعتمدة")}
          value={activeCategories.length}
          helperText={tx("مجالات نشاط إنساني معتمدة")}
        />
        <AdminStatCard
          icon={<Briefcase size={22} />}
          label={tx("الخدمات المتاحة للطلب")}
          value={totalActiveServices}
          helperText={tx("خدمة ميدانية نشطة")}
        />
        <AdminStatCard
          icon={<Inbox size={22} />}
          label={tx("إجمالي طلبات الخدمة")}
          value={totalRequests}
          helperText={tx("طلب خدمة مسجل بالمنظومة")}
        />
        <AdminStatCard
          icon={<Archive size={22} />}
          label={tx("السجلات المؤرشفة")}
          value={inactiveCategories.length}
          helperText={tx("تصنيف تاريخي موقوف")}
        />
      </div>

      {/* Approved Categories & Services */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--admin-text-primary)', margin: 0 }}>
            {tx("مجالات النشاط والخدمات المندرجة تحتها (")}{activeCategories.length})
          </h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--admin-text-secondary)' }}>
            {tx("انقر على زر «تعديل» أمام أي خدمة لتحديث اسمها ووصفها وحالتها")}
          </span>
        </div>

        {activeCategories.map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          const activeSrvs = cat.services.filter(s => s.isActive);

          return (
            <AdminSection
              key={cat.id}
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--admin-radius-sm)',
                      background: 'rgba(201, 162, 39, 0.12)',
                      color: 'var(--admin-gold-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--admin-text-primary)' }}>
                      {cat.titleAr}
                    </span>
                    <span
                      dir="ltr"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        color: 'var(--admin-text-muted)',
                        fontFamily: 'monospace',
                        marginTop: '0.15rem',
                      }}
                    >
                      {cat.titleEn} • {cat.slug}
                    </span>
                  </div>
                </div>
              }
              actions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <AdminStatusBadge variant={cat.isActive ? 'success' : 'danger'} label={cat.isActive ? tx("معتمد ونشط") : tx("موقوف")} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)', fontWeight: 600 }}>
                    {activeSrvs.length} {tx("خدمات فرعية")}
                  </span>
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    icon={<Edit3 size={13} />}
                    onClick={() => {
                      setEditingCategory(cat);
                      setCategoryFormData({
                        id: cat.id,
                        titleAr: cat.titleAr,
                        titleEn: cat.titleEn,
                        slug: cat.slug,
                        order: 0,
                        isActive: cat.isActive,
                      });
                    }}
                  >
                    {tx("تعديل بيانات المجال")}
                  </AdminButton>
                </div>
              }
            >
              <AdminDataTable
                columns={serviceTableColumns}
                data={cat.services}
                rowKey="id"
                emptyMessage={tx("لا توجد خدمات مسجلة ضمن هذا المجال.")}
                mobileCardRender={(srv) => (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <strong style={{ color: 'var(--admin-text-primary)', fontSize: '0.92rem' }}>{srv.titleAr}</strong>
                      <AdminStatusBadge variant={srv.isActive ? 'success' : 'danger'} label={srv.isActive ? tx("متاحة") : tx("موقوفة")} />
                    </div>
                    <span style={{ fontSize: '0.82rem', color: 'var(--admin-text-secondary)' }}>{srv.titleEn}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code dir="ltr" style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'var(--admin-canvas-bg)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid var(--admin-card-border)', color: 'var(--admin-text-secondary)' }}>
                        {srv.slug}
                      </code>
                      <span style={{ fontWeight: 800, fontSize: '0.85rem', color: srv.requestsCount > 0 ? 'var(--admin-gold-hover)' : 'var(--admin-text-muted)' }}>
                        {srv.requestsCount} {tx("طلب")}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        icon={<Edit3 size={13} />}
                        onClick={() => openEditModal(srv)}
                        style={{ flex: 1 }}
                      >
                        {tx("تعديل الخدمة")}
                      </AdminButton>
                      <Link href={`/services/${srv.slug}`} target="_blank" style={{ textDecoration: 'none' }}>
                        <AdminButton variant="ghost" size="sm" icon={<ExternalLink size={13} />}>
                          {tx("عرض")}
                        </AdminButton>
                      </Link>
                    </div>
                  </div>
                )}
              />
            </AdminSection>
          );
        })}
      </div>

      {/* Inactive / Archived Categories */}
      {inactiveCategories.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <AdminSection
            title={tx("التصنيفات المؤرشفة والموقوفة من العرض العام")}
            description={tx("يحتوي على {0} تصنيف تاريخي موقوف لا يظهر في خيارات الطلب", inactiveCategories.length)}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {inactiveCategories.map((oldCat) => (
                <div
                  key={oldCat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--admin-canvas-bg)',
                    border: '1px dashed var(--admin-card-border)',
                    borderRadius: 'var(--admin-radius-sm)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AdminStatusBadge variant="danger" label={tx("موقوف (أرشيف)")} />
                      <span style={{ fontWeight: 700, color: 'var(--admin-text-primary)' }}>
                        {oldCat.titleAr} ({oldCat.titleEn})
                      </span>
                    </div>
                    <span
                      dir="ltr"
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        color: 'var(--admin-text-muted)',
                        fontFamily: 'monospace',
                        marginTop: '0.2rem',
                      }}
                    >
                      {oldCat.slug}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-secondary)' }}>
                    {tx("الخدمات المرتبطة:")} {oldCat.services.length}
                  </span>
                </div>
              ))}
            </div>
          </AdminSection>
        </div>
      )}

      {/* Edit Service Modal */}
      {editingService && (
        <AdminModal
          isOpen={Boolean(editingService)}
          onClose={() => setEditingService(null)}
          title={tx("تعديل بيانات الخدمة الميدانية")}
          description={tx("تحديث تفاصيل الخدمة [{0}] التي تظهر في دليل الخدمات وصفحة طلب الخدمة", editingService.titleAr)}
          maxWidth="840px"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
              <AdminButton
                variant="ghost"
                onClick={() => setEditingService(null)}
                disabled={saving}
              >
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={handleSave}
                loading={saving}
                icon={<CheckCircle2 size={16} />}
              >
                {tx("حفظ التعديلات")}
              </AdminButton>
            </div>
          }
        >
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <AdminInput
                label={tx("اسم الخدمة بالعربية")}
                required
                value={formData.titleAr || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, titleAr: e.target.value }))}
                placeholder={tx("مثال: خدمات الحراسات والحماية الميدانية للمنشآت والوفود")}
              />
              <AdminInput
                label={tx("اسم الخدمة بالإنجليزية")}
                required
                isLtr
                value={formData.titleEn || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, titleEn: e.target.value }))}
                placeholder="e.g. Field Guarding & Protection Services"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <AdminInput
                label={tx("الترتيب")}
                type="number"
                value={formData.order ?? 0}
                onChange={(e) => setFormData((prev) => ({ ...prev, order: Number(e.target.value) }))}
              />
              <AdminSelect
                label={tx("حالة الخدمة")}
                value={formData.isActive ? 'true' : 'false'}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                options={[
                  { value: 'true', label: tx("متاحة ونشطة للطلب") },
                  { value: 'false', label: tx("موقوفة مؤقتاً") },
                ]}
              />
            </div>

            <AdminTextarea
              label={tx("الوصف الموجز (عربي) - يظهر في بطاقات صفحة الخدمات")}
              rows={3}
              value={formData.shortDescAr || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, shortDescAr: e.target.value }))}
              placeholder={tx("وصف مختصر يوضح نطاق الخدمة للعملاء والجهات الشريكة...")}
            />

            <AdminTextarea
              label={tx("الوصف الموجز (إنجليزي)")}
              rows={3}
              dir="ltr"
              value={formData.shortDescEn || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, shortDescEn: e.target.value }))}
              placeholder="Brief summary displayed on service cards..."
            />

            <AdminTextarea
              label={tx("الوصف التفصيلي والشامل (عربي) - يظهر في صفحة تفاصيل الخدمة")}
              rows={4}
              value={formData.fullDescAr || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullDescAr: e.target.value }))}
              placeholder={tx("شرح تفصيلي للخدمة وإجراءات تقديمها...")}
            />

            <AdminTextarea
              label={tx("الوصف التفصيلي والشامل (إنجليزي)")}
              rows={4}
              dir="ltr"
              value={formData.fullDescEn || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, fullDescEn: e.target.value }))}
              placeholder="Full detailed description for the single service page..."
            />

            {/* Dynamic Detailed Data Sections */}
            <div style={{ borderTop: '1px solid var(--admin-card-border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {tx("تفاصيل ومكونات صفحة الخدمة الميدانية (بيانات ديناميكية)")}
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {tx("اكتب كل عنصر في سطر منفصل؛ سيتم تحويلها تلقائياً إلى بنود وخطوات مرقمة وقوائم منسقة في صفحة الخدمة العامة.")}
                </p>
              </div>

              {/* 1. Features */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <AdminTextarea
                  label={tx("أبرز مميزات ومكونات الخدمة (عربي) - سطر لكل ميزة")}
                  rows={4}
                  value={formData.featuresAr || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featuresAr: e.target.value }))}
                  placeholder={tx("مثال:\nتأمين وحراسة المنشآت الحساسة\nغرفة تحكم ومراقبة 24/7\nفرق استجابة وتدخل سريع")}
                />
                <AdminTextarea
                  label={tx("Key Capabilities & Features (English) - one per line")}
                  rows={4}
                  dir="ltr"
                  value={formData.featuresEn || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featuresEn: e.target.value }))}
                  placeholder={"e.g.\nFacility Physical Security\n24/7 Operations Monitoring\nRapid Response Teams"}
                />
              </div>

              {/* 2. Process Phases */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <AdminTextarea
                  label={tx("مراحل تنفيذ وتقديم الخدمة (عربي) - سطر لكل مرحلة بالترتيب")}
                  rows={4}
                  value={formData.processAr || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, processAr: e.target.value }))}
                  placeholder={tx("مثال:\nجلسة استكشافية وتحليل الاحتياج الأمني\nالمسح الميداني وتحديد الثغرات والمخاطر\nنشر القوات والمعدات والتجهيزات\nالمتابعة الدورية وإصدار التقارير")}
                />
                <AdminTextarea
                  label={tx("Implementation & Delivery Phases (English) - one per line")}
                  rows={4}
                  dir="ltr"
                  value={formData.processEn || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, processEn: e.target.value }))}
                  placeholder={"e.g.\nInitial Needs Assessment\nField Site Survey & Threat Audit\nDeployment of Teams and Assets\nContinuous QA Monitoring"}
                />
              </div>

              {/* 3. Target Sectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <AdminTextarea
                  label={tx("القطاعات الأكثر طلباً للخدمة (عربي) - سطر لكل قطاع")}
                  rows={3}
                  value={formData.targetSectorsAr || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetSectorsAr: e.target.value }))}
                  placeholder={tx("مثال:\nالبنوك والمصارف\nالشركات النفطية\nالمنظمات الدولية والهيئات الدبلوماسية")}
                />
                <AdminTextarea
                  label={tx("Target Sectors (English) - one per line")}
                  rows={3}
                  dir="ltr"
                  value={formData.targetSectorsEn || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, targetSectorsEn: e.target.value }))}
                  placeholder={"e.g.\nBanking & Financial Institutions\nOil & Gas Corporations\nDiplomatic & INGO Missions"}
                />
              </div>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Create New Service Modal */}
      {showCreateModal && (
        <AdminModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={tx("إضافة خدمة ميدانية جديدة إلى المنظومة")}
          description={tx("تعريف خدمة جديدة وتحديد قطاعها ومميزاتها ومراحل تنفيذها لعرضها في دليل الخدمات وصفحة طلب الخدمة")}
          maxWidth="840px"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
              <AdminButton
                variant="ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={handleCreateService}
                loading={creating}
                icon={<CheckCircle2 size={16} />}
              >
                {tx("إنشاء وإضافة الخدمة")}
              </AdminButton>
            </div>
          }
        >
          <form onSubmit={handleCreateService} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Category and Basic Info */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <AdminSelect
                label={tx("القطاع / مجال النشاط المؤسسي")}
                required
                value={createFormData.categoryId}
                onChange={(e) => setCreateFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                options={categories.map((c) => ({
                  value: c.id,
                  label: `${c.titleAr} (${c.titleEn})`,
                }))}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <AdminInput
                  label={tx("الترتيب")}
                  type="number"
                  value={createFormData.order}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, order: Number(e.target.value) }))}
                />
                <AdminSelect
                  label={tx("حالة الخدمة")}
                  value={createFormData.isActive ? 'true' : 'false'}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))}
                  options={[
                    { value: 'true', label: tx("نشطة ومتاحة للطلب") },
                    { value: 'false', label: tx("مسودة غير منشورة") },
                  ]}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <AdminInput
                label={tx("اسم الخدمة بالعربية")}
                required
                value={createFormData.titleAr}
                onChange={(e) => setCreateFormData((prev) => ({ ...prev, titleAr: e.target.value }))}
                placeholder={tx("مثال: خدمات المرافقة والحماية التنفيذية للوفود")}
              />
              <AdminInput
                label={tx("اسم الخدمة بالإنجليزية")}
                required
                isLtr
                value={createFormData.titleEn}
                onChange={(e) => setCreateFormData((prev) => ({ ...prev, titleEn: e.target.value }))}
                placeholder="e.g. Executive Close Protection Services"
              />
            </div>

            <AdminTextarea
              label={tx("الوصف الموجز (عربي) - يظهر في بطاقات صفحة الخدمات العامة")}
              rows={3}
              value={createFormData.shortDescAr}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, shortDescAr: e.target.value }))}
              placeholder={tx("وصف مختصر يوضح نطاق الخدمة...")}
            />

            <AdminTextarea
              label={tx("الوصف الموجز (إنجليزي)")}
              rows={3}
              dir="ltr"
              value={createFormData.shortDescEn}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, shortDescEn: e.target.value }))}
              placeholder="Brief summary displayed on service cards..."
            />

            <AdminTextarea
              label={tx("الوصف التفصيلي والشامل (عربي) - يظهر في صفحة تفاصيل الخدمة")}
              rows={4}
              value={createFormData.fullDescAr}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, fullDescAr: e.target.value }))}
              placeholder={tx("شرح تفصيلي للخدمة وإجراءات تقديمها...")}
            />

            <AdminTextarea
              label={tx("الوصف التفصيلي والشامل (إنجليزي)")}
              rows={4}
              dir="ltr"
              value={createFormData.fullDescEn}
              onChange={(e) => setCreateFormData((prev) => ({ ...prev, fullDescEn: e.target.value }))}
              placeholder="Full detailed description for the single service page..."
            />

            {/* Dynamic Detailed Data Sections */}
            <div style={{ borderTop: '1px solid var(--admin-card-border)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {tx("تفاصيل ومكونات صفحة الخدمة الميدانية (بيانات ديناميكية)")}
                </h4>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {tx("اكتب كل عنصر في سطر منفصل؛ سيتم تحويلها تلقائياً إلى بنود وخطوات مرقمة في صفحة الخدمة العامة.")}
                </p>
              </div>

              {/* 1. Features */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <AdminTextarea
                  label={tx("أبرز مميزات ومكونات الخدمة (عربي) - سطر لكل ميزة")}
                  rows={4}
                  value={createFormData.featuresAr}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, featuresAr: e.target.value }))}
                  placeholder={tx("مثال:\nتأمين وحراسة المنشآت الحساسة\nغرفة تحكم ومراقبة 24/7\nفرق استجابة وتدخل سريع")}
                />
                <AdminTextarea
                  label={tx("Key Capabilities & Features (English) - one per line")}
                  rows={4}
                  dir="ltr"
                  value={createFormData.featuresEn}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, featuresEn: e.target.value }))}
                  placeholder={"e.g.\nFacility Physical Security\n24/7 Operations Monitoring\nRapid Response Teams"}
                />
              </div>

              {/* 2. Process Phases */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <AdminTextarea
                  label={tx("مراحل تنفيذ وتقديم الخدمة (عربي) - سطر لكل مرحلة بالترتيب")}
                  rows={4}
                  value={createFormData.processAr}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, processAr: e.target.value }))}
                  placeholder={tx("مثال:\nجلسة استكشافية وتحليل الاحتياج الأمني\nالمسح الميداني وتحديد الثغرات والمخاطر\nنشر القوات والمعدات والتجهيزات\nالمتابعة الدورية وإصدار التقارير")}
                />
                <AdminTextarea
                  label={tx("Implementation & Delivery Phases (English) - one per line")}
                  rows={4}
                  dir="ltr"
                  value={createFormData.processEn}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, processEn: e.target.value }))}
                  placeholder={"e.g.\nInitial Needs Assessment\nField Site Survey & Threat Audit\nDeployment of Teams and Assets\nContinuous QA Monitoring"}
                />
              </div>

              {/* 3. Target Sectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <AdminTextarea
                  label={tx("القطاعات الأكثر طلباً للخدمة (عربي) - سطر لكل قطاع")}
                  rows={3}
                  value={createFormData.targetSectorsAr}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, targetSectorsAr: e.target.value }))}
                  placeholder={tx("مثال:\nالبنوك والمصارف\nالشركات النفطية\nالمنظمات الدولية والهيئات الدبلوماسية")}
                />
                <AdminTextarea
                  label={tx("Target Sectors (English) - one per line")}
                  rows={3}
                  dir="ltr"
                  value={createFormData.targetSectorsEn}
                  onChange={(e) => setCreateFormData((prev) => ({ ...prev, targetSectorsEn: e.target.value }))}
                  placeholder={"e.g.\nBanking & Financial Institutions\nOil & Gas Corporations\nDiplomatic & INGO Missions"}
                />
              </div>
            </div>
          </form>
        </AdminModal>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <AdminModal
          isOpen={showCreateCategoryModal}
          onClose={() => setShowCreateCategoryModal(false)}
          title={tx("إضافة مجال نشاط مؤسسي جديد")}
          description={tx("تعريف قطاع نشاط عريض تنضوي تحته الخدمات الميدانية المعتمدة")}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
              <AdminButton variant="secondary" onClick={() => setShowCreateCategoryModal(false)}>
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton variant="primary" loading={savingCategory} onClick={handleCreateCategory}>
                {savingCategory ? tx("جارٍ الحفظ...") : tx("إنشاء مجال النشاط")}
              </AdminButton>
            </div>
          }
        >
          <form onSubmit={handleCreateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <AdminInput
              label={tx("اسم مجال النشاط (بالعربية)")}
              required
              value={categoryFormData.titleAr}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, titleAr: e.target.value })}
              placeholder={tx("مثال: الرصد والاستشعار الميداني المتقدم")}
            />
            <AdminInput
              label={tx("اسم مجال النشاط (بالإنجليزية)")}
              required
              dir="ltr"
              value={categoryFormData.titleEn}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, titleEn: e.target.value })}
              placeholder="e.g. Advanced Field Sensing & Monitoring"
            />
            <AdminInput
              label={tx("المعرف الرابط (Slug) - اختياري")}
              dir="ltr"
              value={categoryFormData.slug}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
              helperText={tx("إذا تُرِك فارغاً، فسيتم توليده تلقائياً من الاسم الإنجليزي")}
            />
            <AdminInput
              label={tx("ترتيب الظهور (Order)")}
              type="number"
              value={String(categoryFormData.order)}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, order: Number(e.target.value) || 0 })}
            />
            <AdminCheckbox
              label={tx("تفعيل مجال النشاط وإتاحته فورياً في الواجهة العامة")}
              checked={categoryFormData.isActive}
              onChange={(checked) => setCategoryFormData({ ...categoryFormData, isActive: checked })}
            />
          </form>
        </AdminModal>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <AdminModal
          isOpen={Boolean(editingCategory)}
          onClose={() => setEditingCategory(null)}
          title={tx("تعديل بيانات مجال النشاط المؤسسي")}
          description={editingCategory.titleAr}
          maxWidth="640px"
          footer={
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
              <AdminButton variant="secondary" onClick={() => setEditingCategory(null)}>
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton variant="primary" loading={savingCategory} onClick={handleUpdateCategory}>
                {savingCategory ? tx("جارٍ الحفظ...") : tx("حفظ تعديلات المجال")}
              </AdminButton>
            </div>
          }
        >
          <form onSubmit={handleUpdateCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <AdminInput
              label={tx("اسم مجال النشاط (بالعربية)")}
              required
              value={categoryFormData.titleAr}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, titleAr: e.target.value })}
            />
            <AdminInput
              label={tx("اسم مجال النشاط (بالإنجليزية)")}
              required
              dir="ltr"
              value={categoryFormData.titleEn}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, titleEn: e.target.value })}
            />
            <AdminInput
              label={tx("المعرف الرابط (Slug)")}
              dir="ltr"
              value={categoryFormData.slug}
              onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
            />
            <AdminCheckbox
              label={tx("مجال نشاط معتمد ومفعل (إظهار في الموقع العام)")}
              checked={categoryFormData.isActive}
              onChange={(checked) => setCategoryFormData({ ...categoryFormData, isActive: checked })}
            />
          </form>
        </AdminModal>
      )}
    </div>
  );
}
