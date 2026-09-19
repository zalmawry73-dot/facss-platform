import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { requireStaff, getUserCapabilities, CAPABILITIES, hasCapability } from '@/lib/rbac';
import { 
  Settings, 
  Mail, 
  Users, 
  History, 
  ShieldCheck, 
  ArrowLeft, 
  Activity,
  Lock
} from 'lucide-react';

export const revalidate = 0;

export default async function AdminSystemPage() {
  // Layer 3 Authorization: Staff/Admin session verification
  const session = await requireStaff('/admin/system');
  const userCaps = await getUserCapabilities(session.userId, session.role);

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
      title: 'رسائل واستفسارات التواصل',
      desc: 'متابعة استفسارات الجهات والمؤسسات الواردة عبر الموقع الرسمي والرد عليها.',
      href: '/admin/messages',
      icon: Mail,
      allowed: canMessages,
      capability: CAPABILITIES.MANAGE_MESSAGES,
      badge: unreadMessages > 0 ? `${unreadMessages} غير مقروءة` : 'محدث',
      badgeClass: unreadMessages > 0 ? 'badge-yellow' : 'badge-green',
      statLabel: 'غير مقروء',
      statValue: unreadMessages,
    },
    {
      title: 'إدارة المستخدمين والصلاحيات (RBAC)',
      desc: 'التحكم برتب الموظفين، وتفعيل وتجميد الحسابات، وتخصيص الصلاحيات الدقيقة.',
      href: '/admin/users',
      icon: Users,
      allowed: canUsers,
      capability: CAPABILITIES.MANAGE_USERS,
      badge: `${activeUsers} نشط`,
      badgeClass: 'badge-gold',
      statLabel: 'إجمالي الحسابات',
      statValue: totalUsers,
    },
    {
      title: 'إعدادات النظام والتواصل الرسمي',
      desc: 'مراجعة وتعديل بيانات الاتصال الرسمية، عناوين المركز، وأرقام الهواتف.',
      href: '/admin/settings',
      icon: Settings,
      allowed: canSettings,
      capability: CAPABILITIES.MANAGE_SETTINGS,
      badge: 'المرجع الرسمي',
      badgeClass: 'badge-gold',
      statLabel: 'الفئة',
      statValue: 'هوية واتصال',
    },
    {
      title: 'سجل التدقيق والنشاط الإداري',
      desc: 'رصد كافة العمليات الحساسة، التعديلات التشغيلية، ومحاولات الوصول الأمنية.',
      href: '/admin/logs',
      icon: History,
      allowed: canLogs,
      capability: CAPABILITIES.VIEW_AUDIT_LOGS,
      badge: 'مراقب أمنياً',
      badgeClass: 'badge-green',
      statLabel: 'إجمالي السجلات',
      statValue: totalLogs,
    },
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.4rem' }}>
          <Settings size={26} style={{ color: 'var(--color-gold)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
            مركز تشغيل وإدارة المنظومة (System Operations Hub)
          </h2>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          إدارة الاتصالات المؤسسية، الصلاحيات الأمنية، إعدادات المركز، وسجلات التدقيق الميداني
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {modules.map((m, idx) => {
          const MIcon = m.icon;
          return (
            <div
              key={idx}
              className="card"
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
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: m.allowed ? 'rgba(197, 155, 39, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: m.allowed ? 'var(--color-gold-light)' : 'var(--text-muted)',
                    }}
                  >
                    <MIcon size={22} />
                  </div>
                  {m.allowed ? (
                    <span className={`badge ${m.badgeClass}`}>{m.badge}</span>
                  ) : (
                    <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Lock size={11} />
                      <span>يتطلب تصريح</span>
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', marginBottom: '0.6rem' }}>
                  {m.title}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {m.desc}
                </p>
              </div>

              <div style={{ paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', display: 'block' }}>{m.statLabel}</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-gold-light)' }}>{m.statValue}</strong>
                </div>

                {m.allowed ? (
                  <Link href={m.href} className="btn btn-gold btn-sm">
                    <span>فتح القسم</span>
                    <ArrowLeft size={14} />
                  </Link>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                    غير مصرح (Least Privilege)
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

