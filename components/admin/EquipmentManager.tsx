'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  Layers,
  Truck,
  ShoppingCart,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Printer,
  Calendar,
  User,
  ShieldCheck,
  Wrench,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminButton,
  AdminTabs,
  AdminAlert,
  AdminModal,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  AdminCheckbox,
} from '@/components/admin/ui';

interface EquipmentManagerProps {
  initialCategories: any[];
  initialProducts: any[];
  initialSuppliers: any[];
  initialKpis?: any;
}

export default function EquipmentManager({
  initialCategories,
  initialProducts,
  initialSuppliers,
  initialKpis,
}: EquipmentManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'suppliers' | 'procurement' | 'inventory' | 'inspections' | 'deliveries'>('overview');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data states
  const [categories, setCategories] = useState<any[]>(initialCategories || []);
  const [products, setProducts] = useState<any[]>(initialProducts || []);
  const [suppliers, setSuppliers] = useState<any[]>(initialSuppliers || []);
  const [procurements, setProcurements] = useState<any[]>([]);
  const [inventorySummary, setInventorySummary] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>(initialKpis || null);

  // Search & Filter
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  const [productStockFilter, setProductStockFilter] = useState('');

  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    sku: '',
    nameAr: '',
    nameEn: '',
    categoryId: '',
    unit: 'piece',
    manufacturer: '',
    specifications: '',
    inspectionRequired: false,
    maintenanceRequired: false,
    expiryTrackingRequired: false,
    serialTrackingRequired: false,
    minimumStockLevel: 5,
  });

  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    nameAr: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [showPoModal, setShowPoModal] = useState(false);
  const [poForm, setPoForm] = useState({
    supplierId: '',
    notes: '',
    items: [{ productId: '', quantityOrdered: 1, unitPrice: 0 }],
  });

  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [receivingPo, setReceivingPo] = useState<any>(null);
  const [receivingForm, setReceivingForm] = useState({
    deliveryNoteNumber: '',
    notes: '',
    items: [] as any[],
  });

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    delta: 0,
    reason: '',
  });

  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionForm, setInspectionForm] = useState({
    productId: '',
    inspectionType: 'PERIODIC',
    result: 'PASS',
    checklistSummary: '',
    findings: '',
  });

  const [selectedHandover, setSelectedHandover] = useState<any>(null);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  // Load active tab data
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'overview' || tab === 'products') {
        const res = await fetch('/api/admin/equipment/products?includeInactive=true');
        const data = await res.json();
        if (data.success) setProducts(data.products);
      }
      if (tab === 'overview' || tab === 'inventory') {
        const [resInv, resMov] = await Promise.all([
          fetch('/api/admin/equipment/inventory'),
          fetch('/api/admin/equipment/inventory/movements?limit=30'),
        ]);
        const dataInv = await resInv.json();
        const dataMov = await resMov.json();
        if (dataInv.success) setInventorySummary(dataInv.summary);
        if (dataMov.success) setMovements(dataMov.movements);
      }
      if (tab === 'overview' || tab === 'procurement') {
        const res = await fetch('/api/admin/equipment/procurement');
        const data = await res.json();
        if (data.success) setProcurements(data.orders);
      }
      if (tab === 'overview' || tab === 'suppliers') {
        const res = await fetch('/api/admin/equipment/suppliers');
        const data = await res.json();
        if (data.success) setSuppliers(data.suppliers);
      }
      if (tab === 'overview' || tab === 'inspections') {
        const [resInsp, resMaint] = await Promise.all([
          fetch('/api/admin/equipment/inspections'),
          fetch('/api/admin/equipment/maintenance'),
        ]);
        const dataInsp = await resInsp.json();
        const dataMaint = await resMaint.json();
        if (dataInsp.success) setInspections(dataInsp.inspections);
        if (dataMaint.success) setMaintenances(dataMaint.maintenances);
      }
      if (tab === 'overview' || tab === 'deliveries') {
        const res = await fetch('/api/admin/equipment/deliveries');
        const data = await res.json();
        if (data.success) setDeliveries(data.deliveries);
      }
    } catch (err: any) {
      console.error('Error fetching equipment data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/admin/equipment/products/${editingProduct.id}`
        : '/api/admin/equipment/products';
      const method = editingProduct ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ في حفظ الصنف');

      setFeedback({ type: 'success', message: 'تم حفظ صنف المعدات بنجاح في السجل المركزي' });
      setShowProductModal(false);
      setEditingProduct(null);
      fetchTabData('products');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/equipment/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ في تسجيل المورد');

      setFeedback({ type: 'success', message: 'تم تسجيل المورد المعتمد بنجاح' });
      setShowSupplierModal(false);
      fetchTabData('suppliers');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/equipment/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ في إنشاء أمر الشراء');

      setFeedback({ type: 'success', message: 'تم إنشاء أمر الشراء والتوريد بنجاح (المخزون لم يتغير لحين الاستلام الفعلي)' });
      setShowPoModal(false);
      fetchTabData('procurement');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleOpenReceiving = (po: any) => {
    setReceivingPo(po);
    setReceivingForm({
      deliveryNoteNumber: '',
      notes: '',
      items: po.items.map((it: any) => ({
        productId: it.productId,
        productName: it.product.nameAr,
        quantityOrdered: it.quantityOrdered,
        quantityReceived: it.quantityOrdered - it.quantityReceived,
        quantityAccepted: it.quantityOrdered - it.quantityReceived,
        quantityRejected: 0,
        rejectionReason: '',
        batchNumber: '',
      })),
    });
    setShowReceivingModal(true);
  };

  const handleSaveReceiving = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/equipment/procurement/${receivingPo.id}/receiving`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receivingForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء استلام الشحنة');

      setFeedback({ type: 'success', message: data.message || 'تم استلام الشحنة وزيادة المخزون بالكميات المقبولة فقط' });
      setShowReceivingModal(false);
      fetchTabData('procurement');
      fetchTabData('inventory');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/equipment/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء تعديل المخزون');

      setFeedback({ type: 'success', message: 'تم توثيق التعديل المخزني والحركة بنجاح' });
      setShowAdjustModal(false);
      fetchTabData('inventory');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/equipment/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inspectionForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ في تسجيل الفحص الفني');

      setFeedback({ type: 'success', message: 'تم توثيق محضر الفحص الفني بنجاح' });
      setShowInspectionModal(false);
      fetchTabData('inspections');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleViewHandover = async (deliveryId: string) => {
    try {
      const res = await fetch(`/api/admin/equipment/deliveries/${deliveryId}/handover`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'تعذر جلب وثيقة التسليم');

      setSelectedHandover(data.handoverDocument);
      setShowHandoverModal(true);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      !productSearch ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.nameAr.includes(productSearch) ||
      p.nameEn.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = !productCategoryFilter || p.categoryId === productCategoryFilter;
    const matchStock =
      !productStockFilter ||
      (productStockFilter === 'LOW' && p.isLowStock) ||
      (productStockFilter === 'OUT' && p.isOutOfStock) ||
      (productStockFilter === 'AVAILABLE' && p.quantityAvailable > 0);
    return matchSearch && matchCat && matchStock;
  });

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      <AdminPageHeader
        title="منظومة تجهيزات السلامة والمشتريات والمخزون"
        description="الإدارة التشغيلية الشاملة لدورة حياة المعدات: التوريد، الفحص الفني، المخزون، الحجز، والتسليم الرسمي للعملاء"
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <AdminButton
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={() => fetchTabData(activeTab)}
            >
              تحديث البيانات
            </AdminButton>
            {activeTab === 'products' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    sku: `FACSS-EQ-${Math.floor(100 + Math.random() * 900)}`,
                    nameAr: '',
                    nameEn: '',
                    categoryId: categories[0]?.id || '',
                    unit: 'piece',
                    manufacturer: '',
                    specifications: '',
                    inspectionRequired: false,
                    maintenanceRequired: false,
                    expiryTrackingRequired: false,
                    serialTrackingRequired: false,
                    minimumStockLevel: 5,
                  });
                  setShowProductModal(true);
                }}
              >
                إضافة صنف جديد
              </AdminButton>
            )}
            {activeTab === 'suppliers' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowSupplierModal(true)}
              >
                تسجيل مورد معتمد
              </AdminButton>
            )}
            {activeTab === 'procurement' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowPoModal(true)}
              >
                إنشاء أمر شراء
              </AdminButton>
            )}
            {activeTab === 'inventory' && (
              <AdminButton
                variant="outline"
                size="sm"
                icon={<SlidersHorizontal size={14} />}
                onClick={() => setShowAdjustModal(true)}
              >
                تعديل يدوي للمخزون
              </AdminButton>
            )}
            {activeTab === 'inspections' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowInspectionModal(true)}
              >
                تسجيل فحص فني
              </AdminButton>
            )}
          </div>
        }
      />

      {feedback && (
        <div style={{ marginBottom: '1.25rem' }}>
          <AdminAlert
            variant={feedback.type === 'success' ? 'success' : 'danger'}
            onClose={() => setFeedback(null)}
          >
            {feedback.message}
          </AdminAlert>
        </div>
      )}

      {/* Tabs Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <AdminTabs
          tabs={[
            { id: 'overview', label: 'المؤشرات التشغيلية', icon: Layers },
            { id: 'products', label: 'دليل المعدات والأصناف', icon: Package, count: products.length },
            { id: 'suppliers', label: 'سجل الموردين', icon: Truck, count: suppliers.length },
            { id: 'procurement', label: 'أوامر الشراء والاستلام', icon: ShoppingCart, count: procurements.length },
            { id: 'inventory', label: 'المخزون وسجل الحركات', icon: SlidersHorizontal },
            { id: 'inspections', label: 'الفحص الفني والصيانة', icon: ShieldCheck, count: inspections.length },
            { id: 'deliveries', label: 'محاضر التسليم والتسليم', icon: ClipboardCheck, count: deliveries.length },
          ]}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      {/* ==============================================================
          TAB 1: OVERVIEW DASHBOARD (E21 & E22)
          ============================================================== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key KPI Stats Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <div className="card" style={{ padding: '1.25rem', borderRight: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>معدل جاهزية المعدات (KPI)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>
                {kpis?.equipment?.equipmentReadinessRate?.displayValue || '100%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                المعدات الجاهزة المطابقة للفحص والصلاحية
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderRight: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>إجمالي الأصناف النشطة</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
                {products.filter((p) => p.isActive).length} صنف
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                موزعة على {categories.length} تصنيفات معتمدة
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderRight: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>المخزون المتاح للطلب</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
                {products.reduce((s, p) => s + (p.quantityAvailable || 0), 0)} وحدة
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                (الفعلي: {products.reduce((s, p) => s + p.quantityOnHand, 0)} - المحجوز: {products.reduce((s, p) => s + p.quantityReserved, 0)})
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderRight: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>أصناف منخفضة / نفدت</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444' }}>
                {products.filter((p) => p.isLowStock || p.isOutOfStock).length} صنف
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                تتطلب إصدار أوامر شراء عاجلة
              </div>
            </div>
          </div>

          {/* Operational Progress Indicators */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={18} color="#3B82F6" />
                حالة التوريد والشراء
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>أوامر الشراء قيد التنفيذ:</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{procurements.filter((p) => p.status !== 'RECEIVED' && p.status !== 'CANCELLED').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>شحنات بانتظار الاستلام:</span>
                  <span style={{ fontWeight: 700, color: '#F59E0B' }}>{procurements.filter((p) => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>الموردون المعتمدون النشطون:</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>{suppliers.filter((s) => s.status === 'ACTIVE').length}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#10B981" />
                الفحص الفني والتسليم
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>عمليات الفحص المعتمدة (PASS):</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>{inspections.filter((i) => i.result === 'PASS').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>عمليات فحص رسبت (FAIL):</span>
                  <span style={{ fontWeight: 700, color: '#EF4444' }}>{inspections.filter((i) => i.result === 'FAIL').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>محاضر التسليم المكتملة للعملاء:</span>
                  <span style={{ fontWeight: 700, color: '#3B82F6' }}>{deliveries.filter((d) => d.status === 'DELIVERED').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 2: PRODUCTS CATALOG (E3 & E4)
          ============================================================== */}
      {activeTab === 'products' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 250px', position: 'relative' }}>
              <input
                type="text"
                placeholder="بحث برمز SKU أو اسم الصنف أو الصانع..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 2rem 0.5rem 0.75rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                }}
              />
              <Search size={16} style={{ position: 'absolute', right: '0.65rem', top: '0.65rem', color: '#6B7280' }} />
            </div>

            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
              }}
            >
              <option value="">جميع التصنيفات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameAr}</option>
              ))}
            </select>

            <select
              value={productStockFilter}
              onChange={(e) => setProductStockFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '6px',
                color: '#FFFFFF',
                fontSize: '0.85rem',
              }}
            >
              <option value="">جميع حالات المخزون</option>
              <option value="AVAILABLE">متوفر في المخزون</option>
              <option value="LOW">مخزون منخفض</option>
              <option value="OUT">نفد المخزون</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>رمز الصنف (SKU)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>اسم الصنف</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>التصنيف</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الرصيد الفعلي</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>المحجوز</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>المتاح</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>ضوابط التتبع</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الحالة</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      لا توجد أصناف مطابقة لمعايير البحث
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                        {p.sku}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{p.nameAr}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{p.nameEn}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {p.category?.nameAr}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {p.quantityOnHand} {p.unit}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#F59E0B' }}>
                        {p.quantityReserved}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            background: p.quantityAvailable === 0 ? 'rgba(239,68,68,0.2)' : p.isLowStock ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                            color: p.quantityAvailable === 0 ? '#EF4444' : p.isLowStock ? '#F59E0B' : '#10B981',
                          }}
                        >
                          {p.quantityAvailable} {p.unit}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {p.inspectionRequired && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: 'rgba(59,130,246,0.2)', color: '#3B82F6', borderRadius: '3px' }}>
                              فحص
                            </span>
                          )}
                          {p.serialTrackingRequired && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: 'rgba(139,92,246,0.2)', color: '#8B5CF6', borderRadius: '3px' }}>
                              تسلسلي
                            </span>
                          )}
                          {p.expiryTrackingRequired && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: 'rgba(236,72,153,0.2)', color: '#EC4899', borderRadius: '3px' }}>
                              صلاحية
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ color: p.isActive ? '#10B981' : '#6B7280', fontSize: '0.78rem' }}>
                          {p.isActive ? 'نشط' : 'موقف'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <AdminButton
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingProduct(p);
                            setProductForm({
                              sku: p.sku,
                              nameAr: p.nameAr,
                              nameEn: p.nameEn,
                              categoryId: p.categoryId,
                              unit: p.unit,
                              manufacturer: p.manufacturer || '',
                              specifications: p.specifications || '',
                              inspectionRequired: p.inspectionRequired,
                              maintenanceRequired: p.maintenanceRequired,
                              expiryTrackingRequired: p.expiryTrackingRequired,
                              serialTrackingRequired: p.serialTrackingRequired,
                              minimumStockLevel: p.minimumStockLevel,
                            });
                            setShowProductModal(true);
                          }}
                        >
                          تعديل
                        </AdminButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 3: SUPPLIERS REGISTRY (E5)
          ============================================================== */}
      {activeTab === 'suppliers' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>كود المورد</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>اسم المورد</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>مسؤول الاتصال</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>رقم الهاتف</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>أوامر الشراء</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      لم يتم تسجيل أي موردين بعد
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                        {s.supplierCode}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {s.contactPerson || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }} dir="ltr">
                        {s.phone}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF' }}>
                        {s.email || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#FFFFFF', fontWeight: 700 }}>
                        {s.procurementsCount || 0}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background: s.status === 'ACTIVE' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                            color: s.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                          }}
                        >
                          {s.status === 'ACTIVE' ? 'معتمد' : 'موقف'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 4: PROCUREMENT & RECEIVING (E6 & E7)
          ============================================================== */}
      {activeTab === 'procurement' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>رقم أمر الشراء</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>المورد</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>تاريخ الأمر</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الكمية المطلوبة</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الكمية المستلمة</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الحالة</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {procurements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      لا توجد أوامر شراء مسجلة
                    </td>
                  </tr>
                ) : (
                  procurements.map((po) => (
                    <tr key={po.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                        {po.referenceNumber}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#FFFFFF' }}>
                        {po.supplier?.name}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF' }}>
                        {new Date(po.orderDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {po.totalQuantityOrdered}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#10B981' }}>
                        {po.totalQuantityReceived}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            background:
                              po.status === 'RECEIVED'
                                ? 'rgba(16,185,129,0.2)'
                                : po.status === 'PARTIALLY_RECEIVED'
                                ? 'rgba(245,158,11,0.2)'
                                : 'rgba(59,130,246,0.2)',
                            color:
                              po.status === 'RECEIVED'
                                ? '#10B981'
                                : po.status === 'PARTIALLY_RECEIVED'
                                ? '#F59E0B'
                                : '#3B82F6',
                          }}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <AdminButton
                            size="sm"
                            variant="primary"
                            icon={<CheckCircle2 size={13} />}
                            onClick={() => handleOpenReceiving(po)}
                          >
                            استلام شحنة
                          </AdminButton>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 5: INVENTORY & MOVEMENT LEDGER (E8 & E9)
          ============================================================== */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Movement Ledger Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SlidersHorizontal size={18} color="var(--facss-gold-400)" />
              سجل حركات المخزون التتبعي (Append-Oriented Movement Ledger)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>رقم الحركة</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>نوع الحركة</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>الصنف</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>الرصيد السابق</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>التغيير (Delta)</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>الرصيد اللاحق</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>المسؤول</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>السبب والبيان</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                        لا توجد حركات مخزنية مسجلة
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                          {m.movementNumber}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              background:
                                m.movementType === 'RECEIPT'
                                  ? 'rgba(16,185,129,0.2)'
                                  : m.movementType === 'ISSUE_DELIVERY'
                                  ? 'rgba(239,68,68,0.2)'
                                  : 'rgba(59,130,246,0.2)',
                              color:
                                m.movementType === 'RECEIPT'
                                  ? '#10B981'
                                  : m.movementType === 'ISSUE_DELIVERY'
                                  ? '#EF4444'
                                  : '#3B82F6',
                            }}
                          >
                            {m.movementType}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#FFFFFF' }}>
                          {m.product?.nameAr}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF' }}>{m.quantityBefore}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: m.quantityDelta > 0 ? '#10B981' : m.quantityDelta < 0 ? '#EF4444' : '#9CA3AF' }}>
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#FFFFFF' }}>{m.quantityAfter}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>{m.actorName}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF', maxWidth: '250px' }}>{m.reason}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#6B7280', fontSize: '0.75rem' }}>
                          {new Date(m.timestamp).toLocaleString('ar-EG')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 6: INSPECTIONS & MAINTENANCE (E12 & E13)
          ============================================================== */}
      {activeTab === 'inspections' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>رقم الفحص</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الصنف</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>نوع الفحص</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>النتيجة الفنية</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>المفتش / الفاحص</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الملخص والملاحظات</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      لا توجد سجلات فحص فني مسجلة
                    </td>
                  </tr>
                ) : (
                  inspections.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                        {i.inspectionNumber}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#FFFFFF' }}>
                        {i.product?.nameAr}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {i.inspectionType}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span
                          style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            background:
                              i.result === 'PASS'
                                ? 'rgba(16,185,129,0.2)'
                                : i.result === 'FAIL'
                                ? 'rgba(239,68,68,0.2)'
                                : 'rgba(245,158,11,0.2)',
                            color:
                              i.result === 'PASS'
                                ? '#10B981'
                                : i.result === 'FAIL'
                                ? '#EF4444'
                                : '#F59E0B',
                          }}
                        >
                          {i.result}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {i.inspector?.fullName}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF', maxWidth: '250px' }}>
                        {i.findings || i.checklistSummary || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#6B7280' }}>
                        {new Date(i.inspectionDate).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================
          TAB 7: DELIVERIES & HANDOVERS (E17 & E18)
          ============================================================== */}
      {activeTab === 'deliveries' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>رقم محضر التسليم</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>الجهة / العميل</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>رقم طلب الخدمة</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>المستلم (ممثل العميل)</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>إجمالي القطع</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>تاريخ التسليم</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>وثيقة التسليم</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      لا توجد محاضر تسليم مسجلة
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                        {d.deliveryNumber}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {d.serviceRequest?.organization}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF' }}>
                        {d.serviceRequest?.requestNumber}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {d.receivedByName}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#FFFFFF' }}>
                        {d.totalItemsCount || 0}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#6B7280' }}>
                        {new Date(d.deliveryDate).toLocaleDateString('ar-EG')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <AdminButton
                          size="sm"
                          variant="outline"
                          icon={<Printer size={13} />}
                          onClick={() => handleViewHandover(d.id)}
                        >
                          عرض المحضر الرسمي
                        </AdminButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================
          MODAL: ADD/EDIT PRODUCT
          ============================================================== */}
      <AdminModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={editingProduct ? 'تعديل بيانات صنف المعدات' : 'إضافة صنف جديد للسجل المركزي'}
      >
        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminInput
            label="رمز الصنف الداخلي (SKU)"
            required
            value={productForm.sku}
            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
          />
          <AdminInput
            label="اسم الصنف (بالعربية)"
            required
            value={productForm.nameAr}
            onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
          />
          <AdminInput
            label="اسم الصنف (بالإنجليزية)"
            required
            value={productForm.nameEn}
            onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
          />
          <AdminSelect
            label="التصنيف"
            required
            value={productForm.categoryId}
            onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
            options={categories.map((c) => ({ value: c.id, label: c.nameAr }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <AdminInput
              label="وحدة القياس"
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
            />
            <AdminInput
              label="الحد الأدنى للمخزون"
              type="number"
              value={String(productForm.minimumStockLevel)}
              onChange={(e) => setProductForm({ ...productForm, minimumStockLevel: Number(e.target.value) })}
            />
          </div>
          <AdminInput
            label="الشركة المصنعة / العلامة التجارية"
            value={productForm.manufacturer}
            onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
          />
          <AdminTextarea
            label="المواصفات الفنية"
            value={productForm.specifications}
            onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
          />

          <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>ضوابط التتبع التشغيلية:</div>
            <AdminCheckbox
              label="يتطلب فحص فني معتمد قبل التسليم (Delivery Inspection Gate)"
              checked={productForm.inspectionRequired}
              onChange={(checked) => setProductForm({ ...productForm, inspectionRequired: checked })}
            />
            <AdminCheckbox
              label="يتطلب تتبع تاريخ الصلاحية (Expiry Tracking)"
              checked={productForm.expiryTrackingRequired}
              onChange={(checked) => setProductForm({ ...productForm, expiryTrackingRequired: checked })}
            />
            <AdminCheckbox
              label="يتطلب تتبع الأرقام التسلسلية الفردية (Serial Tracking)"
              checked={productForm.serialTrackingRequired}
              onChange={(checked) => setProductForm({ ...productForm, serialTrackingRequired: checked })}
            />
            <AdminCheckbox
              label="يتطلب صيانة ومعايرة دورية (Maintenance Tracking)"
              checked={productForm.maintenanceRequired}
              onChange={(checked) => setProductForm({ ...productForm, maintenanceRequired: checked })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowProductModal(false)}>إلغاء</AdminButton>
            <AdminButton variant="primary" type="submit">حفظ الصنف</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* ==============================================================
          MODAL: ADD SUPPLIER
          ============================================================== */}
      <AdminModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title="تسجيل مورد معتمد جديد"
      >
        <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminInput
            label="اسم المورد التجاري"
            required
            value={supplierForm.name}
            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
          />
          <AdminInput
            label="مسؤول الاتصال"
            value={supplierForm.contactPerson}
            onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
          />
          <AdminInput
            label="رقم الهاتف"
            required
            value={supplierForm.phone}
            onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
          />
          <AdminInput
            label="البريد الإلكتروني"
            type="email"
            value={supplierForm.email}
            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
          />
          <AdminTextarea
            label="العنوان والمقر"
            value={supplierForm.address}
            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowSupplierModal(false)}>إلغاء</AdminButton>
            <AdminButton variant="primary" type="submit">تسجيل المورد</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* ==============================================================
          MODAL: RECEIVE SHIPMENT (E7)
          ============================================================== */}
      {showReceivingModal && receivingPo && (
        <AdminModal
          isOpen={showReceivingModal}
          onClose={() => setShowReceivingModal(false)}
          title={`استلام شحنة توريد لأمر الشراء [${receivingPo.referenceNumber}]`}
        >
          <form onSubmit={handleSaveReceiving} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label="رقم إشعار التسليم / فاتورة المورد (Delivery Note #)"
              value={receivingForm.deliveryNoteNumber}
              onChange={(e) => setReceivingForm({ ...receivingForm, deliveryNoteNumber: e.target.value })}
            />

            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                قاعدة الاستلام: زيادة المخزون تحسب حصراً للكميات المقبولة فقط
              </div>
              {receivingForm.items.map((it: any, idx: number) => (
                <div key={idx} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--facss-gold-400)', marginBottom: '0.35rem' }}>
                    {it.productName} (المتبقي للطلب: {it.quantityOrdered})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <AdminInput
                      label="المستلم كلياً"
                      type="number"
                      value={String(it.quantityReceived)}
                      onChange={(e) => {
                        const rec = Number(e.target.value);
                        const newItems = [...receivingForm.items];
                        newItems[idx].quantityReceived = rec;
                        newItems[idx].quantityAccepted = Math.max(0, rec - newItems[idx].quantityRejected);
                        setReceivingForm({ ...receivingForm, items: newItems });
                      }}
                    />
                    <AdminInput
                      label="المقبول (يدخل المخزون)"
                      type="number"
                      value={String(it.quantityAccepted)}
                      onChange={(e) => {
                        const acc = Number(e.target.value);
                        const newItems = [...receivingForm.items];
                        newItems[idx].quantityAccepted = acc;
                        newItems[idx].quantityRejected = Math.max(0, newItems[idx].quantityReceived - acc);
                        setReceivingForm({ ...receivingForm, items: newItems });
                      }}
                    />
                    <AdminInput
                      label="المرفوض"
                      type="number"
                      value={String(it.quantityRejected)}
                      onChange={(e) => {
                        const rej = Number(e.target.value);
                        const newItems = [...receivingForm.items];
                        newItems[idx].quantityRejected = rej;
                        newItems[idx].quantityAccepted = Math.max(0, newItems[idx].quantityReceived - rej);
                        setReceivingForm({ ...receivingForm, items: newItems });
                      }}
                    />
                  </div>
                  {it.quantityRejected > 0 && (
                    <AdminInput
                      label="سبب الرفض"
                      required
                      placeholder="تلف أثناء النقل / عدم مطابقة المواصفات..."
                      value={it.rejectionReason}
                      onChange={(e) => {
                        const newItems = [...receivingForm.items];
                        newItems[idx].rejectionReason = e.target.value;
                        setReceivingForm({ ...receivingForm, items: newItems });
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" onClick={() => setShowReceivingModal(false)}>إلغاء</AdminButton>
              <AdminButton variant="primary" type="submit">تأكيد الاستلام وإيداع المقبول</AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ==============================================================
          MODAL: MANUAL ADJUSTMENT (E9 & E10)
          ============================================================== */}
      <AdminModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        title="تعديل يدوي موثق لأرصدة المخزون"
      >
        <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminSelect
            label="اختر الصنف"
            required
            value={adjustForm.productId}
            onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.sku} - ${p.nameAr} (الرصيد الفعلي: ${p.quantityOnHand}، المحجوز: ${p.quantityReserved})`,
            }))}
          />
          <AdminInput
            label="قيمة التعديل (Delta) - موجب للإضافة، سالب للخصم"
            type="number"
            required
            value={String(adjustForm.delta)}
            onChange={(e) => setAdjustForm({ ...adjustForm, delta: Number(e.target.value) })}
          />
          <AdminTextarea
            label="سبب التعديل الإلزامي (مطلوب للتدقيق الرقابي)"
            required
            placeholder="تسوية جرد سنوي، استبعاد تالف، تصحيح خطأ مدخلات..."
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowAdjustModal(false)}>إلغاء</AdminButton>
            <AdminButton variant="primary" type="submit">تأكيد التعديل وتوثيق الحركة</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* ==============================================================
          MODAL: TECHNICAL INSPECTION (E12)
          ============================================================== */}
      <AdminModal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        title="تسجيل محضر فحص فني للمعدات"
      >
        <form onSubmit={handleSaveInspection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminSelect
            label="الصنف المراد فحصه"
            required
            value={inspectionForm.productId}
            onChange={(e) => setInspectionForm({ ...inspectionForm, productId: e.target.value })}
            options={products.map((p) => ({ value: p.id, label: `${p.sku} - ${p.nameAr}` }))}
          />
          <AdminSelect
            label="نوع الفحص"
            required
            value={inspectionForm.inspectionType}
            onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionType: e.target.value })}
            options={[
              { value: 'RECEIVING', label: 'فحص استلام شحنة جديدة' },
              { value: 'PRE_DELIVERY', label: 'فحص ما قبل التسليم للعميل' },
              { value: 'PERIODIC', label: 'فحص ومعايرة دورية' },
              { value: 'RETURN', label: 'فحص معدات مرتجعة' },
            ]}
          />
          <AdminSelect
            label="النتيجة الفنية"
            required
            value={inspectionForm.result}
            onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
            options={[
              { value: 'PASS', label: 'PASS — مجاز ومطابق للمواصفات' },
              { value: 'FAIL', label: 'FAIL — راسب وغير مطابق (يحظر التسليم)' },
              { value: 'CONDITIONAL', label: 'CONDITIONAL — معلق بانتظار تعديل' },
            ]}
          />
          <AdminTextarea
            label="ملخص الفحص وقائمة التحقق"
            value={inspectionForm.checklistSummary}
            onChange={(e) => setInspectionForm({ ...inspectionForm, checklistSummary: e.target.value })}
          />
          <AdminTextarea
            label="النتائج الفنية والملاحظات"
            value={inspectionForm.findings}
            onChange={(e) => setInspectionForm({ ...inspectionForm, findings: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowInspectionModal(false)}>إلغاء</AdminButton>
            <AdminButton variant="primary" type="submit">اعتماد محضر الفحص</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* ==============================================================
          MODAL: OFFICIAL HANDOVER DOCUMENT (E18)
          ============================================================== */}
      {showHandoverModal && selectedHandover && (
        <AdminModal
          isOpen={showHandoverModal}
          onClose={() => setShowHandoverModal(false)}
          title="محضر استلام وتسليم معدات رسمي"
        >
          <div
            id="printable-handover-doc"
            style={{
              padding: '1.5rem',
              background: '#FFFFFF',
              color: '#111827',
              borderRadius: '8px',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.6,
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #E5E7EB', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {selectedHandover.centerNameAr}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                {selectedHandover.centerNameEn}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: 800, color: '#0369A1' }}>
                {selectedHandover.documentTitleAr}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                رقم المحضر: <strong>{selectedHandover.deliveryReference}</strong> | تاريخ التسليم:{' '}
                <strong>{new Date(selectedHandover.deliveryDate).toLocaleDateString('ar-EG')}</strong>
              </div>
            </div>

            {/* Parties Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>الجهة المستلمة (العميل):</div>
                <div>المنظمة / الشركة: <strong>{selectedHandover.client.organization}</strong></div>
                <div>المستلم المعتمد: <strong>{selectedHandover.receivedBy.representativeName}</strong></div>
                <div>الصفة: {selectedHandover.receivedBy.role}</div>
                <div>الهاتف: {selectedHandover.receivedBy.phone}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>الجهة المسلّمة (المركز):</div>
                <div>الإدارة: {selectedHandover.deliveredBy.centerDepartment}</div>
                <div>المسؤول المسلّم: <strong>{selectedHandover.deliveredBy.officerName}</strong></div>
                <div>مرجع طلب الخدمة: {selectedHandover.serviceRequestNumber}</div>
                <div>موقع التسليم: {selectedHandover.deliveryLocation}</div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '0.5rem' }}>#</th>
                    <th style={{ padding: '0.5rem' }}>رمز الصنف</th>
                    <th style={{ padding: '0.5rem' }}>بيان المعدات والتجهيزات</th>
                    <th style={{ padding: '0.5rem' }}>الكمية</th>
                    <th style={{ padding: '0.5rem' }}>الرقم التسلسلي</th>
                    <th style={{ padding: '0.5rem' }}>حالة الفحص الفني</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHandover.items.map((it: any) => (
                    <tr key={it.itemNumber} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.5rem' }}>{it.itemNumber}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{it.sku}</td>
                      <td style={{ padding: '0.5rem' }}>{it.nameAr}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700 }}>{it.quantity} {it.unit}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{it.serialNumber || '—'}</td>
                      <td style={{ padding: '0.5rem', color: '#16A34A', fontWeight: 600 }}>{it.inspectionStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Acknowledgment & Signatures (No fake signatures: explicit printed acknowledgment) */}
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#92400E', marginBottom: '1.25rem' }}>
              <strong>إقرار استلام رسمي:</strong> {selectedHandover.receivedBy.acknowledgmentTextAr}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#64748B' }}>المسلّم عن مركز عدن الأول (FACSS):</div>
                <div style={{ fontWeight: 700, marginTop: '0.5rem' }}>{selectedHandover.deliveredBy.officerName}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>(اعتماد إلكتروني مسجل في النظام)</div>
              </div>
              <div>
                <div style={{ color: '#64748B' }}>المستلم عن الجهة الطالبة:</div>
                <div style={{ fontWeight: 700, marginTop: '0.5rem' }}>{selectedHandover.receivedBy.representativeName}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>(اسم الممثل المعتمد المسجل رسمياً)</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowHandoverModal(false)}>إغلاق</AdminButton>
            <AdminButton variant="primary" icon={<Printer size={14} />} onClick={() => window.print()}>
              طباعة المحضر
            </AdminButton>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
