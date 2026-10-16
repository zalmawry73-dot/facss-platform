'use client';

import React from 'react';
import { type LucideIcon, CheckCircle2, Clock, AlertTriangle, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { useAdminT } from '@/lib/admin-i18n';

export type AdminStatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface AdminStatusBadgeProps {
  status?: string;
  variant?: AdminStatusVariant;
  label?: React.ReactNode;
  icon?: LucideIcon | React.ReactNode;
  dot?: boolean;
  className?: string;
}

const STATUS_VARIANT_MAP: Record<string, AdminStatusVariant> = {
  // Positive / Finished
  APPROVED: 'success',
  COMPLETED: 'success',
  RESOLVED: 'success',
  VERIFIED: 'success',
  ACTIVE: 'success',
  NORMAL: 'success',
  READ: 'success',
  PUBLISHED: 'success',
  AVAILABLE: 'success',
  RECEIVED: 'success',
  PASS: 'success',
  DELIVERED: 'success',
  HANDOVER: 'success',
  STAFF: 'info',
  SUPER_ADMIN: 'warning',

  // Pending / Progress / Caution
  PENDING: 'warning',
  UNDER_REVIEW: 'warning',
  IN_PROGRESS: 'warning',
  MEDIUM: 'warning',
  HIGH: 'warning',
  WARNING: 'warning',
  LOW_STOCK: 'warning',
  PARTIALLY_RECEIVED: 'warning',
  CONDITIONAL: 'warning',
  IN_TRANSIT: 'warning',
  MAINTENANCE: 'warning',
  RETURN: 'warning',

  // Critical / Negative / Alert
  REJECTED: 'danger',
  CANCELLED: 'danger',
  CRITICAL: 'danger',
  URGENT: 'danger',
  DANGER: 'danger',
  FAILED: 'danger',
  FAIL: 'danger',
  UNREAD: 'danger',
  OUT_OF_STOCK: 'danger',
  DAMAGED: 'danger',

  // Informative / New
  NEW: 'info',
  INFO: 'info',
  OPEN: 'info',
  REQUESTED: 'info',
  ORDERED: 'info',
  PREPARED: 'info',
  SCHEDULED: 'info',
  PURCHASE: 'info',
  CLIENT: 'neutral',
  TRAINEE: 'info',

  // Neutral / Archival
  DRAFT: 'neutral',
  ARCHIVED: 'neutral',
  INACTIVE: 'neutral',
  CLOSED: 'neutral',
  RETIRED: 'neutral',
  ADJUSTMENT: 'neutral',
  INITIAL: 'neutral',
};

const STATUS_LABEL_MAP_AR: Record<string, string> = {
  NEW: 'طلب جديد',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض',
  CANCELLED: 'ملغي',
  PENDING: 'معلق',
  VERIFIED: 'تم التحقق',
  RESOLVED: 'تمت المعالجة',
  URGENT: 'عاجل جداً',
  HIGH: 'أولوية عالية',
  NORMAL: 'عادية',
  ACTIVE: 'نشط',
  INACTIVE: 'معطل',
  UNREAD: 'غير مقروء',
  READ: 'تم الاطلاع',
  DRAFT: 'مسودة',
  ARCHIVED: 'مؤرشف',
  SUPER_ADMIN: 'مشرف عام',
  STAFF: 'موظف عمليات',
  CLIENT: 'عميل',
  TRAINEE: 'متدرب',
  // Equipment & Inventory
  AVAILABLE: 'متوفر',
  LOW_STOCK: 'مخزون منخفض',
  OUT_OF_STOCK: 'نفد المخزون',
  REQUESTED: 'تم الطلب',
  ORDERED: 'تم إصدار الأمر',
  PARTIALLY_RECEIVED: 'مستلم جزئياً',
  RECEIVED: 'مستلم',
  CLOSED: 'مغلق',
  PASS: 'مجاز ومطابق (PASS)',
  FAIL: 'راسب وغير مطابق (FAIL)',
  CONDITIONAL: 'مشروط بتعديل (CONDITIONAL)',
  PREPARED: 'مجهز للتسليم',
  IN_TRANSIT: 'قيد النقل',
  DELIVERED: 'تم التسليم',
  SCHEDULED: 'مجدولة',
  MAINTENANCE: 'قيد الصيانة',
  DAMAGED: 'تالف',
  RETIRED: 'مستبعد',
  ADJUSTMENT: 'تسوية مخزنية',
  INITIAL: 'رصيد افتتاحي',
  PURCHASE: 'شراء وتوريد',
  HANDOVER: 'تسليم عهدة',
  RETURN: 'استرجاع',
};

const STATUS_LABEL_MAP_EN: Record<string, string> = {
  NEW: 'New Request',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  RESOLVED: 'Resolved',
  URGENT: 'Urgent',
  HIGH: 'High Priority',
  NORMAL: 'Normal',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  UNREAD: 'Unread',
  READ: 'Read',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
  SUPER_ADMIN: 'Super Admin',
  STAFF: 'Operations Staff',
  CLIENT: 'Client',
  TRAINEE: 'Trainee',
  // Equipment & Inventory
  AVAILABLE: 'Available',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  REQUESTED: 'Requested',
  ORDERED: 'Ordered',
  PARTIALLY_RECEIVED: 'Partially Received',
  RECEIVED: 'Received',
  CLOSED: 'Closed',
  PASS: 'Pass (Compliant)',
  FAIL: 'Fail (Non-Compliant)',
  CONDITIONAL: 'Conditional',
  PREPARED: 'Prepared',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  SCHEDULED: 'Scheduled',
  MAINTENANCE: 'Under Maintenance',
  DAMAGED: 'Damaged',
  RETIRED: 'Retired',
  ADJUSTMENT: 'Inventory Adjustment',
  INITIAL: 'Initial Balance',
  PURCHASE: 'Purchase & Supply',
  HANDOVER: 'Handover Delivery',
  RETURN: 'Return',
};

const DEFAULT_ICONS: Record<AdminStatusVariant, LucideIcon> = {
  success: CheckCircle2,
  warning: Clock,
  danger: AlertCircle,
  info: Info,
  neutral: ShieldCheck,
};

export default function AdminStatusBadge({
  status,
  variant,
  label,
  icon: CustomIcon,
  dot = false,
  className = '',
}: AdminStatusBadgeProps) {
  const { isAr, tx } = useAdminT();
  const normalizedKey = (status || '').toUpperCase().trim();
  const effectiveVariant: AdminStatusVariant = variant || STATUS_VARIANT_MAP[normalizedKey] || 'neutral';
  
  let effectiveLabel: React.ReactNode = '—';
  if (label) {
    effectiveLabel = typeof label === 'string' ? tx(label) : label;
  } else if (normalizedKey) {
    effectiveLabel = isAr ? (STATUS_LABEL_MAP_AR[normalizedKey] || status) : (STATUS_LABEL_MAP_EN[normalizedKey] || STATUS_LABEL_MAP_AR[normalizedKey] || status);
  }
  const FallbackIcon = DEFAULT_ICONS[effectiveVariant];

  const iconElement = dot ? (
    <span
      style={{
        display: 'inline-block',
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor',
        flexShrink: 0,
      }}
    />
  ) : React.isValidElement(CustomIcon)
    ? CustomIcon
    : CustomIcon
    ? React.createElement(CustomIcon as any, { size: 12, style: { flexShrink: 0 } })
    : FallbackIcon
    ? React.createElement(FallbackIcon, { size: 12, style: { flexShrink: 0 } })
    : null;

  return (
    <span className={`admin-badge admin-badge-${effectiveVariant} ${className}`}>
      {iconElement}
      <span>{effectiveLabel}</span>
    </span>
  );
}
