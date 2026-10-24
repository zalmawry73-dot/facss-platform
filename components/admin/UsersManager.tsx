'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Search, 
  Filter, 
  ShieldCheck, 
  Key, 
  Lock, 
  UserCheck, 
  UserX,
  UserPlus,
  Mail,
  Phone,
  Building,
  Sliders,
  Briefcase,
  ShieldAlert,
  AlertTriangle,
  GraduationCap,
  BookOpen,
  Settings,
  Package,
  Check,
  Layers
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminDataTable,
  AdminStatusBadge,
  AdminButton,
  AdminFilterBar,
  AdminSearchInput,
  AdminModal,
  AdminInput,
  AdminSelect,
  AdminCheckbox,
  AdminAlert,
  type ColumnDef,
} from '@/components/admin/ui';

export interface UserItem {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  organization?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  assignedCapabilities?: string[];
}

interface Props {
  initialUsers: UserItem[];
  currentUserRole: string;
  currentUserId: string;
}

import UserPermissionsModal, { 
  CAPABILITY_CATEGORIES, 
  ALL_CAPABILITY_DEFINITIONS as CAPABILITY_DEFINITIONS,
  getRoleInheritedCapabilities,
  type CapabilityCategoryItem,
  type CapabilityItem
} from './UserPermissionsModal';

export { CAPABILITY_CATEGORIES, CAPABILITY_DEFINITIONS, getRoleInheritedCapabilities, type CapabilityCategoryItem, type CapabilityItem };

const FUNCTIONAL_AREAS = [
  { id: 'PROGRAMS_OPERATIONS', get label() { return tx("دائرة البرامج والعمليات الميدانية"); } },
  { id: 'MONITORING_ANALYSIS', get label() { return tx("وحدة الرصد والتحليل الأمني"); } },
  { id: 'RESEARCH_FIELD_FOCAL', get label() { return tx("شبكة نقاط الاتصال الميداني والبحث"); } },
  { id: 'TRAINING_CAPACITY', get label() { return tx("قطاع التدريب وبناء القدرات"); } },
];

export default function UsersManager({ initialUsers, currentUserRole, currentUserId }: Props) {
  const { tx, txLocale } = useAdminT();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STAFF',
    functionalArea: 'PROGRAMS_OPERATIONS',
    phone: '',
    organization: '',
    capabilities: [] as string[],
  });

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Toggle user active status
  const handleToggleStatus = async (user: UserItem) => {
    if (user.id === currentUserId) {
      setFeedback({ type: 'error', message: tx("لا يمكن للمسؤول تعطيل حسابه الشخصي") });
      return;
    }

    setTogglingUserId(user.id);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("تعذر تحديث حالة الحساب"));

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u))
      );

      setFeedback({
        type: 'success',
        message: tx("تم {0} حساب [{1}] بنجاح", !user.isActive ? tx("تفعيل") : tx("تجميد"), user.fullName),
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTogglingUserId(null);
    }
  };

  // Submit new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingNewUser(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("تعذر إنشاء الحساب"));

      const createdUser: UserItem = data.user;
      setUsers((prev) => [createdUser, ...prev]);
      setShowCreateModal(false);
      setNewUserForm({
        fullName: '',
        email: '',
        password: '',
        role: 'STAFF',
        functionalArea: 'PROGRAMS_OPERATIONS',
        phone: '',
        organization: '',
        capabilities: [],
      });

      setFeedback({
        type: 'success',
        message: tx("تم إنشاء حساب [{0}] بنجاح", createdUser.fullName),
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization && u.organization.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns: ColumnDef<UserItem>[] = [
    {
      key: 'user',
      header: tx("المستخدم والحساب"),
      render: (u) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{u.fullName}</strong>
          <span
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-en)',
              direction: 'ltr',
              display: 'inline-block',
            }}
          >
            {u.email}
          </span>
          {u.phone && (
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-en)',
                direction: 'ltr',
                display: 'block',
              }}
            >
              {u.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'organization',
      header: tx("المؤسسة / المحافظة"),
      render: (u) => <span style={{ color: 'var(--text-secondary)' }}>{u.organization || '—'}</span>,
    },
    {
      key: 'role',
      header: tx("الدور والرتبة"),
      render: (u) => <AdminStatusBadge status={u.role} />,
    },
    {
      key: 'capabilities',
      header: tx("الصلاحيات الدقيقة"),
      render: (u) => {
        if (u.role === 'SUPER_ADMIN') {
          return <AdminStatusBadge status="ACTIVE" variant="warning" label={tx("صلاحيات مطلقة (SUPER_ADMIN)")} icon={ShieldCheck} />;
        }
        const inherited = getRoleInheritedCapabilities(u.role);
        const totalEffective = Array.from(new Set([...(u.assignedCapabilities || []), ...inherited])).length;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span
              style={{
                fontSize: '0.74rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                background: totalEffective > 0 ? 'var(--admin-status-info-bg)' : 'var(--surface-bg)',
                color: totalEffective > 0 ? 'var(--admin-status-info-text)' : 'var(--text-muted)',
                fontWeight: 700,
                border: totalEffective > 0 ? '1px solid var(--admin-status-info-border)' : '1px solid var(--admin-card-border)',
              }}
            >
              {totalEffective} {tx("صلاحية معتمدة")}
            </span>
            {isSuperAdmin && (
              <AdminButton
                variant="ghost"
                size="sm"
                icon={Sliders}
                onClick={() => setSelectedUser(u)}
              >
                {tx("تعديل")}
              </AdminButton>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: tx("الحالة"),
      render: (u) => (
        <AdminStatusBadge
          status={u.isActive ? 'ACTIVE' : 'INACTIVE'}
          variant={u.isActive ? 'success' : 'danger'}
          label={u.isActive ? tx("حساب نشط") : tx("حساب معطل")}
        />
      ),
    },
    {
      key: 'actions',
      header: tx("الإجراءات"),
      align: 'center',
      render: (u) => {
        if (!isSuperAdmin) return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
            <AdminButton
              variant={u.isActive ? 'danger' : 'secondary'}
              size="sm"
              icon={u.isActive ? UserX : UserCheck}
              loading={togglingUserId === u.id}
              disabled={u.id === currentUserId}
              onClick={() => handleToggleStatus(u)}
            >
              {u.isActive ? tx("تجميد") : tx("تفعيل")}
            </AdminButton>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={tx("إدارة المستخدمين والصلاحيات (Users & RBAC)")}
        description={tx("إدارة حسابات الكوادر التشغيلية، بوابات العملاء والمتدربين، وتعيين الصلاحيات الدقيقة وفق مبدأ الاستحقاق الأمني")}
        actions={
          isSuperAdmin ? (
            <AdminButton
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setShowCreateModal(true)}
            >
              {tx("إضافة كادر أو حساب جديد")}
            </AdminButton>
          ) : undefined
        }
      />

      {feedback && (
        <AdminAlert
          variant={feedback.type === 'success' ? 'success' : 'danger'}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.message}
        </AdminAlert>
      )}

      <AdminFilterBar
        hasActiveFilters={Boolean(search || roleFilter !== 'ALL' || statusFilter !== 'ALL')}
        onReset={() => {
          setSearch('');
          setRoleFilter('ALL');
          setStatusFilter('ALL');
        }}
      >
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder={tx("البحث بالاسم، البريد الإلكتروني، أو المؤسسة...")}
        />

        <div style={{ minWidth: '160px' }}>
          <select
            className="admin-select"
            style={{ height: 'var(--admin-control-height-md)', margin: 0 }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">{tx("جميع الأدوار")}</option>
            <option value="SUPER_ADMIN">{tx("إدارة عليا (SUPER_ADMIN)")}</option>
            <option value="ADMIN">{tx("مسؤول إداري (ADMIN)")}</option>
            <option value="STAFF">{tx("كادر تشغيلي (STAFF)")}</option>
            <option value="FIELD_FOCAL_POINT">{tx("نقطة اتصال ميدانية")}</option>
            <option value="SERVICE_MANAGER">{tx("مدير خدمات")}</option>
            <option value="TRAINING_MANAGER">{tx("مدير تدريب")}</option>
            <option value="RESEARCH_MANAGER">{tx("مدير أبحاث")}</option>
            <option value="CLIENT">{tx("عميل مؤسسي (CLIENT)")}</option>
            <option value="TRAINEE">{tx("متدرب (TRAINEE)")}</option>
          </select>
        </div>

        <div style={{ minWidth: '130px' }}>
          <select
            className="admin-select"
            style={{ height: 'var(--admin-control-height-md)', margin: 0 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">{tx("جميع الحالات")}</option>
            <option value="ACTIVE">{tx("حسابات نشطة")}</option>
            <option value="INACTIVE">{tx("حسابات معطلة")}</option>
          </select>
        </div>
      </AdminFilterBar>

      <AdminDataTable
        columns={columns}
        data={filtered}
        keyExtractor={(u) => u.id}
        emptyTitle={tx("لم يتم العثور على مستخدمين")}
        emptyDescription={tx("جرّب تعديل مصطلح البحث أو تفريغ الفلاتر الحالية.")}
        mobileCardRender={(u) => {
          const capCount = u.assignedCapabilities?.length || 0;
          return (
            <div className="admin-card-inner">
              <div className="admin-card-top">
                <div>
                  <strong className="admin-card-title">{u.fullName}</strong>
                  <span className="admin-card-sub" dir="ltr">{u.email}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                  <AdminStatusBadge status={u.role} />
                  <AdminStatusBadge status={u.isActive ? 'ACTIVE' : 'INACTIVE'} />
                </div>
              </div>

              <div className="admin-card-body">
                {u.organization && (
                  <div className="admin-card-row">
                    <span className="admin-card-label">{tx("المؤسسة:")}</span>
                    <span className="admin-card-value">{u.organization}</span>
                  </div>
                )}
                {u.phone && (
                  <div className="admin-card-row">
                    <span className="admin-card-label">{tx("الهاتف:")}</span>
                    <span className="admin-card-value" dir="ltr">{u.phone}</span>
                  </div>
                )}
                <div className="admin-card-row">
                  <span className="admin-card-label">{tx("الصلاحيات:")}</span>
                  {u.role === 'SUPER_ADMIN' ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-gold-600)', fontWeight: 700 }}>
                      {tx("صلاحيات مطلقة (SUPER_ADMIN)")}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.12rem 0.45rem',
                        borderRadius: '4px',
                        background: capCount > 0 ? 'var(--admin-status-info-bg)' : 'var(--surface-bg)',
                        color: capCount > 0 ? 'var(--admin-status-info-text)' : 'var(--text-muted)',
                        fontWeight: 700,
                        border: '1px solid var(--admin-card-border)',
                      }}
                    >
                      {capCount} {tx("صلاحية ممنوحة")}
                    </span>
                  )}
                </div>
              </div>

              <div className="admin-card-footer">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  icon={Sliders}
                  onClick={() => setSelectedUser(u)}
                >
                  {tx("إدارة الصلاحيات")}
                </AdminButton>
                {isSuperAdmin && u.id !== currentUserId && (
                  <AdminButton
                    variant={u.isActive ? 'danger' : 'outline'}
                    size="sm"
                    loading={togglingUserId === u.id}
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.isActive ? tx("تجميد الحساب") : tx("تفعيل الحساب")}
                  </AdminButton>
                )}
              </div>
            </div>
          );
        }}
      />

      {/* Redesigned User Permissions Modal */}
      {selectedUser && (
        <UserPermissionsModal
          isOpen={Boolean(selectedUser)}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSaved={(userId, updatedCapabilities) => {
            const updatedUser = { ...selectedUser, assignedCapabilities: updatedCapabilities };
            setSelectedUser(updatedUser);
            setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
            setFeedback({
              type: 'success',
              message: tx("تم تحديث وحفظ مصفوفة صلاحيات المستخدم [{0}] بنجاح.", selectedUser.fullName),
            });
          }}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
        />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <AdminModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={tx("إضافة كادر أو حساب مستخدم جديد")}
          description={tx("إسناد الدور ومجال العمل الميداني والصلاحيات الأولية المعتمدة")}
          maxWidth="640px"
        >
          <form onSubmit={handleCreateUser}>
            <AdminInput
              label={tx("الاسم الكامل")}
              required
              placeholder={tx("مثال: صالح محمد اليافعي")}
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <AdminInput
                label={tx("البريد الإلكتروني")}
                required
                type="email"
                isLtr
                placeholder="user@facss.org"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
              />

              <AdminInput
                label={tx("كلمة المرور المؤقتة")}
                required
                type="password"
                minLength={8}
                placeholder="********"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <AdminSelect
                label={tx("الرتبة / الدور")}
                required
                value={newUserForm.role}
                onChange={(e) => {
                  const newRole = e.target.value;
                  setNewUserForm({
                    ...newUserForm,
                    role: newRole,
                    capabilities: newRole === 'FIELD_FOCAL_POINT' ? ['submit_incident'] : newUserForm.capabilities,
                  });
                }}
              >
                <option value="STAFF">{tx("كادر تشغيلي (STAFF)")}</option>
                <option value="FIELD_FOCAL_POINT">{tx("نقطة اتصال ميدانية (FIELD_FOCAL_POINT)")}</option>
                <option value="ADMIN">{tx("مسؤول إداري (ADMIN)")}</option>
                <option value="SERVICE_MANAGER">{tx("مدير خدمات أمنية")}</option>
                <option value="TRAINING_MANAGER">{tx("مدير برامج تدريب")}</option>
                <option value="RESEARCH_MANAGER">{tx("مدير أبحاث ودراسات")}</option>
                <option value="EMPLOYEE">{tx("موظف إداري")}</option>
                <option value="CLIENT">{tx("عميل مؤسسي")}</option>
              </AdminSelect>

              <AdminSelect
                label={tx("مجال العمل التخصصي")}
                value={newUserForm.functionalArea}
                onChange={(e) => setNewUserForm({ ...newUserForm, functionalArea: e.target.value })}
              >
                {FUNCTIONAL_AREAS.map((fa) => (
                  <option key={fa.id} value={fa.id}>{fa.label}</option>
                ))}
              </AdminSelect>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <AdminInput
                label={tx("رقم الهاتف للتواصل")}
                isLtr
                placeholder="+967 77X XXX XXX"
                value={newUserForm.phone}
                onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
              />

              <AdminInput
                label={tx("الجهة / المحافظة")}
                placeholder={tx("مثال: عدن - خور مكسر")}
                value={newUserForm.organization}
                onChange={(e) => setNewUserForm({ ...newUserForm, organization: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <AdminButton variant="secondary" onClick={() => setShowCreateModal(false)}>
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton variant="primary" type="submit" loading={isSubmittingNewUser}>
                {tx("تأكيد وإنشاء الحساب")}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
