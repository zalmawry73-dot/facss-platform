'use client';

import { tx, txLocale, useAdminT } from '@/lib/admin-i18n';
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatDate } from '@/lib/i18n';
import {
  Settings, Eye, EyeOff, Edit3, Save, X, Plus, Trash2,
  ChevronUp, ChevronDown, CheckCircle2, AlertCircle, Loader2,
  Shield, Compass, GraduationCap, Heart, BookOpen, Users2,
  Target, Lock, Scale, SearchCheck, BadgeCheck, Building,
  Layers, Activity, HeartHandshake, ShieldAlert, Info,
  ArrowUpDown, Link as LinkIcon
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminSection,
  AdminButton,
  AdminIconButton,
  AdminInput,
  AdminTextarea,
  AdminStatusBadge,
  AdminTabs,
  AdminAlert,
  AdminEmptyState,
} from '@/components/admin/ui';

// ────────────────────────────────────────────────────────
// Types & Icon Mapping
// ────────────────────────────────────────────────────────
interface ContentBlock {
  id: string;
  section: string;
  key: string;
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  icon: string | null;
  link: string | null;
  order: number;
  isVisible: boolean;
  updatedByName: string | null;
  updatedAt: string;
}

interface Props {
  initialBlocks: ContentBlock[];
  adminName: string;
}

type FeedbackType = { type: 'success' | 'error'; message: string } | null;

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Shield, Compass, GraduationCap, Heart, BookOpen, Users2,
  Target, Lock, Scale, SearchCheck, BadgeCheck, Building,
  Layers, Activity, HeartHandshake, ShieldAlert, Info,
  ArrowUpDown, Settings
};

function getRenderedIcon(name: string | null | undefined, defaultIcon: React.ComponentType<any> = Shield) {
  if (!name) return defaultIcon;
  return ICON_MAP[name] || defaultIcon;
}

// ────────────────────────────────────────────────────────
// Sections Config
// ────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'identity',        labelKey: 'sectionIdentity',        descKey: 'sectionIdentityDesc',        icon: Target },
  { id: 'principles',      labelKey: 'sectionPrinciples',      descKey: 'sectionPrinciplesDesc',      icon: Shield },
  { id: 'activity_fields', labelKey: 'sectionActivityFields', descKey: 'sectionActivityFieldsDesc', icon: Compass },
  { id: 'lifecycle',       labelKey: 'sectionLifecycle',       descKey: 'sectionLifecycleDesc',       icon: ArrowUpDown },
  { id: 'org_structure',   labelKey: 'sectionOrgStructure',   descKey: 'sectionOrgStructureDesc',   icon: Layers },
  { id: 'beneficiaries',   labelKey: 'sectionBeneficiaries',   descKey: 'sectionBeneficiariesDesc',   icon: Users2 },
  { id: 'homepage',        labelKey: 'sectionHomepage',        descKey: 'sectionHomepageDesc',        icon: Info },
] as const;

// Protected from deletion
const PROTECTED_KEYS = ['vision', 'mission', 'about_paragraph_1', 'about_paragraph_2', 'why_us'];

// ────────────────────────────────────────────────────────
// Inline Edit Form Component
// ────────────────────────────────────────────────────────
function BlockEditForm({
  block,
  onSave,
  onCancel,
  saving,
}: {
  block: ContentBlock;
  onSave: (id: string, data: Partial<ContentBlock>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    titleAr: block.titleAr || '',
    titleEn: block.titleEn || '',
    descriptionAr: block.descriptionAr || '',
    descriptionEn: block.descriptionEn || '',
    icon: block.icon || '',
    link: block.link || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    await onSave(block.id, form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        paddingTop: '1rem',
        marginTop: '0.75rem',
        borderTop: '1px solid var(--admin-card-border)',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.85rem' }}>
        <AdminInput
          label={t.fieldTitleAr}
          value={form.titleAr}
          onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
          placeholder={t.fieldTitleAr}
        />
        <AdminInput
          label={t.fieldTitleEn}
          value={form.titleEn}
          onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
          placeholder={t.fieldTitleEn}
          dir="ltr"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.85rem' }}>
        <AdminTextarea
          label={t.fieldDescAr}
          rows={3}
          value={form.descriptionAr}
          onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
          placeholder={t.fieldDescAr}
        />
        <AdminTextarea
          label={t.fieldDescEn}
          rows={3}
          value={form.descriptionEn}
          onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
          placeholder={t.fieldDescEn}
          dir="ltr"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '0.85rem' }}>
        <AdminInput
          label={t.fieldIcon}
          value={form.icon}
          onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
          placeholder={t.fieldIconPlaceholder}
          dir="ltr"
        />
        <AdminInput
          label={t.fieldLink}
          value={form.link}
          onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
          placeholder={t.fieldLinkPlaceholder}
          dir="ltr"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
        <AdminButton
          type="button"
          variant="secondary"
          size="sm"
          onClick={onCancel}
          disabled={saving}
        >
          {t.actionCancel}
        </AdminButton>
        <AdminButton
          type="submit"
          variant="primary"
          size="sm"
          disabled={saving}
          loading={saving}
          icon={<Save size={15} />}
        >
          <span>{saving ? t.actionSaving : t.actionSave}</span>
        </AdminButton>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────
// New Block Form Component
// ────────────────────────────────────────────────────────
function NewBlockForm({
  section,
  onAdd,
  onCancel,
  saving,
}: {
  section: string;
  onAdd: (data: Omit<ContentBlock, 'id' | 'updatedByName' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    key: '',
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    icon: '',
    link: '',
    order: 99,
    isVisible: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    await onAdd({ section, ...form });
  };

  return (
    <div
      style={{
        background: 'var(--admin-canvas-bg)',
        border: '1px solid var(--admin-gold-primary)',
        borderRadius: 'var(--admin-radius-md)',
        padding: '1.4rem',
        marginBottom: '1.25rem',
      }}
    >
      <h3 style={{ margin: '0 0 1rem', color: 'var(--admin-text-primary)', fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Plus size={18} style={{ color: 'var(--admin-gold-hover)' }} />
        <span>{t.actionAddNewBlock}</span>
      </h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <AdminInput
          label={t.fieldKey}
          required
          dir="ltr"
          value={form.key}
          onChange={e => setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
          placeholder={t.fieldKeyPlaceholder}
          helperText={t.fieldKeyHelp}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.85rem' }}>
          <AdminInput
            label={t.fieldTitleAr}
            value={form.titleAr}
            onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
            placeholder={t.fieldTitleAr}
          />
          <AdminInput
            label={t.fieldTitleEn}
            value={form.titleEn}
            onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))}
            placeholder={t.fieldTitleEn}
            dir="ltr"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '0.85rem' }}>
          <AdminTextarea
            label={t.fieldDescAr}
            rows={2}
            value={form.descriptionAr}
            onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
            placeholder={t.fieldDescAr}
          />
          <AdminTextarea
            label={t.fieldDescEn}
            rows={2}
            value={form.descriptionEn}
            onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))}
            placeholder={t.fieldDescEn}
            dir="ltr"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.85rem' }}>
          <AdminInput
            label={t.fieldIcon}
            value={form.icon}
            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
            placeholder={t.fieldIconPlaceholder}
            dir="ltr"
          />
          <AdminInput
            label={t.fieldLink}
            value={form.link}
            onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            placeholder={t.fieldLinkPlaceholder}
            dir="ltr"
          />
          <AdminInput
            label={t.fieldOrder}
            type="number"
            value={String(form.order)}
            onChange={e => setForm(f => ({ ...f, order: parseInt(e.target.value) || 99 }))}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', flexWrap: 'wrap' }}>
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            {t.actionCancel}
          </AdminButton>
          <AdminButton
            type="submit"
            variant="primary"
            size="sm"
            disabled={saving}
            loading={saving}
            icon={<Plus size={15} />}
          >
            <span>{saving ? t.actionAdding : t.actionAdd}</span>
          </AdminButton>
        </div>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Single Block Card Component
// ────────────────────────────────────────────────────────
function BlockCard({
  block,
  isProtected,
  isFirst,
  isLast,
  isAnySaving,
  onEdit,
  onSave,
  onCancel,
  onToggleVisibility,
  onDelete,
  onMoveUp,
  onMoveDown,
  editingId,
  savingId,
}: {
  block: ContentBlock;
  isProtected: boolean;
  isFirst: boolean;
  isLast: boolean;
  isAnySaving: boolean;
  onEdit: (id: string) => void;
  onSave: (id: string, data: Partial<ContentBlock>) => Promise<void>;
  onCancel: () => void;
  onToggleVisibility: (id: string, current: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveUp: (id: string) => Promise<void>;
  onMoveDown: (id: string) => Promise<void>;
  editingId: string | null;
  savingId: string | null;
}) {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';
  const isEditing = editingId === block.id;
  const isSaving = savingId === block.id;
  const BlockIcon = getRenderedIcon(block.icon, Shield);

  const primaryTitle = isAr ? (block.titleAr || block.titleEn) : (block.titleEn || block.titleAr);
  const secondaryTitle = isAr ? block.titleEn : block.titleAr;
  const primaryDesc = isAr ? (block.descriptionAr || block.descriptionEn) : (block.descriptionEn || block.descriptionAr);

  return (
    <div
      style={{
        border: `1px solid ${block.isVisible ? 'var(--admin-card-border)' : 'var(--admin-border-subtle, #e2e8f0)'}`,
        borderRadius: 'var(--admin-radius-md)',
        padding: '1.2rem',
        background: block.isVisible ? 'var(--admin-card-bg)' : 'var(--admin-canvas-bg)',
        opacity: block.isVisible ? 1 : 0.72,
        marginBottom: '0.85rem',
        boxShadow: block.isVisible ? 'var(--admin-card-shadow)' : 'none',
        transition: 'var(--admin-transition-fast)',
      }}
    >
      {/* Top Row: Icon + Titles + Status Badges */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.85rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--admin-radius-sm)',
              background: 'rgba(201,162,39,0.12)',
              color: 'var(--admin-gold-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BlockIcon size={20} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--admin-text-primary)', margin: 0, lineHeight: 1.4 }}>
              {primaryTitle || <span style={{ color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>({t.adminContentItemsCount})</span>}
            </h4>
            {secondaryTitle && (
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.84rem', color: 'var(--admin-text-muted)', fontWeight: 500 }}>
                {secondaryTitle}
              </p>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0, flexWrap: 'wrap' }}>
          <AdminStatusBadge
            variant={block.isVisible ? 'success' : 'warning'}
            label={block.isVisible ? t.badgeVisible : t.badgeHidden}
            icon={block.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
          />

          {isProtected && (
            <AdminStatusBadge
              variant="info"
              label={t.badgeProtected}
              icon={<Lock size={12} />}
            />
          )}
        </div>
      </div>

      {/* Middle Row: Description */}
      {primaryDesc && (
        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--admin-text-secondary)',
            margin: '0.75rem 0 0.5rem',
            lineHeight: 1.65,
          }}
        >
          {primaryDesc}
        </p>
      )}

      {/* Optional Link Chip */}
      {block.link && (
        <div style={{ marginTop: '0.35rem' }}>
          <span
            dir="ltr"
            style={{
              fontSize: '0.76rem',
              fontWeight: 600,
              color: 'var(--admin-navy-primary)',
              background: 'rgba(15, 23, 42, 0.05)',
              border: '1px solid var(--admin-card-border)',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
          >
            <LinkIcon size={11} />
            <span>{block.link}</span>
          </span>
        </div>
      )}

      {/* Bottom Metadata & Action Buttons Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginTop: '0.9rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--admin-card-border)',
          flexWrap: 'wrap',
        }}
      >
        {/* Left Metadata: Technical Key & Last Modified */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <code
            dir="ltr"
            title={`${t.badgeTechnicalKey}: ${block.key}`}
            style={{
              fontSize: '0.74rem',
              fontFamily: 'monospace',
              color: 'var(--admin-text-muted)',
              background: 'var(--admin-canvas-bg)',
              border: '1px solid var(--admin-card-border)',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
            }}
          >
            key: {block.key}
          </code>
          <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>
            #{block.order}
          </span>
          {block.updatedByName && (
            <span style={{ fontSize: '0.74rem', color: 'var(--admin-text-muted)' }}>
              • {t.badgeLastModified}: {block.updatedByName} ({formatDate(block.updatedAt, locale)})
            </span>
          )}
        </div>

        {/* Right Actions: Accessible Icon Buttons with Tooltips */}
        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
          <AdminIconButton
            icon={<ChevronUp size={15} />}
            tooltip={t.actionMoveUp}
            disabled={isFirst || isSaving || isAnySaving}
            onClick={() => onMoveUp(block.id)}
          />

          <AdminIconButton
            icon={<ChevronDown size={15} />}
            tooltip={t.actionMoveDown}
            disabled={isLast || isSaving || isAnySaving}
            onClick={() => onMoveDown(block.id)}
          />

          <AdminIconButton
            icon={isSaving ? <Loader2 size={15} className="spin" /> : block.isVisible ? <Eye size={15} /> : <EyeOff size={15} />}
            tooltip={block.isVisible ? t.actionHide : t.actionShow}
            disabled={isSaving || isAnySaving}
            onClick={() => onToggleVisibility(block.id, block.isVisible)}
          />

          <AdminIconButton
            icon={<Edit3 size={15} />}
            tooltip={t.actionEdit}
            disabled={isSaving || isAnySaving}
            onClick={() => onEdit(block.id)}
          />

          {!isProtected && (
            <AdminIconButton
              icon={<Trash2 size={15} />}
              tooltip={t.actionDelete}
              variant="danger"
              disabled={isSaving || isAnySaving}
              onClick={() => onDelete(block.id)}
            />
          )}
        </div>
      </div>

      {/* Inline Edit Form Panel */}
      {isEditing && (
        <BlockEditForm
          block={block}
          onSave={onSave}
          onCancel={onCancel}
          saving={isSaving}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// Main ContentManager Component
// ────────────────────────────────────────────────────────
export default function ContentManager({ initialBlocks, adminName }: Props) {
  const { tx, txLocale } = useAdminT();
  const { t, locale, dir } = useLanguage();
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);
  const [activeSection, setActiveSection] = useState('identity');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType>(null);

  const sectionBlocks = blocks
    .filter(b => b.section === activeSection)
    .sort((a, b) => a.order - b.order);

  const isAnySaving = savingId !== null || savingNew;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // ─── Save edit ───
  const handleSave = useCallback(async (id: string, data: Partial<ContentBlock>) => {
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.msgErrorGeneric);
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...json.block } : b));
      setEditingId(null);
      showFeedback('success', t.msgSaveSuccess);
    } catch (err: any) {
      showFeedback('error', err.message || t.msgErrorGeneric);
    } finally {
      setSavingId(null);
    }
  }, [t]);

  // ─── Toggle visibility ───
  const handleToggleVisibility = useCallback(async (id: string, current: boolean) => {
    setSavingId(id);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isVisible: !current }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.msgErrorGeneric);
      setBlocks(prev => prev.map(b => b.id === id ? { ...b, isVisible: !current } : b));
      showFeedback('success', !current ? t.msgShowSuccess : t.msgHideSuccess);
    } catch (err: any) {
      showFeedback('error', err.message || t.msgErrorGeneric);
    } finally {
      setSavingId(null);
    }
  }, [t]);

  // ─── Delete ───
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm(t.msgDeleteConfirm)) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/content?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.msgErrorGeneric);
      setBlocks(prev => prev.filter(b => b.id !== id));
      showFeedback('success', t.msgDeleteSuccess);
    } catch (err: any) {
      showFeedback('error', err.message || t.msgErrorGeneric);
    } finally {
      setSavingId(null);
    }
  }, [t]);

  // ─── Move Up / Down (reorder) ───
  const handleMove = useCallback(async (id: string, direction: 'up' | 'down') => {
    const sectionList = blocks
      .filter(b => b.section === activeSection)
      .sort((a, b) => a.order - b.order);

    const idx = sectionList.findIndex(b => b.id === id);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sectionList.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const current = sectionList[idx];
    const swap = sectionList[swapIdx];

    const newOrderCurrent = swap.order;
    const newOrderSwap = current.order;

    setSavingId(id);
    try {
      await Promise.all([
        fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: current.id, order: newOrderCurrent }) }),
        fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: swap.id, order: newOrderSwap }) }),
      ]);
      setBlocks(prev => prev.map(b => {
        if (b.id === current.id) return { ...b, order: newOrderCurrent };
        if (b.id === swap.id) return { ...b, order: newOrderSwap };
        return b;
      }));
    } catch {
      showFeedback('error', t.msgReorderError);
    } finally {
      setSavingId(null);
    }
  }, [blocks, activeSection, t]);

  // ─── Add new ───
  const handleAddNew = useCallback(async (data: Omit<ContentBlock, 'id' | 'updatedByName' | 'updatedAt'>) => {
    setSavingNew(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t.msgErrorGeneric);
      setBlocks(prev => [...prev, json.block]);
      setShowNewForm(false);
      showFeedback('success', t.msgAddSuccess);
    } catch (err: any) {
      showFeedback('error', err.message || t.msgErrorGeneric);
    } finally {
      setSavingNew(false);
    }
  }, [t]);

  const sectionInfo = SECTIONS.find(s => s.id === activeSection)!;
  const SectionIcon = sectionInfo?.icon || Settings;

  const tabItems = SECTIONS.map(sec => ({
    id: sec.id,
    label: t[sec.labelKey],
    icon: sec.icon,
    count: blocks.filter(b => b.section === sec.id).length,
  }));

  return (
    <div dir={dir}>
      {/* Feedback Notification */}
      {feedback && (
        <div style={{ marginBottom: '1.25rem' }}>
          <AdminAlert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      {/* Page Header */}
      <AdminPageHeader
        title={t.adminContentTitle}
        description={`${t.adminContentSubtitle} — ${t.adminContentOperator}: ${adminName}`}
      />

      {/* Section Tabs */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminTabs
          tabs={tabItems}
          activeTab={activeSection}
          onChange={(secId) => {
            setActiveSection(secId);
            setEditingId(null);
            setShowNewForm(false);
          }}
        />
      </div>

      {/* Section Content Area */}
      <AdminSection
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <SectionIcon size={20} style={{ color: 'var(--admin-gold-primary)' }} />
            <span>{t[sectionInfo.labelKey]}</span>
          </div>
        }
        description={`${t[sectionInfo.descKey]} — ${sectionBlocks.length} ${t.adminContentItemsCount}`}
        actions={
          <AdminButton
            variant={showNewForm ? 'secondary' : 'primary'}
            size="sm"
            icon={showNewForm ? <X size={15} /> : <Plus size={15} />}
            disabled={isAnySaving}
            onClick={() => {
              setShowNewForm(v => !v);
              setEditingId(null);
            }}
          >
            {showNewForm ? t.actionCancel : t.actionAdd}
          </AdminButton>
        }
      >
        {/* New Block Form */}
        {showNewForm && (
          <NewBlockForm
            section={activeSection}
            onAdd={handleAddNew}
            onCancel={() => setShowNewForm(false)}
            saving={savingNew}
          />
        )}

        {/* Blocks List */}
        {sectionBlocks.length === 0 ? (
          <AdminEmptyState
            title={t.adminContentNoItems}
            description={tx("لا توجد عناصر مضافة في هذا القسم حالياً.")}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sectionBlocks.map((block, idx) => (
              <BlockCard
                key={block.id}
                block={block}
                isProtected={block.section === 'identity' && PROTECTED_KEYS.includes(block.key)}
                isFirst={idx === 0}
                isLast={idx === sectionBlocks.length - 1}
                isAnySaving={isAnySaving}
                onEdit={id => setEditingId(editingId === id ? null : id)}
                onSave={handleSave}
                onCancel={() => setEditingId(null)}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDelete}
                onMoveUp={id => handleMove(id, 'up')}
                onMoveDown={id => handleMove(id, 'down')}
                editingId={editingId}
                savingId={savingId}
              />
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
