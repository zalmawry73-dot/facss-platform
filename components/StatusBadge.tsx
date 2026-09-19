import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  type?: keyof typeof ENTITY_STATUS_MAPS | string;
  label?: string;
  locale?: 'ar' | 'en';
  size?: 'sm' | 'md';
  className?: string;
}

export interface StatusConfig {
  variant: StatusVariant;
  labelAr: string;
  labelEn: string;
}

export const ENTITY_STATUS_MAPS: {
  serviceRequest: Record<string, StatusConfig>;
  trainingRegistration: Record<string, StatusConfig>;
  course: Record<string, StatusConfig>;
  certificate: Record<string, StatusConfig>;
  contactMessage: Record<string, StatusConfig>;
  user: Record<string, StatusConfig>;
} = {
  // Service Request Statuses
  serviceRequest: {
    NEW: { variant: 'info', labelAr: 'طلب جديد', labelEn: 'New Request' },
    UNDER_REVIEW: { variant: 'warning', labelAr: 'قيد المراجعة', labelEn: 'Under Review' },
    CONTACTED: { variant: 'info', labelAr: 'تم التواصل', labelEn: 'Contacted' },
    WAITING_FOR_CLIENT: { variant: 'warning', labelAr: 'بانتظار العميل', labelEn: 'Waiting for Client' },
    APPROVED: { variant: 'success', labelAr: 'معتمد', labelEn: 'Approved' },
    IN_PROGRESS: { variant: 'warning', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
    REPORT_READY: { variant: 'success', labelAr: 'التقرير جاهز', labelEn: 'Report Ready' },
    COMPLETED: { variant: 'success', labelAr: 'مكتمل بنجاح', labelEn: 'Completed' },
    CANCELLED: { variant: 'danger', labelAr: 'ملغي', labelEn: 'Cancelled' },
  } as Record<string, StatusConfig>,

  // Training Registration Statuses
  trainingRegistration: {
    PENDING: { variant: 'warning', labelAr: 'قيد الانتظار', labelEn: 'Pending Review' },
    REVIEWING: { variant: 'warning', labelAr: 'قيد المراجعة', labelEn: 'Reviewing' },
    ACCEPTED: { variant: 'success', labelAr: 'مقبول', labelEn: 'Accepted' },
    REJECTED: { variant: 'danger', labelAr: 'مرفوض', labelEn: 'Rejected' },
    WAITLIST: { variant: 'warning', labelAr: 'قائمة الانتظار', labelEn: 'Waitlisted' },
  } as Record<string, StatusConfig>,

  // Course Statuses
  course: {
    OPEN: { variant: 'success', labelAr: 'مفتوح للتسجيل', labelEn: 'Open for Registration' },
    CLOSED: { variant: 'neutral', labelAr: 'مغلق', labelEn: 'Closed' },
    DRAFT: { variant: 'neutral', labelAr: 'مسودة', labelEn: 'Draft' },
  } as Record<string, StatusConfig>,

  // Certificate Statuses
  certificate: {
    VALID: { variant: 'success', labelAr: 'شهادة صادرة وسارية', labelEn: 'Valid & Active' },
    REVOKED: { variant: 'danger', labelAr: 'شهادة ملغاة', labelEn: 'Revoked' },
  } as Record<string, StatusConfig>,

  // Contact Message Statuses
  contactMessage: {
    UNREAD: { variant: 'warning', labelAr: 'غير مقروءة', labelEn: 'Unread' },
    READ: { variant: 'neutral', labelAr: 'مقروءة', labelEn: 'Read' },
    REPLIED: { variant: 'success', labelAr: 'تم الرد', labelEn: 'Replied' },
    ARCHIVED: { variant: 'neutral', labelAr: 'مؤرشفة', labelEn: 'Archived' },
  } as Record<string, StatusConfig>,

  // User & General Statuses
  user: {
    ACTIVE: { variant: 'success', labelAr: 'نشط', labelEn: 'Active' },
    INACTIVE: { variant: 'danger', labelAr: 'معطل', labelEn: 'Inactive' },
  } as Record<string, StatusConfig>,
};

const STATUS_MAP: Record<string, StatusConfig> = {
  ...ENTITY_STATUS_MAPS.serviceRequest,
  ...ENTITY_STATUS_MAPS.trainingRegistration,
  ...ENTITY_STATUS_MAPS.course,
  ...ENTITY_STATUS_MAPS.certificate,
  ...ENTITY_STATUS_MAPS.contactMessage,
  ...ENTITY_STATUS_MAPS.user,
  PUBLISHED: { variant: 'success', labelAr: 'منشور', labelEn: 'Published' },
};

export default function StatusBadge({ status, type, label, locale, size = 'md', className = '' }: StatusBadgeProps) {
  let contextLocale: 'ar' | 'en' = 'ar';
  try {
    const lang = useLanguage();
    if (lang && lang.locale) contextLocale = lang.locale;
  } catch {
    contextLocale = 'ar';
  }

  const activeLocale = locale || contextLocale;
  const normalizedKey = (status || '').toUpperCase().trim();
  const entityMap = type ? (ENTITY_STATUS_MAPS as any)[type] : null;
  const config = (entityMap && entityMap[normalizedKey]) || STATUS_MAP[normalizedKey] || {
    variant: 'neutral' as StatusVariant,
    labelAr: status || 'غير محدد',
    labelEn: status || 'Unknown',
  };

  const displayLabel = label || (activeLocale === 'en' ? config.labelEn : config.labelAr);
  const sizeClass = size === 'sm' ? 'style-sm' : '';

  return (
    <span
      className={`badge badge-${config.variant} ${sizeClass} ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.7rem',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'currentColor',
          opacity: 0.85,
        }}
      />
      <span>{displayLabel}</span>
    </span>
  );
}
