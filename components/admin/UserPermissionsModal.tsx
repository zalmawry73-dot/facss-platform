'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAdminT } from '@/lib/admin-i18n';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Briefcase,
  GraduationCap,
  BookOpen,
  Settings,
  Search,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Lock,
  Layers,
  Info,
  CheckSquare,
  Square,
  Sparkles
} from 'lucide-react';
import {
  AdminModal,
  AdminButton,
  AdminStatusBadge,
  AdminAlert,
  AdminSearchInput
} from '@/components/admin/ui';
import {
  CAPABILITIES,
  ALL_CAPABILITIES,
  ADMIN_OPERATIONAL_CAPABILITIES,
  LEGACY_ROLE_CAPABILITIES,
  ROLES,
  type Capability
} from '@/lib/rbac-definitions';
import { UserItem } from './UsersManager';

export interface CapabilityItem {
  id: string;
  label: string;
  desc: string;
  code: string;
  riskLevel?: 'STANDARD' | 'OPERATIONAL' | 'SENSITIVE' | 'CRITICAL';
}

export interface CapabilityCategoryItem {
  id: string;
  title: string;
  desc: string;
  icon: any;
  capabilities: CapabilityItem[];
}

export const CAPABILITY_CATEGORIES: CapabilityCategoryItem[] = [
  {
    id: 'field_operations',
    get title() { return "العمليات والخدمات الميدانية والمخزون والتجهيزات"; },
    get desc() { return "إدارة طلبات الحماية والاستشارات، تعيين المعدات، مستودعات السلامة وأوامر الشراء"; },
    icon: Briefcase,
    capabilities: [
      {
        id: 'manage_requests',
        get label() { return "إدارة ومتابعة طلبات الخدمات الأمنية"; },
        get desc() { return "استعراض وتحديث ومتابعة طلبات الحماية والاستشارات وتعيين المشرفين وتعديل مسار التنفيذ والأرشفة"; },
        code: 'manage_requests',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'manage_equipment',
        get label() { return "إدارة وتعيين المعدات والسيارات والأجهزة الميدانية"; },
        get desc() { return "تتبع حركة الآليات والمعدات الميدانية وتعيين العهد للأفراد والفرق والمواقع والمنشآت الحساسة"; },
        code: 'manage_equipment',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'manage_inventory',
        get label() { return "إدارة مستودعات التجهيزات ومعدات الحماية والسلامة"; },
        get desc() { return "مراقبة مستويات المخزون، سجلات الجرد، ومعدات الإطفاء والإنقاذ والحراسة ومهمات السلامة"; },
        code: 'manage_inventory',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'manage_procurement',
        get label() { return "أوامر الشراء والتوريد وتجديد العهد والمعدات"; },
        get desc() { return "إصدار ومتابعة أوامر الشراء والتوريد للمعدات وصيانة وتجديد الأجهزة الأمنية المعتمدة"; },
        code: 'manage_procurement',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'manage_inspections',
        get label() { return "التفتيش الميداني وضبط الجودة والسلامة المهنية"; },
        get desc() { return "جدولة وتنفيذ جولات التفتيش والتدقيق الميداني على المنشآت والمواقع الحساسة وإصدار نماذج التدقيق"; },
        code: 'manage_inspections',
        riskLevel: 'OPERATIONAL',
      },
    ],
  },
  {
    id: 'incidents_alerts',
    get title() { return "البلاغات الميدانية والإنذار المبكر"; },
    get desc() { return "رصد الحوادث الأمنية، التحقق الجنائي والميداني، وصياغة ونشر التنبيهات والتحذيرات"; },
    icon: ShieldAlert,
    capabilities: [
      {
        id: 'submit_incident',
        get label() { return "تقديم وتوثيق البلاغات الميدانية الحساسة"; },
        get desc() { return "إرسال تقارير الحوادث والبلاغات الأمنية الميدانية الحساسة وتوثيق الإحداثيات والوقائع"; },
        code: 'submit_incident',
        riskLevel: 'STANDARD',
      },
      {
        id: 'verify_incident',
        get label() { return "التحقق والتدقيق الميداني لصحة البلاغات"; },
        get desc() { return "مراجعة وفحص مصادر البلاغات وتأكيد صحتها الميدانية وإسناد التحقق لفرق الرصد"; },
        code: 'verify_incident',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'analyze_incident',
        get label() { return "تحليل وتقييم مخاطر البلاغات وإعداد النسخ المنقحة"; },
        get desc() { return "تصنيف الأثر ومستوى الخطر وتجريد البيانات الحساسة وصياغة الرؤى التشغيلية المنقحة"; },
        code: 'analyze_incident',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'draft_incident_alert',
        get label() { return "صياغة مسودات التنبيهات والتحذيرات الأمنية"; },
        get desc() { return "إعداد وصياغة مسودات التنبيهات ونطاق المستلمين والشركاء والمناطق الجغرافية المستهدفة"; },
        code: 'draft_incident_alert',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'approve_incident_alert',
        get label() { return "اعتماد وإصدار ونشر التنبيهات الأمنية (إدارة عليا)"; },
        get desc() { return "الموافقة النهائية ونشر التنبيهات الفورية لكافة الشركاء وتجميد لوائح التوزيع الرسمية"; },
        code: 'approve_incident_alert',
        riskLevel: 'CRITICAL',
      },
    ],
  },
  {
    id: 'risks',
    get title() { return "سجل وإدارة المخاطر التشغيلية"; },
    get desc() { return "مصفوفات المخاطر، التقييم الميداني النوعي، وإجراءات التخفيف الاستباقية للمنشآت والوفود"; },
    icon: AlertTriangle,
    capabilities: [
      {
        id: 'view_risk_register',
        get label() { return "استعراض والاطلاع على سجل المخاطر التشغيلية"; },
        get desc() { return "الاطلاع على مصفوفة المخاطر التشغيلية العامة ومستويات التهديد وإجراءات الوقاية"; },
        code: 'view_risk_register',
        riskLevel: 'STANDARD',
      },
      {
        id: 'manage_risk_register',
        get label() { return "إدارة وتحديث سجل ومصفوفات المخاطر الميدانية"; },
        get desc() { return "إضافة وتحديث بنود سجل المخاطر ومستويات الاحتمالية والأثر وتعيين مسؤولي المتابعة"; },
        code: 'manage_risk_register',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'assess_risk',
        get label() { return "إجراء التقييم الميداني والتحليل النوعي للمخاطر"; },
        get desc() { return "إجراء المسوحات الميدانية وتطبيق منهجيات تقييم المخاطر للمواقع والوفود والمنشآت الحيوية"; },
        code: 'assess_risk',
        riskLevel: 'OPERATIONAL',
      },
    ],
  },
  {
    id: 'training',
    get title() { return "أكاديمية التدريب وبناء القدرات"; },
    get desc() { return "البرامج التدريبية المعتمدة، اعتماد المدربين والخبراء، المناهج واختبارات قياس الكفاءة"; },
    icon: GraduationCap,
    capabilities: [
      {
        id: 'manage_training',
        get label() { return "إدارة وتخطيط البرامج والدورات التدريبية"; },
        get desc() { return "جدولة الدورات الأمنية، متابعة طلبات التسجيل، إصدار الشهادات، وتتبع الحضور والغياب"; },
        code: 'manage_training',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'manage_trainers',
        get label() { return "إدارة بيانات واعتمادات المدربين والخبراء الأكاديميين"; },
        get desc() { return "توثيق سجلات المدربين، الاعتمادات المهنية، تقييمات الأداء، وإسناد الدورات والمحاضرات"; },
        code: 'manage_trainers',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'manage_training_content',
        get label() { return "إدارة الحقائب التدريبية والمناهج واختبارات الكفاءة"; },
        get desc() { return "رفع وتحديث المحتوى التدريبي والمناهج، بنوك الأسئلة، واختبارات قياس الكفاءة القبلية والبعدية"; },
        code: 'manage_training_content',
        riskLevel: 'OPERATIONAL',
      },
    ],
  },
  {
    id: 'research',
    get title() { return "الدراسات والبحوث والذكاء التشغيلي"; },
    get desc() { return "المنتجات المعرفية، تقارير تقدير الموقف، مؤشرات الأداء KPI، وضبط جودة التقارير QA"; },
    icon: BookOpen,
    capabilities: [
      {
        id: 'manage_research',
        get label() { return "إدارة ونشر المنتجات المعرفية والدراسات والأبحاث"; },
        get desc() { return "إعداد ونشر الأوراق البحثية، تقارير تقدير الموقف، وضبط مستوى الرؤية للجمهور أو الشركاء"; },
        code: 'manage_research',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'view_kpi',
        get label() { return "لوحة مؤشرات الأداء والذكاء التشغيلي والتحليلي (KPI)"; },
        get desc() { return "مراقبة معدلات الاستجابة، الجاهزية التشغيلية، ومؤشرات الكفاءة التشغيلية عبر قطاعات المركز"; },
        code: 'view_kpi',
        riskLevel: 'STANDARD',
      },
      {
        id: 'qa_reports',
        get label() { return "مراقبة واعتماد وضبط جودة التقارير الميدانية (QA)"; },
        get desc() { return "مراجعة تقارير التقييم النهائي، التدقيق اللغوي والأمني، واعتماد الوثائق للتسليم النهائي"; },
        code: 'qa_reports',
        riskLevel: 'OPERATIONAL',
      },
    ],
  },
  {
    id: 'system',
    get title() { return "إدارة وتشغيل المنظومة والرقابة"; },
    get desc() { return "إدارة الكوادر والمستخدمين، المحتوى المؤسسي، إعدادات النظام وسجلات التدقيق الأمني"; },
    icon: Settings,
    capabilities: [
      {
        id: 'manage_users',
        get label() { return "إدارة حسابات الكوادر والمستخدمين وتعيين الصلاحيات"; },
        get desc() { return "تفعيل وتجميد الحسابات ومنح وسحب الصلاحيات الدقيقة للكوادر وفق مبدأ الحد الأدنى"; },
        code: 'manage_users',
        riskLevel: 'CRITICAL',
      },
      {
        id: 'manage_content',
        get label() { return "إدارة وتحديث المحتوى المؤسسي للموقع والخدمات (CMS)"; },
        get desc() { return "تعديل مبادئ العمل، قطاعات النشاط، الخدمات المعروضة، والبيانات التعريفية للمركز"; },
        code: 'manage_content',
        riskLevel: 'OPERATIONAL',
      },
      {
        id: 'manage_messages',
        get label() { return "إدارة رسائل واستفسارات التواصل والأرشفة"; },
        get desc() { return "مراجعة رسائل نموذج الاتصال وتوثيق الردود الرسمية وأرشفة الاستفسارات الواردة"; },
        code: 'manage_messages',
        riskLevel: 'STANDARD',
      },
      {
        id: 'manage_settings',
        get label() { return "إدارة إعدادات النظام ومعلومات الاتصال الرسمية"; },
        get desc() { return "تحديث هواتف الطوارئ، عناوين المركز، سياسات الجلسة، والبيانات المؤسسية الحساسة"; },
        code: 'manage_settings',
        riskLevel: 'CRITICAL',
      },
      {
        id: 'view_audit_logs',
        get label() { return "استعراض سجلات الرقابة والتدقيق الأمني الحساسة"; },
        get desc() { return "تتبع كافة العمليات الحساسة، تعديلات الصلاحيات، وتحركات المشرفين في المنظومة لضمان النزاهة"; },
        code: 'view_audit_logs',
        riskLevel: 'SENSITIVE',
      },
    ],
  },
];

export const ALL_CAPABILITY_DEFINITIONS = CAPABILITY_CATEGORIES.flatMap((c) => c.capabilities);

export function getRoleInheritedCapabilities(role: string): string[] {
  if (role === ROLES.SUPER_ADMIN) return [...ALL_CAPABILITIES];
  if (role === ROLES.ADMIN) return [...ADMIN_OPERATIONAL_CAPABILITIES];
  if (LEGACY_ROLE_CAPABILITIES[role]) return [...LEGACY_ROLE_CAPABILITIES[role]];
  return [];
}

interface UserPermissionsModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (userId: string, updatedCapabilities: string[]) => void;
  currentUserRole: string;
  currentUserId: string;
}

export default function UserPermissionsModal({
  user,
  isOpen,
  onClose,
  onSaved,
  currentUserRole,
  currentUserId,
}: UserPermissionsModalProps) {
  const { tx } = useAdminT();

  // Baseline state (persisted) & Draft state (staged in UI)
  const [baselineAssigned, setBaselineAssigned] = useState<Set<string>>(new Set());
  const [draftAssigned, setDraftAssigned] = useState<Set<string>>(new Set());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'GRANTED' | 'NOT_GRANTED' | 'MODIFIED'>('ALL');

  // Category Collapsed state (all open by default)
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Asynchronous mutation & feedback states
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Confirmation Overlays
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [bulkConfirmDialog, setBulkConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'GRANT_ALL' | 'REVOKE_ALL';
    affectedCount: number;
    affectedIds: string[];
  } | null>(null);

  // Initialize Baseline & Draft when user or modal opens
  useEffect(() => {
    if (user && isOpen) {
      const initialAssigned = new Set(user.assignedCapabilities || []);
      setBaselineAssigned(initialAssigned);
      setDraftAssigned(initialAssigned);
      setSearchQuery('');
      setFilterStatus('ALL');
      setSaveError(null);
      setSaveSuccess(null);
      setShowDiscardConfirm(false);
      setBulkConfirmDialog(null);
      setCollapsedCategories({});
    }
  }, [user, isOpen]);

  // Capabilities inherited inherently by the user's role
  const inheritedCaps = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(getRoleInheritedCapabilities(user.role));
  }, [user]);

  // Check if a capability is effective (active in draft or inherited)
  const isCapabilityEffective = (capId: string): boolean => {
    if (inheritedCaps.has(capId)) return true;
    return draftAssigned.has(capId);
  };

  // Check if a capability is inherited directly from the role
  const isCapabilityInherited = (capId: string): boolean => {
    return inheritedCaps.has(capId);
  };

  // Check if a capability is editable for this user and current actor
  const isCapabilityEditable = (capId: string): boolean => {
    if (!user) return false;
    // Super Admin has all capabilities unconditionally
    if (user.role === ROLES.SUPER_ADMIN) return false;
    // Inherited role capabilities are inherent to the role definition
    if (inheritedCaps.has(capId)) return false;
    // Field focal points can ONLY have submit_incident
    if (user.role === ROLES.FIELD_FOCAL_POINT && capId !== CAPABILITIES.SUBMIT_INCIDENT) return false;
    // Non-super-admins cannot assign sensitive system capabilities
    if (currentUserRole !== ROLES.SUPER_ADMIN) {
      const sensitive = [CAPABILITIES.MANAGE_USERS, CAPABILITIES.MANAGE_SETTINGS, CAPABILITIES.APPROVE_INCIDENT_ALERT];
      if (sensitive.includes(capId as any)) return false;
    }
    return true;
  };

  // Track pending added and removed capabilities compared to baseline
  const pendingAdded = useMemo(() => {
    return Array.from(draftAssigned).filter((c) => !baselineAssigned.has(c));
  }, [draftAssigned, baselineAssigned]);

  const pendingRemoved = useMemo(() => {
    return Array.from(baselineAssigned).filter((c) => !draftAssigned.has(c));
  }, [draftAssigned, baselineAssigned]);

  const pendingChangesCount = pendingAdded.length + pendingRemoved.length;
  const isDirty = pendingChangesCount > 0;

  // Counts across the 24 capabilities
  const totalCount = ALL_CAPABILITY_DEFINITIONS.length;
  const grantedCount = useMemo(() => {
    return ALL_CAPABILITY_DEFINITIONS.filter((c) => isCapabilityEffective(c.id)).length;
  }, [draftAssigned, inheritedCaps]);
  const notGrantedCount = totalCount - grantedCount;
  const inheritedCount = ALL_CAPABILITY_DEFINITIONS.filter((c) => inheritedCaps.has(c.id)).length;

  // Individual toggle handler (updates draft only)
  const handleTogglePermission = (capId: string) => {
    if (!isCapabilityEditable(capId) || isSaving) return;

    setDraftAssigned((prev) => {
      const next = new Set(prev);
      if (next.has(capId)) {
        next.delete(capId);
      } else {
        next.add(capId);
      }
      return next;
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  // Category-level bulk toggle (updates draft only)
  const handleCategoryBulkToggle = (categoryCapIds: string[], grant: boolean) => {
    if (isSaving) return;

    setDraftAssigned((prev) => {
      const next = new Set(prev);
      for (const id of categoryCapIds) {
        if (isCapabilityEditable(id)) {
          if (grant) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
      }
      return next;
    });
    setSaveError(null);
    setSaveSuccess(null);
  };

  // Global Bulk Actions (opens confirmation dialog)
  const handleTriggerGlobalBulk = (type: 'GRANT_ALL' | 'REVOKE_ALL') => {
    if (isSaving || !user) return;

    if (type === 'GRANT_ALL') {
      const eligibleIds = ALL_CAPABILITY_DEFINITIONS
        .map((c) => c.id)
        .filter((id) => isCapabilityEditable(id) && !draftAssigned.has(id));

      if (eligibleIds.length === 0) return;
      setBulkConfirmDialog({
        isOpen: true,
        type: 'GRANT_ALL',
        affectedCount: eligibleIds.length,
        affectedIds: eligibleIds,
      });
    } else {
      const eligibleIds = ALL_CAPABILITY_DEFINITIONS
        .map((c) => c.id)
        .filter((id) => isCapabilityEditable(id) && draftAssigned.has(id));

      if (eligibleIds.length === 0) return;
      setBulkConfirmDialog({
        isOpen: true,
        type: 'REVOKE_ALL',
        affectedCount: eligibleIds.length,
        affectedIds: eligibleIds,
      });
    }
  };

  const handleApplyGlobalBulk = () => {
    if (!bulkConfirmDialog) return;

    setDraftAssigned((prev) => {
      const next = new Set(prev);
      if (bulkConfirmDialog.type === 'GRANT_ALL') {
        bulkConfirmDialog.affectedIds.forEach((id) => next.add(id));
      } else {
        bulkConfirmDialog.affectedIds.forEach((id) => next.delete(id));
      }
      return next;
    });

    setBulkConfirmDialog(null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  // Toggle Category Collapsed
  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // Expand All / Collapse All
  const handleToggleAllCategories = (collapse: boolean) => {
    const newState: Record<string, boolean> = {};
    CAPABILITY_CATEGORIES.forEach((cat) => {
      newState[cat.id] = collapse;
    });
    setCollapsedCategories(newState);
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    if (!user || !isDirty || isSaving) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const finalCapabilities = Array.from(draftAssigned);

      const res = await fetch(`/api/admin/users/${user.id}/capabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capabilities: finalCapabilities }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || tx("تعذر حفظ التغييرات على الصلاحيات"));
      }

      // Update baseline and notify parent
      setBaselineAssigned(new Set(finalCapabilities));
      onSaved(user.id, finalCapabilities);
      setSaveSuccess(tx("تم حفظ تعديلات الصلاحيات بنجاح وسريانها فورياً"));
    } catch (err: any) {
      setSaveError(err.message || tx("حدث خطأ أثناء حفظ الصلاحيات"));
    } finally {
      setIsSaving(false);
    }
  };

  // Close and Discard Flow
  const handleRequestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setDraftAssigned(new Set(baselineAssigned));
    setShowDiscardConfirm(false);
    onClose();
  };

  // Footer Actions
  const modalFooter = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isDirty && (
          <span style={{ fontSize: '0.8rem', color: '#D97706', fontWeight: 600 }}>
            {tx("لديك {0} تعديل غير محفوظ", pendingChangesCount)}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <AdminButton
          variant="secondary"
          size="md"
          disabled={isSaving}
          onClick={handleRequestClose}
        >
          {tx("إلغاء")}
        </AdminButton>

        <AdminButton
          variant="primary"
          size="md"
          loading={isSaving}
          disabled={isSaving || !isDirty}
          onClick={handleSaveChanges}
        >
          <Save size={16} />
          <span>{tx("حفظ التغييرات")}</span>
        </AdminButton>
      </div>
    </div>
  );

  if (!isOpen || !user) return null;

  return (
    <>
      <AdminModal
        isOpen={isOpen}
        onClose={handleRequestClose}
        title={tx("إدارة صلاحيات المستخدم")}
        maxWidth="940px"
        footer={modalFooter}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Unified Compact User Identity & Stats Header Card */}
          <div
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--admin-card-border)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Top Row: User Identity */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '8px',
                    background: 'rgba(181, 146, 84, 0.15)',
                    color: 'var(--color-gold-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    flexShrink: 0,
                  }}
                >
                  {user.fullName ? user.fullName.charAt(0) : <Users size={20} />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {user.fullName}
                    </h4>
                    <AdminStatusBadge status={user.role} />
                    {inheritedCount > 0 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: 'rgba(22, 163, 74, 0.1)',
                          color: '#16A34A',
                          fontWeight: 700,
                          border: '1px solid rgba(22, 163, 74, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Layers size={13} />
                        <span>{tx("{0} صلاحية أصيلة موروثة من الرتبة", inheritedCount)}</span>
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    <span dir="ltr" style={{ fontFamily: 'var(--font-en)' }}>{user.email}</span>
                    {user.organization && (
                      <>
                        <span>•</span>
                        <span>{user.organization}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Security notes */}
              {user.role === ROLES.SUPER_ADMIN ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(181, 146, 84, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-gold-500)' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--color-gold-600)' }} />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-gold-700)' }}>
                    {tx("صلاحيات مطلقة وتلقائية (SUPER_ADMIN)")}
                  </span>
                </div>
              ) : user.role === ROLES.FIELD_FOCAL_POINT ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(11, 61, 46, 0.08)', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid var(--admin-card-border)' }}>
                  <Lock size={14} style={{ color: 'var(--color-primary-900)' }} />
                  <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)' }}>
                    {tx("سياسة عزل: محصور بتقديم البلاغات الميدانية")}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Bottom Row: 4 Metric Stats Pills in a sleek horizontal strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.75rem',
                background: 'var(--surface-bg)',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid var(--admin-card-border)',
              }}
            >
              {/* Total */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{tx("إجمالي الصلاحيات")}</span>
                <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCount}</strong>
              </div>

              {/* Granted */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.15rem' }}>
                  <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700 }}>{tx("الصلاحيات الممنوحة")}</span>
                  {inheritedCount > 0 && (
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>({inheritedCount} موروثة)</span>
                  )}
                </div>
                <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: '#16A34A' }}>{grantedCount}</strong>
              </div>

              {/* Not Granted */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>{tx("الصلاحيات غير الممنوحة")}</span>
                <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{notGrantedCount}</strong>
              </div>

              {/* Unsaved Changes */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.72rem', color: isDirty ? '#D97706' : 'var(--text-muted)', fontWeight: isDirty ? 700 : 500, marginBottom: '0.15rem' }}>
                  {tx("تعديلات غير محفوظة")}
                </span>
                <strong style={{ fontSize: '1.35rem', fontWeight: 800, color: isDirty ? '#D97706' : 'var(--text-muted)' }}>
                  {pendingChangesCount}
                </strong>
              </div>
            </div>
          </div>

          {/* Feedback Alerts */}
          {saveError && (
            <AdminAlert variant="danger">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{saveError}</span>
                <button
                  type="button"
                  onClick={() => setSaveError(null)}
                  style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>
            </AdminAlert>
          )}

          {saveSuccess && (
            <AdminAlert variant="success">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{saveSuccess}</span>
                <button
                  type="button"
                  onClick={() => setSaveSuccess(null)}
                  style={{ background: 'none', border: 'none', color: '#16A34A', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              </div>
            </AdminAlert>
          )}

          {/* Search & Filter Toolbar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              padding: '0.85rem 1rem',
              background: 'var(--surface-card)',
              borderRadius: '10px',
              border: '1px solid var(--admin-card-border)',
            }}
          >
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <AdminSearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={tx("بحث باسم الصلاحية، المعرّف التقني، أو القسم...")}
                />
              </div>

              {/* Accordion Expand/Collapse Controls */}
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleToggleAllCategories(false)}
                  style={{
                    background: 'var(--surface-bg)',
                    border: '1px solid var(--admin-card-border)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <ChevronDown size={14} />
                  <span>{tx("توسيع الكل")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllCategories(true)}
                  style={{
                    background: 'var(--surface-bg)',
                    border: '1px solid var(--admin-card-border)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <ChevronUp size={14} />
                  <span>{tx("طي الكل")}</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Global Bulk Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.55rem', paddingTop: '0.45rem', borderTop: '1px solid var(--admin-card-border)' }}>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {(['ALL', 'GRANTED', 'NOT_GRANTED', 'MODIFIED'] as const).map((status) => {
                  if (status === 'MODIFIED' && !isDirty) return null;

                  const isActive = filterStatus === status;
                  const labels = {
                    ALL: tx("كافة الصلاحيات ({0})", totalCount),
                    GRANTED: tx("الممنوحة ({0})", grantedCount),
                    NOT_GRANTED: tx("غير الممنوحة ({0})", notGrantedCount),
                    MODIFIED: tx("المعدلة حالياً ({0})", pendingChangesCount),
                  };

                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setFilterStatus(status)}
                      style={{
                        padding: '0.32rem 0.72rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: isActive ? 700 : 500,
                        background: isActive ? 'var(--color-primary-900)' : 'var(--surface-bg)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        border: isActive ? '1px solid var(--color-primary-900)' : '1px solid var(--admin-card-border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {labels[status]}
                    </button>
                  );
                })}

                {(searchQuery || filterStatus !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('ALL');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-gold-600)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      padding: '0.3rem 0.5rem',
                      textDecoration: 'underline',
                    }}
                  >
                    {tx("إعادة تعيين الفلاتر")}
                  </button>
                )}
              </div>

              {/* Global Safe Bulk Actions (Staging only) */}
              {user.role !== ROLES.SUPER_ADMIN && user.role !== ROLES.FIELD_FOCAL_POINT && (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleTriggerGlobalBulk('GRANT_ALL')}
                    disabled={isSaving}
                    style={{
                      padding: '0.28rem 0.65rem',
                      borderRadius: '5px',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      background: 'rgba(181, 146, 84, 0.08)',
                      border: '1px solid var(--color-gold-500)',
                      color: 'var(--color-gold-600)',
                      cursor: 'pointer',
                    }}
                  >
                    {tx("تحديد كافة الصلاحيات المتاحة")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerGlobalBulk('REVOKE_ALL')}
                    disabled={isSaving}
                    style={{
                      padding: '0.28rem 0.65rem',
                      borderRadius: '5px',
                      fontSize: '0.73rem',
                      fontWeight: 600,
                      background: 'transparent',
                      border: '1px solid var(--admin-card-border)',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {tx("إلغاء تحديد كافة الصلاحيات المخصصة")}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Categorized Collapsible Sections — Naturally scrolling within modal body, no nested scroll trap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {CAPABILITY_CATEGORIES.map((category) => {
              const CategoryIcon = category.icon;
              const isCollapsed = Boolean(collapsedCategories[category.id]);

              // Filter capabilities inside category
              const matchingCaps = category.capabilities.filter((cap) => {
                const effective = isCapabilityEffective(cap.id);
                const modified = baselineAssigned.has(cap.id) !== draftAssigned.has(cap.id);

                if (filterStatus === 'GRANTED' && !effective) return false;
                if (filterStatus === 'NOT_GRANTED' && effective) return false;
                if (filterStatus === 'MODIFIED' && !modified) return false;

                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const matchLabel = cap.label.toLowerCase().includes(q);
                  const matchDesc = cap.desc.toLowerCase().includes(q);
                  const matchCode = cap.code.toLowerCase().includes(q);
                  const matchCategory = category.title.toLowerCase().includes(q);
                  return matchLabel || matchDesc || matchCode || matchCategory;
                }
                return true;
              });

              if (matchingCaps.length === 0 && (searchQuery.trim() || filterStatus !== 'ALL')) {
                return null;
              }

              const catTotal = category.capabilities.length;
              const catGranted = category.capabilities.filter((c) => isCapabilityEffective(c.id)).length;
              const catEditable = category.capabilities.filter((c) => isCapabilityEditable(c.id));
              const catEditableGranted = catEditable.filter((c) => draftAssigned.has(c.id)).length;
              const catModifiedCount = category.capabilities.filter(
                (c) => baselineAssigned.has(c.id) !== draftAssigned.has(c.id)
              ).length;

              const allEditableGranted = catEditable.length > 0 && catEditableGranted === catEditable.length;
              const noneEditableGranted = catEditableGranted === 0;

              return (
                <div
                  key={category.id}
                  style={{
                    background: 'var(--surface-card)',
                    border: '1px solid var(--admin-card-border)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    width: '100%',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Category Collapsible Header */}
                  <div
                    style={{
                      padding: '0.85rem 1.15rem',
                      background: 'rgba(11, 61, 46, 0.03)',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--admin-card-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Category Title & Click Target */}
                    <div
                      onClick={() => toggleCategoryCollapse(category.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        cursor: 'pointer',
                        userSelect: 'none',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: 'rgba(181, 146, 84, 0.15)',
                          color: 'var(--color-gold-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <CategoryIcon size={18} />
                      </div>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {category.title}
                          </h4>
                          {/* Unambiguous Arabic format without slash inversion */}
                          <span
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.12rem 0.5rem',
                              borderRadius: '12px',
                              fontWeight: 700,
                              background: catGranted > 0 ? 'rgba(22, 163, 74, 0.12)' : 'var(--surface-bg)',
                              color: catGranted > 0 ? '#16A34A' : 'var(--text-muted)',
                              border: catGranted > 0 ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid var(--admin-card-border)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {catGranted} من {catTotal} {tx("ممنوحة")}
                          </span>

                          {catModifiedCount > 0 && (
                            <span
                              style={{
                                fontSize: '0.68rem',
                                padding: '0.12rem 0.45rem',
                                borderRadius: '12px',
                                fontWeight: 700,
                                background: 'rgba(217, 119, 6, 0.15)',
                                color: '#D97706',
                                border: '1px solid rgba(217, 119, 6, 0.35)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {catModifiedCount} {tx("تعديل معلق ★")}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.15rem' }}>
                          {category.desc}
                        </span>
                      </div>
                    </div>

                    {/* Category Bulk Actions & Chevron */}
                    <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexShrink: 0 }}>
                      {catEditable.length > 0 && (
                        <>
                          <button
                            type="button"
                            disabled={allEditableGranted || isSaving}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryBulkToggle(catEditable.map((c) => c.id), true);
                            }}
                            title={tx("تحديد كافة الصلاحيات القابلة للتعديل في هذا القسم")}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              border: '1px solid var(--color-gold-500)',
                              background: 'rgba(181, 146, 84, 0.08)',
                              color: 'var(--color-gold-600)',
                              fontWeight: 700,
                              cursor: allEditableGranted ? 'not-allowed' : 'pointer',
                              opacity: allEditableGranted ? 0.45 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx("تحديد القسم")}
                          </button>

                          <button
                            type="button"
                            disabled={noneEditableGranted || isSaving}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryBulkToggle(catEditable.map((c) => c.id), false);
                            }}
                            title={tx("إلغاء تحديد الصلاحيات المخصصة في هذا القسم")}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.25rem 0.55rem',
                              borderRadius: '4px',
                              border: '1px solid var(--admin-card-border)',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                              cursor: noneEditableGranted ? 'not-allowed' : 'pointer',
                              opacity: noneEditableGranted ? 0.45 : 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {tx("إلغاء القسم")}
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleCategoryCollapse(category.id)}
                        aria-label={isCollapsed ? tx("توسيع القسم") : tx("طي القسم")}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          padding: '0.2rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Capabilities List (Collapsible Body) */}
                  {!isCollapsed && (
                    <div style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: '#FFFFFF' }}>
                      {matchingCaps.map((cap) => {
                        const effective = isCapabilityEffective(cap.id);
                        const inherited = isCapabilityInherited(cap.id);
                        const editable = isCapabilityEditable(cap.id);
                        const modified = baselineAssigned.has(cap.id) !== draftAssigned.has(cap.id);
                        const isPendingAdd = draftAssigned.has(cap.id) && !baselineAssigned.has(cap.id);
                        const isPendingRemove = !draftAssigned.has(cap.id) && baselineAssigned.has(cap.id);

                        return (
                          <div
                            key={cap.id}
                            style={{
                              padding: '0.85rem 1rem',
                              background: modified
                                ? 'rgba(217, 119, 6, 0.05)'
                                : effective
                                ? 'rgba(22, 163, 74, 0.03)'
                                : 'var(--surface-bg)',
                              border: modified
                                ? '1.5px dashed #D97706'
                                : effective
                                ? '1px solid rgba(22, 163, 74, 0.35)'
                                : '1px solid var(--admin-card-border)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.85rem',
                              flexShrink: 0,
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                  {cap.label}
                                </strong>

                                {/* Technical Code Badge */}
                                <code
                                  style={{
                                    fontSize: '0.68rem',
                                    padding: '0.1rem 0.35rem',
                                    borderRadius: '4px',
                                    background: 'rgba(11, 61, 46, 0.08)',
                                    color: 'var(--color-primary-900)',
                                    fontFamily: 'monospace',
                                  }}
                                >
                                  {cap.code}
                                </code>

                                {/* Source and Status Badges */}
                                {inherited ? (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '0.1rem 0.45rem',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                      background: 'rgba(22, 163, 74, 0.12)',
                                      color: '#16A34A',
                                      border: '1px solid rgba(22, 163, 74, 0.3)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                    }}
                                  >
                                    <Layers size={11} />
                                    <span>{tx("موروثة من الرتبة")}</span>
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '0.1rem 0.45rem',
                                      borderRadius: '4px',
                                      fontWeight: 600,
                                      background: 'var(--surface-card)',
                                      color: 'var(--text-secondary)',
                                      border: '1px solid var(--admin-card-border)',
                                    }}
                                  >
                                    {tx("مخصصة مباشرة")}
                                  </span>
                                )}

                                {/* Pending Staged Change Badge */}
                                {modified && (
                                  <span
                                    style={{
                                      fontSize: '0.68rem',
                                      padding: '0.1rem 0.45rem',
                                      borderRadius: '4px',
                                      fontWeight: 700,
                                      background: isPendingAdd ? 'rgba(22, 163, 74, 0.15)' : 'rgba(220, 38, 38, 0.12)',
                                      color: isPendingAdd ? '#16A34A' : '#DC2626',
                                      border: isPendingAdd ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(220, 38, 38, 0.3)',
                                    }}
                                  >
                                    {isPendingAdd ? tx("+ إضافة معلقة بالمسودة") : tx("- سحب معلق بالمسودة")}
                                  </span>
                                )}
                              </div>

                              <span
                                style={{
                                  fontSize: '0.74rem',
                                  color: 'var(--text-secondary)',
                                  display: 'block',
                                  marginTop: '0.25rem',
                                  lineHeight: 1.45,
                                }}
                              >
                                {cap.desc}
                              </span>

                              {/* Inherited Notice */}
                              {inherited && (
                                <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                                  ℹ {tx("صلاحية أصيلة لرتبة المستخدم ({0}) ولا يمكن إلغاؤها إلا بتغيير رتبة الحساب.", user.role)}
                                </span>
                              )}

                              {!editable && !inherited && user.role === ROLES.FIELD_FOCAL_POINT && (
                                <span style={{ fontSize: '0.71rem', color: '#DC2626', display: 'block', marginTop: '0.2rem' }}>
                                  🔒 {tx("محظورة بموجب سياسة العزل الأمني لنقاط الاتصال الميدانية.")}
                                </span>
                              )}
                            </div>

                            {/* Accessible Modern Toggle Switch */}
                            <div style={{ flexShrink: 0 }}>
                              {inherited ? (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    background: 'rgba(22, 163, 74, 0.12)',
                                    color: '#16A34A',
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    border: '1px solid rgba(22, 163, 74, 0.3)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Lock size={13} />
                                  <span>{tx("مفعلة ومحمية")}</span>
                                </div>
                              ) : !editable ? (
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '6px',
                                    background: 'var(--surface-bg)',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.74rem',
                                    border: '1px solid var(--admin-card-border)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <Lock size={13} />
                                  <span>{tx("غير مصرح")}</span>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={effective}
                                  disabled={isSaving}
                                  onClick={() => handleTogglePermission(cap.id)}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    cursor: 'pointer',
                                    background: effective ? 'rgba(22, 163, 74, 0.1)' : 'var(--surface-bg)',
                                    border: effective ? '1.5px solid #16A34A' : '1.5px solid var(--admin-card-border)',
                                    borderRadius: '20px',
                                    padding: '0.25rem 0.65rem 0.25rem 0.35rem',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <span
                                    style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      background: effective ? '#16A34A' : '#94A3B8',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#FFFFFF',
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    {effective ? <Check size={12} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.78rem',
                                      fontWeight: 700,
                                      color: effective ? '#16A34A' : 'var(--text-muted)',
                                    }}
                                  >
                                    {effective ? tx("ممنوحة") : tx("معطلة")}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </AdminModal>

      {/* Discard Confirmation Dialog */}
      {showDiscardConfirm && (
        <div
          className="admin-modal-backdrop"
          style={{ zIndex: 1100 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-modal"
            style={{
              maxWidth: '460px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(217, 119, 6, 0.15)',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {tx("تجاهل التعديلات المعلقة؟")}
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {tx("لديك {0} تعديل غير محفوظ على مصفوفة الصلاحيات.", pendingChangesCount)}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {tx("في حال الإغلاق الآن، ستفقد كافة التغييرات التي قمت بها في المسودة وسيعود حساب المستخدم للصلاحيات المحفوظة سابقاً.")}
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <AdminButton
                variant="secondary"
                size="md"
                onClick={() => setShowDiscardConfirm(false)}
              >
                {tx("متابعة التعديل")}
              </AdminButton>
              <AdminButton
                variant="danger"
                size="md"
                onClick={handleConfirmDiscard}
              >
                {tx("تجاهل التعديلات وإغلاق")}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Global Bulk Operation Confirmation Dialog */}
      {bulkConfirmDialog && bulkConfirmDialog.isOpen && (
        <div
          className="admin-modal-backdrop"
          style={{ zIndex: 1100 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="admin-modal"
            style={{
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(181, 146, 84, 0.15)',
                  color: 'var(--color-gold-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {bulkConfirmDialog.type === 'GRANT_ALL'
                    ? tx("تأكيد تحديد كافة الصلاحيات المتاحة")
                    : tx("تأكيد إلغاء تحديد الصلاحيات المخصصة")}
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {tx("عملية مجمعة تشمل {0} صلاحية قابلة للتعديل.", bulkConfirmDialog.affectedCount)}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {bulkConfirmDialog.type === 'GRANT_ALL'
                ? tx("سيتم وضع علامة 'ممنوحة' على كافة الصلاحيات القابلة للتعديل في المسودة الحالية. لن تصبح التغييرات سارية على حساب المستخدم إلا بعد الضغط على 'حفظ التغييرات'.")
                : tx("سيتم إزالة تحديد الصلاحيات المخصصة في المسودة الحالية (مع الإبقاء التام على الصلاحيات الأصيلة الموروثة من الرتبة). لن تصبح التغييرات سارية إلا بعد النقر على 'حفظ التغييرات'.")}
            </p>

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <AdminButton
                variant="secondary"
                size="md"
                onClick={() => setBulkConfirmDialog(null)}
              >
                {tx("تراجع")}
              </AdminButton>
              <AdminButton
                variant="primary"
                size="md"
                onClick={handleApplyGlobalBulk}
              >
                {tx("تطبيق في المسودة")}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
