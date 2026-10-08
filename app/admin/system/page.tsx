import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { requireStaff, getUserCapabilities, CAPABILITIES } from '@/lib/rbac';
import { 
  Settings, 
  Mail, 
  Users, 
  History, 
  ArrowLeft, 
  ArrowRight,
  Lock,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
  AdminStatusBadge,
} from '@/components/admin/ui';

export const revalidate = 0;

export default async function AdminSystemPage() {
  // Layer 3 Authorization: Staff/Admin session verification
  const session = await requireStaff('/admin/system');
  const userCaps = await getUserCapabilities(session.userId, session.role);

  const cookieStore = cookies();
  const rawLocale = cookieStore.get('facss_locale')?.value;
  const locale = rawLocale === 'en' ? 'en' : 'ar';
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const canMessages = userCaps.includes(CAPABILITIES.MANAGE_MESSAGES) || session.role === 'SUPER_ADMIN';
  const canUsers = userCaps.includes(CAPABILITIES.MANAGE_USERS) || session.role === 'SUPER_ADMIN';
  const canSettings = userCaps.includes(CAPABILITIES.MANAGE_SETTINGS) || session.role === 'SUPER_ADMIN';
  const canLogs = userCaps.includes(CAPABILITIES.VIEW_AUDIT_LOGS) || session.role === 'SUPER_ADMIN';

  const [unreadMessages, totalUsers, activeUsers, totalLogs] = await Promise.all([
    prisma.contactMessage.count({ where: { status: 'UNREAD' } }),
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.activityLog.count(),
  ]);

  const modules = [
    {
      title: isAr ? 'رسائل واستفسارات التواصل' : 'Contact Messages & Inquiries',
      desc: isAr 
        ? 'متابعة استفسارات الجهات والمؤسسات الواردة عبر الموقع الرسمي والرد عليها.'
        : 'Follow up and reply to inquiries received from organizations and entities via the official website.',
      href: '/admin/messages',
      icon: Mail,
      allowed: canMessages,
      statusVariant: unreadMessages > 0 ? 'warning' : 'success',
      statusLabel: unreadMessages > 0 ? (isAr ? `${unreadMessages} غير مقروءة` : `${unreadMessages} unread`) : (isAr ? 'محدث' : 'Up to date'),
      statLabel: isAr ? 'غير مقروء' : 'Unread',
      statValue: unreadMessages,
    },
    {
      title: isAr ? 'إدارة المستخدمين والصلاحيات (RBAC)' : 'Users & Permissions Management (RBAC)',
      desc: isAr
        ? 'التحكم برتب الموظفين، وتفعيل وتجميد الحسابات، وتخصيص الصلاحيات الدقيقة.'
        : 'Control staff ranks, activate and freeze accounts, and assign granular permissions.',
      href: '/admin/users',
      icon: Users,
      allowed: canUsers,
      statusVariant: 'info' as const,
      statusLabel: isAr ? `${activeUsers} نشط` : `${activeUsers} Active`,
      statLabel: isAr ? 'إجمالي الحسابات' : 'Total Accounts',
      statValue: totalUsers,
    },
    {
      title: isAr ? 'إعدادات النظام والتواصل الرسمي' : 'System Settings & Official Contact',
      desc: isAr
        ? 'مراجعة وتعديل بيانات الاتصال الرسمية، عناوين المركز، وأرقام الهواتف.'
        : 'Review and update official contact details, center addresses, and phone numbers.',
      href: '/admin/settings',
      icon: Settings,
      allowed: canSettings,
      statusVariant: 'info' as const,
      statusLabel: isAr ? 'المرجع الرسمي' : 'Official Reference',
      statLabel: isAr ? 'الفئة' : 'Category',
      statValue: isAr ? 'هوية واتصال' : 'Identity & Contact',
    },
    {
      title: isAr ? 'سجل التدقيق والنشاط الإداري' : 'Administrative Audit & Activity Log',
      desc: isAr
        ? 'رصد كافة العمليات الحساسة، التعديلات التشغيلية، ومحاولات الوصول الأمنية.'
        : 'Monitor all sensitive operations, operational modifications, and security access attempts.',
      href: '/admin/logs',
      icon: History,
      allowed: canLogs,
      statusVariant: 'success' as const,
      statusLabel: isAr ? 'مراقب أمنياً' : 'Security Monitored',
      statLabel: isAr ? 'إجمالي السجلات' : 'Total Records',
      statValue: totalLogs,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={isAr ? "مركز تشغيل وإدارة المنظومة" : "System Operations & Administration Center"}
        description={isAr ? "إدارة الاتصالات المؤسسية، الصلاحيات الأمنية، إعدادات المركز، وسجلات التدقيق الميداني" : "Institutional communications management, security permissions, center settings, and field audit logs"}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '1.25rem' }}>
        {modules.map((m, idx) => {
          const MIcon = m.icon;
          return (
            <div
              key={idx}
              className="admin-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                opacity: m.allowed ? 1 : 0.75,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: 'var(--admin-radius-md)',
                      background: m.allowed ? 'rgba(201, 162, 39, 0.12)' : 'var(--admin-canvas-bg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: m.allowed ? 'var(--admin-gold-primary)' : 'var(--admin-text-muted)',
                      border: '1px solid var(--admin-card-border)',
                    }}
                  >
                    <MIcon size={22} />
                  </div>
                  {m.allowed ? (
                    <AdminStatusBadge variant={m.statusVariant as any} label={m.statusLabel} />
                  ) : (
                    <AdminStatusBadge
                      variant="warning"
                      label={isAr ? "يتطلب تصريح" : "Permission Required"}
                      icon={<Lock size={11} />}
                    />
                  )}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--admin-text-primary)', marginBottom: '0.5rem' }}>
                  {m.title}
                </h3>
                <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {m.desc}
                </p>
              </div>

              <div
                style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--admin-card-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block' }}>{m.statLabel}</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--admin-gold-hover)', fontWeight: 800 }}>{m.statValue}</strong>
                </div>

                {m.allowed ? (
                  <Link href={m.href} style={{ textDecoration: 'none' }}>
                    <AdminButton variant="primary" size="sm" icon={<ArrowIcon size={14} />}>
                      {isAr ? "فتح القسم" : "Open Section"}
                    </AdminButton>
                  </Link>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--admin-text-muted)' }}>
                    {isAr ? "غير مصرح (Least Privilege)" : "Unauthorized (Least Privilege)"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
