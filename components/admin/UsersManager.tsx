'use client';

import React, { useState } from 'react';
import { Users, Shield, CheckCircle2, AlertCircle, X, Search, Filter, ShieldCheck, Key, Lock, UserCheck, UserX } from 'lucide-react';

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

const CAPABILITY_DEFINITIONS = [
  { id: 'manage_requests', label: 'إدارة طلبات الخدمات الأمنية', desc: 'استعراض وتحديث ومتابعة طلبات الحماية والاستشارات الأمنية' },
  { id: 'manage_training', label: 'إدارة برامج التدريب والتأهيل', desc: 'إنشاء الدورات التدريبية وتحديث المحاضرين ومتابعة المتدربين' },
  { id: 'manage_research', label: 'إدارة الدراسات والتقارير الاستراتيجية', desc: 'إعداد ونشر الأوراق البحثية والتقارير الأمنية الحصرية' },
  { id: 'manage_messages', label: 'إدارة رسائل التواصل والاستفسارات', desc: 'مراجعة رسائل نموذج الاتصال وتوثيق الردود والأرشفة' },
  { id: 'manage_settings', label: 'إدارة إعدادات وبيانات الاتصال الرسمية', desc: 'تحديث هواتف المركز، البريد الرسمي، وساعات الدوام' },
  { id: 'view_audit_logs', label: 'استعراض سجلات التدقيق والنشاط الأمني', desc: 'مراقبة كافة العمليات الحساسة وتتبع نشاط الإداريين' },
  { id: 'manage_users', label: 'إدارة المستخدمين وتعيين الصلاحيات', desc: 'تفعيل/تعطيل الحسابات ومنح الصلاحيات الدقيقة للكوادر' },
];

export default function UsersManager({ initialUsers, currentUserRole, currentUserId }: Props) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [updatingCap, setUpdatingCap] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSuperAdmin = currentUserRole === 'SUPER_ADMIN';

  // Toggle user active status
  const handleToggleStatus = async (user: UserItem) => {
    if (user.id === currentUserId) {
      setFeedback({ type: 'error', message: 'لا يمكن للمسؤول تعطيل حسابه الشخصي' });
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
      if (!res.ok) throw new Error(data.error || 'تعذر تحديث حالة الحساب');

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u))
      );

      setFeedback({
        type: 'success',
        message: `تم ${!user.isActive ? 'تفعيل' : 'تجميد'} حساب [${user.fullName}] بنجاح`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setTogglingUserId(null);
    }
  };

  // Assign or revoke capability
  const handleCapabilityToggle = async (userId: string, capability: string, currentlyAssigned: boolean) => {
    setUpdatingCap(capability);
    setFeedback(null);

    try {
      if (currentlyAssigned) {
        // Revoke
        const res = await fetch(`/api/admin/users/${userId}/capabilities?capability=${capability}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'تعذر سحب الصلاحية');

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u;
            const updated = (u.assignedCapabilities || []).filter((c) => c !== capability);
            return { ...u, assignedCapabilities: updated };
          })
        );

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser((prev) =>
            prev ? { ...prev, assignedCapabilities: (prev.assignedCapabilities || []).filter((c) => c !== capability) } : null
          );
        }

        setFeedback({ type: 'success', message: `تم سحب الصلاحية [${capability}] بنجاح` });
      } else {
        // Assign
        const res = await fetch(`/api/admin/users/${userId}/capabilities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ capability }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'تعذر منح الصلاحية');

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u;
            const updated = [...(u.assignedCapabilities || []), capability];
            return { ...u, assignedCapabilities: updated };
          })
        );

        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser((prev) =>
            prev ? { ...prev, assignedCapabilities: [...(prev.assignedCapabilities || []), capability] } : null
          );
        }

        setFeedback({ type: 'success', message: `تم منح الصلاحية [${capability}] بنجاح` });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setUpdatingCap(null);
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

  return (
    <div>
      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${feedback.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: '#FFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {feedback.type === 'success' ? <CheckCircle2 size={20} color="#22c55e" /> : <AlertCircle size={20} color="#ef4444" />}
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', marginBottom: '0.4rem' }}>
          إدارة المستخدمين والصلاحيات الدقيقة (RBAC & Granular Capabilities)
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          إدارة حسابات الكوادر التشغيلية، تفعيل أو تجميد الحسابات، وتعيين الصلاحيات الدقيقة وفق مبدأ الحد الأدنى من الامتيازات
        </span>

        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="بحث بالاسم أو البريد أو المؤسسة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--color-gold)" />
            <select
              className="form-control"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ minWidth: '150px' }}
            >
              <option value="ALL">جميع الأدوار</option>
              <option value="SUPER_ADMIN">إدارة عليا (SUPER_ADMIN)</option>
              <option value="ADMIN">مسؤول إداري (ADMIN)</option>
              <option value="STAFF">كادر تشغيلي (STAFF)</option>
              <option value="SERVICE_MANAGER">مدير خدمات</option>
              <option value="TRAINING_MANAGER">مدير تدريب</option>
              <option value="RESEARCH_MANAGER">مدير أبحاث</option>
              <option value="CLIENT">عميل مؤسسي (CLIENT)</option>
              <option value="TRAINEE">متدرب (TRAINEE)</option>
            </select>

            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: '130px' }}
            >
              <option value="ALL">جميع الحالات</option>
              <option value="ACTIVE">نشط فقط</option>
              <option value="INACTIVE">معطل فقط</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>لم يتم العثور على مستخدمين يطابقون خيارات البحث.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المستخدم</th>
                  <th>الجهة / المؤسسة</th>
                  <th>الدور (Role)</th>
                  <th>الصلاحيات الدقيقة (Capabilities)</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isStaffUser = ['STAFF', 'EMPLOYEE', 'SERVICE_MANAGER', 'TRAINING_MANAGER', 'RESEARCH_MANAGER', 'CONTENT_MANAGER'].includes(u.role);
                  return (
                    <tr key={u.id}>
                      <td>
                        <strong style={{ display: 'block', color: '#FFF' }}>{u.fullName}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{u.organization || '—'}</td>
                      <td>
                        <span
                          className={`badge ${
                            u.role === 'SUPER_ADMIN'
                              ? 'badge-red'
                              : u.role === 'ADMIN'
                              ? 'badge-gold'
                              : isStaffUser
                              ? 'badge-yellow'
                              : u.role === 'CLIENT'
                              ? 'badge-blue'
                              : 'badge-green'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.role === 'SUPER_ADMIN' ? (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-gold-light)', fontWeight: 600 }}>
                            كافة الصلاحيات (إدارة عليا)
                          </span>
                        ) : u.role === 'ADMIN' ? (
                          <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: 600 }}>
                            صلاحيات تشغيلية كاملة
                          </span>
                        ) : isStaffUser ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                              {(u.assignedCapabilities || []).length} صلاحيات مخصصة
                            </span>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => setSelectedUser(u)}
                            >
                              <Key size={12} />
                              <span>تخصيص</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
                            بوابة مستفيد (بدون صلاحيات إدارية)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                          {u.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {/* Activate / Deactivate button */}
                          <button
                            type="button"
                            className={`btn btn-sm ${u.isActive ? 'btn-outline' : 'btn-gold'}`}
                            disabled={togglingUserId === u.id || u.id === currentUserId || (u.role === 'SUPER_ADMIN' && !isSuperAdmin)}
                            onClick={() => handleToggleStatus(u)}
                            title={u.id === currentUserId ? 'لا يمكن تعطيل الحساب الشخصي' : u.isActive ? 'تجميد الحساب' : 'تفعيل الحساب'}
                            style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                          >
                            {u.isActive ? (
                              <>
                                <UserX size={13} />
                                <span>تعطيل</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} />
                                <span>تفعيل</span>
                              </>
                            )}
                          </button>
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

      {/* Capabilities Assignment Modal */}
      {selectedUser && (
        <div
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
            className="card"
            style={{
              maxWidth: '650px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid var(--color-gold)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', margin: 0 }}>
                  تخصيص الصلاحيات الدقيقة (Granular Capabilities)
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  للمستخدم: <strong style={{ color: 'var(--color-gold-light)' }}>{selectedUser.fullName}</strong> ({selectedUser.email})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              مبدأ الحد الأدنى من الامتيازات (Principle of Least Privilege): لا يملك الكادر التشغيلي أي صلاحيات افتراضية، ويتم تفعيل الصلاحيات المناسبة لمهامه الوظيفية فقط.
            </p>

            {/* Capabilities Checkboxes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {CAPABILITY_DEFINITIONS.map((cap) => {
                const isAssigned = (selectedUser.assignedCapabilities || []).includes(cap.id);
                const isRestrictedForAdmin = (cap.id === 'manage_users' || cap.id === 'manage_settings') && !isSuperAdmin;

                return (
                  <div
                    key={cap.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: isAssigned ? 'rgba(197, 155, 39, 0.1)' : 'rgba(5, 14, 9, 0.7)',
                      borderRadius: '8px',
                      border: `1px solid ${isAssigned ? 'rgba(197, 155, 39, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div style={{ flex: 1, paddingLeft: '1rem' }}>
                      <strong style={{ display: 'block', color: '#FFF', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
                        {cap.label}
                      </strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>
                        {cap.desc}
                      </span>
                      {isRestrictedForAdmin && (
                        <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: '0.2rem', display: 'block' }}>
                          * يتطلب صلاحيات الإدارة العليا (SUPER_ADMIN) لمنح هذا الامتياز
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      className={`btn btn-sm ${isAssigned ? 'btn-gold' : 'btn-outline'}`}
                      disabled={updatingCap === cap.id || isRestrictedForAdmin}
                      onClick={() => handleCapabilityToggle(selectedUser.id, cap.id, isAssigned)}
                      style={{ minWidth: '95px', fontSize: '0.8rem' }}
                    >
                      {updatingCap === cap.id ? (
                        'جاري التحديث...'
                      ) : isAssigned ? (
                        <>
                          <ShieldCheck size={14} />
                          <span>ممنوحة</span>
                        </>
                      ) : (
                        <span>منح الإذن</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedUser(null)}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
