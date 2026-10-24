'use client';

import { tx, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Trash2,
  Tag,
  Shield,
  MapPin,
  ListFilter,
} from 'lucide-react';
import {
  AdminSection,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminAlert,
  AdminStatusBadge,
  AdminModal,
  AdminCheckbox,
} from '@/components/admin/ui';
import {
  DYNAMIC_KEYS,
  DynamicOptionItem,
  DynamicGovernorateItem,
  DEFAULT_INCIDENT_CATEGORIES,
  DEFAULT_SOURCE_TYPES,
  DEFAULT_RISK_CATEGORIES,
  DEFAULT_GOVERNORATES,
} from '@/lib/dynamic-field-options';

type TabKey = 'CATEGORIES' | 'SOURCES' | 'RISKS' | 'GOVERNORATES';

export default function DynamicFieldsManager() {
  const { tx } = useAdminT();
  const [activeTab, setActiveTab] = useState<TabKey>('CATEGORIES');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lists State
  const [incidentCategories, setIncidentCategories] = useState<DynamicOptionItem[]>(DEFAULT_INCIDENT_CATEGORIES);
  const [sourceTypes, setSourceTypes] = useState<DynamicOptionItem[]>(DEFAULT_SOURCE_TYPES);
  const [riskCategories, setRiskCategories] = useState<DynamicOptionItem[]>(DEFAULT_RISK_CATEGORIES);
  const [governorates, setGovernorates] = useState<DynamicGovernorateItem[]>(DEFAULT_GOVERNORATES);

  // New Item Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    id: '',
    labelAr: '',
    labelEn: '',
    descriptionAr: '',
    descriptionEn: '',
    isActive: true,
  });

  const fetchOptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/field-options');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.incidentCategories)) setIncidentCategories(data.incidentCategories);
        if (Array.isArray(data.sourceTypes)) setSourceTypes(data.sourceTypes);
        if (Array.isArray(data.riskCategories)) setRiskCategories(data.riskCategories);
        if (Array.isArray(data.governorates)) setGovernorates(data.governorates);
      }
    } catch (err: any) {
      console.error('Error fetching admin field options:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOptions();
  }, []);

  // Save changes to API
  const handleSaveTab = async (tab: TabKey) => {
    setIsSaving(true);
    setFeedback(null);
    let key = '';
    let items: any[] = [];

    if (tab === 'CATEGORIES') {
      key = DYNAMIC_KEYS.INCIDENT_CATEGORIES;
      items = incidentCategories;
    } else if (tab === 'SOURCES') {
      key = DYNAMIC_KEYS.SOURCE_TYPES;
      items = sourceTypes;
    } else if (tab === 'RISKS') {
      key = DYNAMIC_KEYS.RISK_CATEGORIES;
      items = riskCategories;
    } else if (tab === 'GOVERNORATES') {
      key = DYNAMIC_KEYS.GOVERNORATES;
      items = governorates;
    }

    try {
      const res = await fetch('/api/admin/field-options', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل حفظ التعديلات"));

      setFeedback({ type: 'success', message: tx("تم حفظ وتحديث خيارات الحقل التشغيلي بنجاح في قاعدة البيانات.") });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset Tab to Defaults
  const handleResetDefaults = async (tab: TabKey) => {
    if (!window.confirm(tx("هل أنت متأكد من إعادة ضبط هذا الحقل إلى القيم المرجعية الافتراضية؟"))) return;
    setIsSaving(true);
    setFeedback(null);
    let key = '';

    if (tab === 'CATEGORIES') key = DYNAMIC_KEYS.INCIDENT_CATEGORIES;
    else if (tab === 'SOURCES') key = DYNAMIC_KEYS.SOURCE_TYPES;
    else if (tab === 'RISKS') key = DYNAMIC_KEYS.RISK_CATEGORIES;
    else if (tab === 'GOVERNORATES') key = DYNAMIC_KEYS.GOVERNORATES;

    try {
      const res = await fetch('/api/admin/field-options', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, resetToDefault: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx("فشل إعادة الضبط"));

      setFeedback({ type: 'success', message: tx("تمت إعادة الضبط للقيم الافتراضية بنجاح.") });
      fetchOptions();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  // Item modifications
  const toggleActive = (listType: TabKey, index: number) => {
    if (listType === 'CATEGORIES') {
      const updated = [...incidentCategories];
      updated[index].isActive = !updated[index].isActive;
      setIncidentCategories(updated);
    } else if (listType === 'SOURCES') {
      const updated = [...sourceTypes];
      updated[index].isActive = !updated[index].isActive;
      setSourceTypes(updated);
    } else if (listType === 'RISKS') {
      const updated = [...riskCategories];
      updated[index].isActive = !updated[index].isActive;
      setRiskCategories(updated);
    } else if (listType === 'GOVERNORATES') {
      const updated = [...governorates];
      updated[index].isActive = !updated[index].isActive;
      setGovernorates(updated);
    }
  };

  const moveItem = (listType: TabKey, index: number, direction: 'UP' | 'DOWN') => {
    const swap = (arr: any[]) => {
      const target = direction === 'UP' ? index - 1 : index + 1;
      if (target < 0 || target >= arr.length) return arr;
      const copy = [...arr];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    };

    if (listType === 'CATEGORIES') setIncidentCategories(swap(incidentCategories));
    else if (listType === 'SOURCES') setSourceTypes(swap(sourceTypes));
    else if (listType === 'RISKS') setRiskCategories(swap(riskCategories));
    else if (listType === 'GOVERNORATES') setGovernorates(swap(governorates));
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.labelAr.trim()) return;

    const id = newItem.id.trim()
      ? newItem.id.trim().toUpperCase().replace(/\s+/g, '_')
      : `CUSTOM_${Date.now()}`;

    if (activeTab === 'CATEGORIES') {
      const item: DynamicOptionItem = {
        id,
        labelAr: newItem.labelAr.trim(),
        labelEn: newItem.labelEn.trim() || newItem.labelAr.trim(),
        descriptionAr: newItem.descriptionAr.trim(),
        descriptionEn: newItem.descriptionEn.trim(),
        isActive: true,
        order: incidentCategories.length + 1,
      };
      setIncidentCategories([...incidentCategories, item]);
    } else if (activeTab === 'SOURCES') {
      const item: DynamicOptionItem = {
        id,
        labelAr: newItem.labelAr.trim(),
        labelEn: newItem.labelEn.trim() || newItem.labelAr.trim(),
        isActive: true,
        order: sourceTypes.length + 1,
      };
      setSourceTypes([...sourceTypes, item]);
    } else if (activeTab === 'RISKS') {
      const item: DynamicOptionItem = {
        id,
        labelAr: newItem.labelAr.trim(),
        labelEn: newItem.labelEn.trim() || newItem.labelAr.trim(),
        isActive: true,
        order: riskCategories.length + 1,
      };
      setRiskCategories([...riskCategories, item]);
    } else if (activeTab === 'GOVERNORATES') {
      const item: DynamicGovernorateItem = {
        id: id.toLowerCase(),
        ar: newItem.labelAr.trim(),
        en: newItem.labelEn.trim() || newItem.labelAr.trim(),
        isActive: true,
        order: governorates.length + 1,
      };
      setGovernorates([...governorates, item]);
    }

    setIsAddModalOpen(false);
    setNewItem({ id: '', labelAr: '', labelEn: '', descriptionAr: '', descriptionEn: '', isActive: true });
    setFeedback({ type: 'success', message: tx("تمت إضافة الخيار إلى القائمة. اضغط على حفظ لاعتماد التغييرات في النظام.") });
  };

  return (
    <AdminSection
      title={tx("إدارة الحقول والتصنيفات الميدانية الديناميكية (Dynamic Operational Fields)")}
      description={tx("إدارة وتعديل تصنيفات البلاغات ومصادرها ومخاطرها والمحافظات بقاعدة البيانات مباشرة دون المساس بالكود المصدري")}
    >
      {/* Feedback Alert */}
      {feedback && (
        <div style={{ marginBottom: '1rem' }}>
          <AdminAlert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Tabs Bar */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--admin-border-subtle)',
          paddingBottom: '0.75rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('CATEGORIES')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeTab === 'CATEGORIES' ? 'var(--admin-primary)' : 'var(--admin-bg-surface-subtle)',
            color: activeTab === 'CATEGORIES' ? '#ffffff' : 'var(--admin-text-secondary)',
          }}
        >
          <Tag size={14} />
          <span>{tx("تصنيفات البلاغات ({0})", incidentCategories.length)}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SOURCES')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeTab === 'SOURCES' ? 'var(--admin-primary)' : 'var(--admin-bg-surface-subtle)',
            color: activeTab === 'SOURCES' ? '#ffffff' : 'var(--admin-text-secondary)',
          }}
        >
          <Shield size={14} />
          <span>{tx("أنواع مصادر البلاغات ({0})", sourceTypes.length)}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RISKS')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeTab === 'RISKS' ? 'var(--admin-primary)' : 'var(--admin-bg-surface-subtle)',
            color: activeTab === 'RISKS' ? '#ffffff' : 'var(--admin-text-secondary)',
          }}
        >
          <Layers size={14} />
          <span>{tx("تصنيفات المخاطر التشغيلية ({0})", riskCategories.length)}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('GOVERNORATES')}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: activeTab === 'GOVERNORATES' ? 'var(--admin-primary)' : 'var(--admin-bg-surface-subtle)',
            color: activeTab === 'GOVERNORATES' ? '#ffffff' : 'var(--admin-text-secondary)',
          }}
        >
          <MapPin size={14} />
          <span>{tx("المحافظات والنطاقات ({0})", governorates.length)}</span>
        </button>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <AdminButton
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            {tx("إضافة تصنيف جديد")}
          </AdminButton>
          <AdminButton
            variant="ghost"
            size="sm"
            icon={<RotateCcw size={14} />}
            disabled={isSaving}
            onClick={() => handleResetDefaults(activeTab)}
          >
            {tx("استعادة الافتراضيات")}
          </AdminButton>
        </div>

        <AdminButton
          variant="primary"
          size="sm"
          icon={<Save size={14} />}
          loading={isSaving}
          disabled={isSaving}
          onClick={() => handleSaveTab(activeTab)}
        >
          {isSaving ? tx("جاري الحفظ...") : tx("حفظ خيارات القائمة")}
        </AdminButton>
      </div>

      {/* Dynamic List Items Table / Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {activeTab === 'CATEGORIES' &&
          incidentCategories.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: item.isActive ? 'var(--admin-bg-surface-subtle)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${item.isActive ? 'var(--admin-border-subtle)' : 'rgba(239, 68, 68, 0.2)'}`,
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--admin-primary)',
                    background: 'var(--admin-primary-subtle)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {item.id}
                </span>
                <div>
                  <input
                    type="text"
                    value={item.labelAr}
                    onChange={(e) => {
                      const updated = [...incidentCategories];
                      updated[index].labelAr = e.target.value;
                      setIncidentCategories(updated);
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid transparent',
                      color: 'var(--admin-text-primary)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      width: '100%',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--admin-primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                  />
                  {item.descriptionAr && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', display: 'block' }}>
                      {item.descriptionAr}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AdminStatusBadge
                  status={item.isActive ? tx("مفعل في النموذج") : tx("معطل (محجوب)")}
                  variant={item.isActive ? 'success' : 'neutral'}
                  dot
                />
                <button
                  type="button"
                  title={item.isActive ? tx("تعطيل وحجب من النموذج") : tx("تفعيل وإظهار")}
                  onClick={() => toggleActive('CATEGORIES', index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: item.isActive ? 'var(--admin-success)' : 'var(--admin-text-muted)',
                    padding: '4px',
                  }}
                >
                  {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button
                  type="button"
                  title={tx("تحريك للأعلى")}
                  disabled={index === 0}
                  onClick={() => moveItem('CATEGORIES', index, 'UP')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: index === 0 ? 'not-allowed' : 'pointer',
                    color: index === 0 ? 'var(--admin-border-subtle)' : 'var(--admin-text-secondary)',
                    padding: '4px',
                  }}
                >
                  <MoveUp size={16} />
                </button>
                <button
                  type="button"
                  title={tx("تحريك للأسفل")}
                  disabled={index === incidentCategories.length - 1}
                  onClick={() => moveItem('CATEGORIES', index, 'DOWN')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: index === incidentCategories.length - 1 ? 'not-allowed' : 'pointer',
                    color: index === incidentCategories.length - 1 ? 'var(--admin-border-subtle)' : 'var(--admin-text-secondary)',
                    padding: '4px',
                  }}
                >
                  <MoveDown size={16} />
                </button>
              </div>
            </div>
          ))}

        {activeTab === 'SOURCES' &&
          sourceTypes.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: item.isActive ? 'var(--admin-bg-surface-subtle)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${item.isActive ? 'var(--admin-border-subtle)' : 'rgba(239, 68, 68, 0.2)'}`,
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--admin-primary)',
                    background: 'var(--admin-primary-subtle)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {item.id}
                </span>
                <input
                  type="text"
                  value={item.labelAr}
                  onChange={(e) => {
                    const updated = [...sourceTypes];
                    updated[index].labelAr = e.target.value;
                    setSourceTypes(updated);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--admin-text-primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    width: '100%',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--admin-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AdminStatusBadge
                  status={item.isActive ? tx("مفعل") : tx("معطل")}
                  variant={item.isActive ? 'success' : 'neutral'}
                  dot
                />
                <button
                  type="button"
                  onClick={() => toggleActive('SOURCES', index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: item.isActive ? 'var(--admin-success)' : 'var(--admin-text-muted)',
                    padding: '4px',
                  }}
                >
                  {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          ))}

        {activeTab === 'RISKS' &&
          riskCategories.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: item.isActive ? 'var(--admin-bg-surface-subtle)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${item.isActive ? 'var(--admin-border-subtle)' : 'rgba(239, 68, 68, 0.2)'}`,
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--admin-primary)',
                    background: 'var(--admin-primary-subtle)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {item.id}
                </span>
                <input
                  type="text"
                  value={item.labelAr}
                  onChange={(e) => {
                    const updated = [...riskCategories];
                    updated[index].labelAr = e.target.value;
                    setRiskCategories(updated);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--admin-text-primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    width: '100%',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--admin-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AdminStatusBadge
                  status={item.isActive ? tx("مفعل بالسجل") : tx("معطل")}
                  variant={item.isActive ? 'success' : 'neutral'}
                  dot
                />
                <button
                  type="button"
                  onClick={() => toggleActive('RISKS', index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: item.isActive ? 'var(--admin-success)' : 'var(--admin-text-muted)',
                    padding: '4px',
                  }}
                >
                  {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          ))}

        {activeTab === 'GOVERNORATES' &&
          governorates.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: item.isActive ? 'var(--admin-bg-surface-subtle)' : 'rgba(239, 68, 68, 0.05)',
                border: `1px solid ${item.isActive ? 'var(--admin-border-subtle)' : 'rgba(239, 68, 68, 0.2)'}`,
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--admin-primary)',
                    background: 'var(--admin-primary-subtle)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {item.id}
                </span>
                <input
                  type="text"
                  value={item.ar}
                  onChange={(e) => {
                    const updated = [...governorates];
                    updated[index].ar = e.target.value;
                    setGovernorates(updated);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--admin-text-primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    width: '100%',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--admin-primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'transparent')}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AdminStatusBadge
                  status={item.isActive ? tx("نشط") : tx("معطل")}
                  variant={item.isActive ? 'success' : 'neutral'}
                  dot
                />
                <button
                  type="button"
                  onClick={() => toggleActive('GOVERNORATES', index)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: item.isActive ? 'var(--admin-success)' : 'var(--admin-text-muted)',
                    padding: '4px',
                  }}
                >
                  {item.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>
          ))}
      </div>

      {/* Add New Option Modal */}
      <AdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={tx("إضافة عنصر تصنيف أو خيار تشغيلي جديد")}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <AdminButton variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>
              {tx("إلغاء")}
            </AdminButton>
            <AdminButton variant="primary" size="sm" onClick={handleAddNewItem}>
              {tx("إضافة إلى القائمة")}
            </AdminButton>
          </div>
        }
      >
        <form onSubmit={handleAddNewItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("الاسم بالعربية *")}
            </label>
            <AdminInput
              required
              placeholder={tx("مثال: اختراق سيبراني أو تسلل لمنشأة")}
              value={newItem.labelAr}
              onChange={(e) => setNewItem({ ...newItem, labelAr: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("الاسم بالإنجليزية (اختياري)")}
            </label>
            <AdminInput
              placeholder={tx("e.g., Cyber Intrusion or Perimeter Breach")}
              value={newItem.labelEn}
              onChange={(e) => setNewItem({ ...newItem, labelEn: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
              {tx("المعرّف الرمزي الفريد (CODE / ID) - اختياري")}
            </label>
            <AdminInput
              dir="ltr"
              placeholder={tx("e.g., CYBER_BREACH")}
              value={newItem.id}
              onChange={(e) => setNewItem({ ...newItem, id: e.target.value })}
              helperText={tx("إذا تُرِك فارغاً، سيتم توليد رمز فريد تلقائياً.")}
            />
          </div>

          {activeTab === 'CATEGORIES' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px' }}>
                {tx("الوصف الإرشادي لضابط الميدان")}
              </label>
              <AdminTextarea
                rows={2}
                placeholder={tx("وصف موجز لمساعدة الضابط في اختيار التصنيف المناسب")}
                value={newItem.descriptionAr}
                onChange={(e) => setNewItem({ ...newItem, descriptionAr: e.target.value })}
              />
            </div>
          )}
        </form>
      </AdminModal>
    </AdminSection>
  );
}
