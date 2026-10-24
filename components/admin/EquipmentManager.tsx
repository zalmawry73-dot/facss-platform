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
  AdminStatusBadge,
} from '@/components/admin/ui';
import { useAdminT } from '@/lib/admin-i18n';

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
  const { tx, isAr, locale } = useAdminT();
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

  // Categories Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryForm, setCategoryForm] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    icon: 'Package',
    order: 0,
    isActive: true,
  });

  // Direct Delivery Modal
  const [showDirectDeliveryModal, setShowDirectDeliveryModal] = useState(false);
  const [directDeliveryForm, setDirectDeliveryForm] = useState({
    clientName: '',
    receivedByName: '',
    receivedByPhone: '',
    receivedByRole: '',
    deliveryLocation: '',
    notes: '',
    items: [{ productId: '', quantityDelivered: 1, serialNumbers: '', condition: 'NEW', notes: '' }],
  });

  // Load active tab data
  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  const fetchTabData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === 'overview') {
        const res = await fetch('/api/admin/equipment/overview');
        const data = await res.json();
        if (data.success) {
          if (data.kpis) setKpis(data.kpis);
          if (data.categories) setCategories(data.categories);
          if (data.products) setProducts(data.products);
          if (data.suppliers) setSuppliers(data.suppliers);
          if (data.procurements) setProcurements(data.procurements);
          if (data.inventorySummary) setInventorySummary(data.inventorySummary);
          if (data.movements) setMovements(data.movements);
          if (data.inspections) setInspections(data.inspections);
          if (data.maintenances) setMaintenances(data.maintenances);
          if (data.deliveries) setDeliveries(data.deliveries);
        }
        return;
      }
      if (tab === 'products') {
        const [resProd, resCat] = await Promise.all([
          fetch('/api/admin/equipment/products?includeInactive=true'),
          fetch('/api/admin/equipment/categories?includeInactive=true'),
        ]);
        const dataProd = await resProd.json();
        const dataCat = await resCat.json();
        if (dataProd.success) setProducts(dataProd.products);
        if (dataCat.success) setCategories(dataCat.categories);
      }
      if (tab === 'inventory') {
        const [resInv, resMov] = await Promise.all([
          fetch('/api/admin/equipment/inventory'),
          fetch('/api/admin/equipment/inventory/movements?limit=30'),
        ]);
        const dataInv = await resInv.json();
        const dataMov = await resMov.json();
        if (dataInv.success) setInventorySummary(dataInv.summary);
        if (dataMov.success) setMovements(dataMov.movements);
      }
      if (tab === 'procurement') {
        const res = await fetch('/api/admin/equipment/procurement');
        const data = await res.json();
        if (data.success) setProcurements(data.orders);
      }
      if (tab === 'suppliers') {
        const res = await fetch('/api/admin/equipment/suppliers');
        const data = await res.json();
        if (data.success) setSuppliers(data.suppliers);
      }
      if (tab === 'inspections') {
        const [resInsp, resMaint] = await Promise.all([
          fetch('/api/admin/equipment/inspections'),
          fetch('/api/admin/equipment/maintenance'),
        ]);
        const dataInsp = await resInsp.json();
        const dataMaint = await resMaint.json();
        if (dataInsp.success) setInspections(dataInsp.inspections);
        if (dataMaint.success) setMaintenances(dataMaint.maintenances);
      }
      if (tab === 'deliveries') {
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

  const handleOpenNewCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
      nameAr: '',
      nameEn: '',
      description: '',
      icon: 'Package',
      order: categories.length + 1,
      isActive: true,
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCategoryForm({
      code: cat.code || '',
      nameAr: cat.nameAr || '',
      nameEn: cat.nameEn || '',
      description: cat.description || '',
      icon: cat.icon || 'Package',
      order: cat.order ?? 0,
      isActive: cat.isActive ?? true,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingCategory
        ? `/api/admin/equipment/categories/${editingCategory.id}`
        : '/api/admin/equipment/categories';
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ في حفظ تصنيف المعدات'));

      setFeedback({ type: 'success', message: tx('تم حفظ تصنيف المعدات بنجاح') });
      setShowCategoryModal(false);
      setEditingCategory(null);
      const catRes = await fetch('/api/admin/equipment/categories?includeInactive=true');
      const catData = await catRes.json();
      if (catData.success) setCategories(catData.categories);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
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
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ في حفظ الصنف'));

      setFeedback({ type: 'success', message: tx('تم حفظ صنف المعدات بنجاح في السجل المركزي') });
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
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ في تسجيل المورد'));

      setFeedback({ type: 'success', message: tx('تم تسجيل المورد المعتمد بنجاح') });
      setShowSupplierModal(false);
      fetchTabData('suppliers');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSavePo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedSupplier = suppliers.find((s) => s.id === poForm.supplierId);
      if (!selectedSupplier || selectedSupplier.status !== 'ACTIVE') {
        throw new Error(tx('المورد المحدد غير نشط أو معطل. لا يمكن إصدار أمر شراء لمورد غير نشط'));
      }

      const res = await fetch('/api/admin/equipment/procurement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(poForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ في إنشاء أمر الشراء'));

      setFeedback({ type: 'success', message: tx('تم إنشاء أمر الشراء والتوريد بنجاح (المخزون لم يتغير لحين الاستلام الفعلي)') });
      setShowPoModal(false);
      fetchTabData('procurement');
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  const handleSaveDirectDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!directDeliveryForm.clientName.trim()) {
        throw new Error(tx('يرجى تحديد اسم العميل أو المنظمة'));
      }
      if (!directDeliveryForm.receivedByName.trim()) {
        throw new Error(tx('يرجى تحديد اسم المستلم المعتمد'));
      }
      if (!directDeliveryForm.items.length || !directDeliveryForm.items[0].productId) {
        throw new Error(tx('يرجى اختيار صنف معدات واحد على الأقل'));
      }

      const res = await fetch('/api/admin/equipment/deliveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDirectClientDelivery: true,
          ...directDeliveryForm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ أثناء إصدار محضر التسليم'));

      setFeedback({ type: 'success', message: tx('تم إصدار محضر التسليم المباشر وخصم الكميات من المخزون بنجاح') });
      setShowDirectDeliveryModal(false);
      fetchTabData('deliveries');

      if (data.handoverDocument) {
        setSelectedHandover(data.handoverDocument);
        setShowHandoverModal(true);
      }
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
        productName: isAr ? it.product.nameAr : (it.product.nameEn || it.product.nameAr),
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
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ أثناء استلام الشحنة'));

      setFeedback({ type: 'success', message: data.message || tx('تم استلام الشحنة وزيادة المخزون بالكميات المقبولة فقط') });
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
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ أثناء تعديل المخزون'));

      setFeedback({ type: 'success', message: tx('تم توثيق التعديل المخزني والحركة بنجاح') });
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
      if (!res.ok) throw new Error(data.error || tx('حدث خطأ في تسجيل الفحص الفني'));

      setFeedback({ type: 'success', message: tx('تم توثيق محضر الفحص الفني بنجاح') });
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
      if (!res.ok) throw new Error(data.error || tx('تعذر جلب وثيقة التسليم'));

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
        title={tx("منظومة تجهيزات السلامة والمشتريات والمخزون")}
        description={tx("الإدارة التشغيلية الشاملة لدورة حياة المعدات: التوريد، الفحص الفني، المخزون، الحجز، والتسليم الرسمي للعملاء")}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <AdminButton
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={() => fetchTabData(activeTab)}
            >
              {tx("تحديث البيانات")}
            </AdminButton>
            {activeTab === 'products' && (
              <>
                <AdminButton
                  variant="outline"
                  size="sm"
                  icon={<Layers size={14} />}
                  onClick={() => setShowCategoryModal(true)}
                >
                  {tx("إدارة التصنيفات")}
                </AdminButton>
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
                  {tx("إضافة صنف جديد")}
                </AdminButton>
              </>
            )}
            {activeTab === 'suppliers' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowSupplierModal(true)}
              >
                {tx("تسجيل مورد معتمد")}
              </AdminButton>
            )}
            {activeTab === 'procurement' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowPoModal(true)}
              >
                {tx("إنشاء أمر شراء")}
              </AdminButton>
            )}
            {activeTab === 'inventory' && (
              <AdminButton
                variant="outline"
                size="sm"
                icon={<SlidersHorizontal size={14} />}
                onClick={() => setShowAdjustModal(true)}
              >
                {tx("تعديل يدوي للمخزون")}
              </AdminButton>
            )}
            {activeTab === 'inspections' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setShowInspectionModal(true)}
              >
                {tx("تسجيل فحص فني")}
              </AdminButton>
            )}
            {activeTab === 'deliveries' && (
              <AdminButton
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => {
                  setDirectDeliveryForm({
                    clientName: '',
                    receivedByName: '',
                    receivedByPhone: '',
                    receivedByRole: '',
                    deliveryLocation: '',
                    notes: '',
                    items: [{ productId: products[0]?.id || '', quantityDelivered: 1, serialNumbers: '', condition: 'NEW', notes: '' }],
                  });
                  setShowDirectDeliveryModal(true);
                }}
              >
                {tx("محضر تسليم مباشر للعميل")}
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
      <div style={{ marginBottom: '1.5rem', width: '100%', minWidth: 0 }}>
        <AdminTabs
          tabs={[
            { id: 'overview', label: tx('المؤشرات التشغيلية'), icon: Layers },
            { id: 'products', label: tx('دليل المعدات والأصناف'), icon: Package, count: products.length },
            { id: 'suppliers', label: tx('سجل الموردين'), icon: Truck, count: suppliers.length },
            { id: 'procurement', label: tx('أوامر الشراء والاستلام'), icon: ShoppingCart, count: procurements.length },
            { id: 'inventory', label: tx('المخزون وسجل الحركات'), icon: SlidersHorizontal },
            { id: 'inspections', label: tx('الفحص الفني والصيانة'), icon: ShieldCheck, count: inspections.length },
            { id: 'deliveries', label: tx('محاضر التسليم والتسليم'), icon: ClipboardCheck, count: deliveries.length },
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
            <div className="card" style={{ padding: '1.25rem', borderInlineEnd: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>{tx("معدل جاهزية المعدات (KPI)")}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10B981' }}>
                {kpis?.equipment?.equipmentReadinessRate?.displayValue || '100%'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                {tx("المعدات الجاهزة المطابقة للفحص والصلاحية")}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderInlineEnd: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>{tx("إجمالي الأصناف النشطة")}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF' }}>
                {products.filter((p) => p.isActive).length} {tx("صنف")}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                {tx("موزعة على {0} تصنيفات معتمدة", categories.length)}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderInlineEnd: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>{tx("المخزون المتاح للطلب")}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#F59E0B' }}>
                {products.reduce((s, p) => s + (p.quantityAvailable || 0), 0)} {tx("وحدة")}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                {tx("(الفعلي: {0} - المحجوز: {1})", products.reduce((s, p) => s + p.quantityOnHand, 0), products.reduce((s, p) => s + p.quantityReserved, 0))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderInlineEnd: '4px solid #EF4444' }}>
              <div style={{ fontSize: '0.82rem', color: '#9CA3AF', marginBottom: '0.35rem' }}>{tx("أصناف منخفضة / نفدت")}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#EF4444' }}>
                {products.filter((p) => p.isLowStock || p.isOutOfStock).length} {tx("صنف")}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                {tx("تتطلب إصدار أوامر شراء عاجلة")}
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
                {tx("حالة التوريد والشراء")}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>{tx("أوامر الشراء قيد التنفيذ:")}</span>
                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{procurements.filter((p) => p.status !== 'RECEIVED' && p.status !== 'CANCELLED').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>{tx("شحنات بانتظار الاستلام:")}</span>
                  <span style={{ fontWeight: 700, color: '#F59E0B' }}>{procurements.filter((p) => p.status === 'ORDERED' || p.status === 'PARTIALLY_RECEIVED').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>{tx("الموردون المعتمدون النشطون:")}</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>{suppliers.filter((s) => s.status === 'ACTIVE').length}</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#10B981" />
                {tx("الفحص الفني والتسليم")}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>{tx("عمليات الفحص المعتمدة (PASS):")}</span>
                  <span style={{ fontWeight: 700, color: '#10B981' }}>{inspections.filter((i) => i.result === 'PASS').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>{tx("عمليات فحص رسبت (FAIL):")}</span>
                  <span style={{ fontWeight: 700, color: '#EF4444' }}>{inspections.filter((i) => i.result === 'FAIL').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                  <span style={{ color: '#D1D5DB', fontSize: '0.85rem' }}>{tx("محاضر التسليم المكتملة للعملاء:")}</span>
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
                placeholder={tx("بحث برمز SKU أو اسم الصنف أو الصانع...")}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: isAr ? '0.5rem 2rem 0.5rem 0.75rem' : '0.5rem 0.75rem 0.5rem 2rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                }}
              />
              <Search size={16} style={{ position: 'absolute', insetInlineEnd: '0.65rem', top: '0.65rem', color: '#6B7280' }} />
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
              <option value="">{tx("جميع التصنيفات")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{isAr ? c.nameAr : (c.nameEn || c.nameAr)}</option>
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
              <option value="">{tx("جميع حالات المخزون")}</option>
              <option value="AVAILABLE">{tx("متوفر في المخزون")}</option>
              <option value="LOW">{tx("مخزون منخفض")}</option>
              <option value="OUT">{tx("نفد المخزون")}</option>
            </select>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("رمز الصنف (SKU)")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("اسم الصنف")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("التصنيف")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الرصيد الفعلي")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("المحجوز")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("المتاح")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("ضوابط التتبع")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الحالة")}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{tx("الإجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      {tx("لا توجد أصناف مطابقة لمعايير البحث")}
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                        {p.sku}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{isAr ? p.nameAr : (p.nameEn || p.nameAr)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{isAr ? p.nameEn : p.nameAr}</div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {isAr ? p.category?.nameAr : (p.category?.nameEn || p.category?.nameAr)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {p.quantityOnHand} {isAr ? (p.unit === 'piece' ? 'قطعة' : p.unit === 'set' ? 'طقم' : p.unit) : p.unit}
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
                          {p.quantityAvailable} {isAr ? (p.unit === 'piece' ? 'قطعة' : p.unit === 'set' ? 'طقم' : p.unit) : p.unit}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {p.inspectionRequired && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: 'rgba(59,130,246,0.2)', color: '#3B82F6', borderRadius: '3px' }}>
                              {tx("فحص")}
                            </span>
                          )}
                          {p.serialTrackingRequired && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: 'rgba(139,92,246,0.2)', color: '#8B5CF6', borderRadius: '3px' }}>
                              {tx("تسلسلي")}
                            </span>
                          )}
                          {p.expiryTrackingRequired && (
                            <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', background: 'rgba(236,72,153,0.2)', color: '#EC4899', borderRadius: '3px' }}>
                              {tx("صلاحية")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <AdminStatusBadge
                          status={p.isActive ? "ACTIVE" : "INACTIVE"}
                          label={p.isActive ? tx("نشط") : tx("موقف")}
                        />
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
                          {tx("تعديل")}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("كود المورد")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("اسم المورد")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("مسؤول الاتصال")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("رقم الهاتف")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("البريد الإلكتروني")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("أوامر الشراء")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الحالة")}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      {tx("لم يتم تسجيل أي موردين بعد")}
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
                        <AdminStatusBadge
                          status={s.status}
                          label={s.status === 'ACTIVE' ? tx("معتمد") : tx("موقف")}
                        />
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("رقم أمر الشراء")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("المورد")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("تاريخ الأمر")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الكمية المطلوبة")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الكمية المستلمة")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الحالة")}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{tx("الإجراءات")}</th>
                </tr>
              </thead>
              <tbody>
                {procurements.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      {tx("لا توجد أوامر شراء مسجلة")}
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
                        {new Date(po.orderDate).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#FFFFFF' }}>
                        {po.totalQuantityOrdered}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600, color: '#10B981' }}>
                        {po.totalQuantityReceived}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <AdminStatusBadge status={po.status} />
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        {po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <AdminButton
                            size="sm"
                            variant="primary"
                            icon={<CheckCircle2 size={13} />}
                            onClick={() => handleOpenReceiving(po)}
                          >
                            {tx("استلام شحنة")}
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
              {tx("سجل حركات المخزون التتبعي (Append-Oriented Movement Ledger)")}
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("رقم الحركة")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("نوع الحركة")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الصنف")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الرصيد السابق")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("التغيير (Delta)")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الرصيد اللاحق")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("المسؤول")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("السبب والبيان")}</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>{tx("التاريخ والوقت")}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                        {tx("لا توجد حركات مخزنية مسجلة")}
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                          {m.movementNumber}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem' }}>
                          <AdminStatusBadge status={m.movementType} />
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#FFFFFF' }}>
                          {isAr ? m.product?.nameAr : (m.product?.nameEn || m.product?.nameAr)}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF' }}>{m.quantityBefore}</td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: m.quantityDelta > 0 ? '#10B981' : m.quantityDelta < 0 ? '#EF4444' : '#9CA3AF' }}>
                          {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta}
                        </td>
                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: '#FFFFFF' }}>{m.quantityAfter}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>{m.actorName}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF', maxWidth: '250px' }}>{m.reason}</td>
                        <td style={{ padding: '0.75rem 0.5rem', color: '#6B7280', fontSize: '0.75rem' }}>
                          {new Date(m.timestamp).toLocaleString(isAr ? 'ar-YE' : 'en-US')}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("رقم الفحص")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الصنف")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("نوع الفحص")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("النتيجة الفنية")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("المفتش / الفاحص")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الملخص والملاحظات")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("التاريخ")}</th>
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      {tx("لا توجد سجلات فحص فني مسجلة")}
                    </td>
                  </tr>
                ) : (
                  inspections.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                        {i.inspectionNumber}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#FFFFFF' }}>
                        {isAr ? i.product?.nameAr : (i.product?.nameEn || i.product?.nameAr)}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {i.inspectionType === 'RECEIVING'
                          ? tx('فحص استلام شحنة جديدة')
                          : i.inspectionType === 'PRE_DELIVERY'
                          ? tx('فحص ما قبل التسليم للعميل')
                          : i.inspectionType === 'PERIODIC'
                          ? tx('فحص ومعايرة دورية')
                          : i.inspectionType === 'RETURN'
                          ? tx('فحص معدات مرتجعة')
                          : i.inspectionType}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <AdminStatusBadge status={i.result} />
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#D1D5DB' }}>
                        {i.inspector?.fullName}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#9CA3AF', maxWidth: '250px' }}>
                        {i.findings || i.checklistSummary || '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', color: '#6B7280' }}>
                        {new Date(i.inspectionDate).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isAr ? 'right' : 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("رقم محضر التسليم")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("الجهة / العميل")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("رقم طلب الخدمة")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("المستلم (ممثل العميل)")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("إجمالي القطع")}</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>{tx("تاريخ التسليم")}</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>{tx("وثيقة التسليم")}</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#6B7280' }}>
                      {tx("لا توجد محاضر تسليم مسجلة")}
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
                        {new Date(d.deliveryDate).toLocaleDateString(isAr ? 'ar-YE' : 'en-US')}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>
                        <AdminButton
                          size="sm"
                          variant="outline"
                          icon={<Printer size={13} />}
                          onClick={() => handleViewHandover(d.id)}
                        >
                          {tx("عرض المحضر الرسمي")}
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
        title={editingProduct ? tx('تعديل بيانات صنف المعدات') : tx('إضافة صنف جديد للسجل المركزي')}
      >
        <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminInput
            label={tx("رمز الصنف الداخلي (SKU)")}
            required
            value={productForm.sku}
            onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
          />
          <AdminInput
            label={tx("اسم الصنف (بالعربية)")}
            required
            value={productForm.nameAr}
            onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
          />
          <AdminInput
            label={tx("اسم الصنف (بالإنجليزية)")}
            required
            value={productForm.nameEn}
            onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)' }}>
                {tx("التصنيف")} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <button
                type="button"
                onClick={() => handleOpenNewCategory()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--facss-gold-400, #D4AF37)',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Plus size={12} />
                <span>{tx("إضافة تصنيف جديد")}</span>
              </button>
            </div>
            <select
              className="admin-select"
              required
              value={productForm.categoryId}
              onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              style={{ width: '100%', height: 'var(--admin-control-height-md)', margin: 0 }}
            >
              <option value="">{tx("— اختر التصنيف —")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.nameAr : (c.nameEn || c.nameAr)} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <AdminInput
              label={tx("وحدة القياس")}
              value={productForm.unit}
              onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
            />
            <AdminInput
              label={tx("الحد الأدنى للمخزون")}
              type="number"
              value={String(productForm.minimumStockLevel)}
              onChange={(e) => setProductForm({ ...productForm, minimumStockLevel: Number(e.target.value) })}
            />
          </div>
          <AdminInput
            label={tx("الشركة المصنعة / العلامة التجارية")}
            value={productForm.manufacturer}
            onChange={(e) => setProductForm({ ...productForm, manufacturer: e.target.value })}
          />
          <AdminTextarea
            label={tx("المواصفات الفنية")}
            value={productForm.specifications}
            onChange={(e) => setProductForm({ ...productForm, specifications: e.target.value })}
          />

          <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>{tx("ضوابط التتبع التشغيلية:")}</div>
            <AdminCheckbox
              label={tx("يتطلب فحص فني معتمد قبل التسليم (Delivery Inspection Gate)")}
              checked={productForm.inspectionRequired}
              onChange={(checked) => setProductForm({ ...productForm, inspectionRequired: checked })}
            />
            <AdminCheckbox
              label={tx("يتطلب تتبع تاريخ الصلاحية (Expiry Tracking)")}
              checked={productForm.expiryTrackingRequired}
              onChange={(checked) => setProductForm({ ...productForm, expiryTrackingRequired: checked })}
            />
            <AdminCheckbox
              label={tx("يتطلب تتبع الأرقام التسلسلية الفردية (Serial Tracking)")}
              checked={productForm.serialTrackingRequired}
              onChange={(checked) => setProductForm({ ...productForm, serialTrackingRequired: checked })}
            />
            <AdminCheckbox
              label={tx("يتطلب صيانة ومعايرة دورية (Maintenance Tracking)")}
              checked={productForm.maintenanceRequired}
              onChange={(checked) => setProductForm({ ...productForm, maintenanceRequired: checked })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowProductModal(false)}>{tx("إلغاء")}</AdminButton>
            <AdminButton variant="primary" type="submit">{tx("حفظ الصنف")}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* ==============================================================
          MODAL: ADD SUPPLIER
          ============================================================== */}
      <AdminModal
        isOpen={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        title={tx("تسجيل مورد معتمد جديد")}
      >
        <form onSubmit={handleSaveSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminInput
            label={tx("اسم المورد التجاري")}
            required
            value={supplierForm.name}
            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
          />
          <AdminInput
            label={tx("مسؤول الاتصال")}
            value={supplierForm.contactPerson}
            onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
          />
          <AdminInput
            label={tx("رقم الهاتف")}
            required
            value={supplierForm.phone}
            onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
          />
          <AdminInput
            label={tx("البريد الإلكتروني")}
            type="email"
            value={supplierForm.email}
            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
          />
          <AdminTextarea
            label={tx("العنوان والمقر")}
            value={supplierForm.address}
            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowSupplierModal(false)}>{tx("إلغاء")}</AdminButton>
            <AdminButton variant="primary" type="submit">{tx("تسجيل المورد")}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* ==============================================================
          MODAL: CREATE PURCHASE ORDER (E6)
          ============================================================== */}
      {showPoModal && (
        <AdminModal
          isOpen={showPoModal}
          onClose={() => setShowPoModal(false)}
          title={tx("إنشاء أمر شراء وتوريد جديد")}
        >
          <form onSubmit={handleSavePo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary, #9CA3AF)', display: 'block', marginBottom: '0.35rem' }}>
                {tx("اختر المورد المعتمد")} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                className="admin-select"
                required
                value={poForm.supplierId}
                onChange={(e) => setPoForm({ ...poForm, supplierId: e.target.value })}
                style={{ width: '100%', height: 'var(--admin-control-height-md)', margin: 0 }}
              >
                <option value="">{tx("— اختر مورداً نشطاً —")}</option>
                {suppliers.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    disabled={s.status !== 'ACTIVE'}
                    style={{ color: s.status !== 'ACTIVE' ? '#9CA3AF' : undefined }}
                  >
                    {isAr ? (s.nameAr || s.name) : s.name} {s.status === 'ACTIVE' ? `(${tx('نشط')})` : `[${tx('معطل - غير متاح للطلب')}]`}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.75rem' }}>
                {tx("بنود أمر الشراء:")}
              </div>
              {poForm.items.map((it, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AdminSelect
                    label={tx("اختر الصنف")}
                    required
                    value={it.productId}
                    onChange={(e) => {
                      const newItems = [...poForm.items];
                      newItems[idx].productId = e.target.value;
                      setPoForm({ ...poForm, items: newItems });
                    }}
                    options={[
                      { value: '', label: tx('اختر الصنف') },
                      ...products.map((p) => ({ value: p.id, label: `${p.sku} - ${isAr ? p.nameAr : (p.nameEn || p.nameAr)}` }))
                    ]}
                  />
                  <AdminInput
                    label={tx("الكمية:")}
                    type="number"
                    min="1"
                    required
                    value={String(it.quantityOrdered)}
                    onChange={(e) => {
                      const newItems = [...poForm.items];
                      newItems[idx].quantityOrdered = Math.max(1, Number(e.target.value));
                      setPoForm({ ...poForm, items: newItems });
                    }}
                  />
                  <AdminInput
                    label={tx("سعر الوحدة:")}
                    type="number"
                    min="0"
                    value={String(it.unitPrice)}
                    onChange={(e) => {
                      const newItems = [...poForm.items];
                      newItems[idx].unitPrice = Number(e.target.value);
                      setPoForm({ ...poForm, items: newItems });
                    }}
                  />
                </div>
              ))}
              <AdminButton
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPoForm({ ...poForm, items: [...poForm.items, { productId: '', quantityOrdered: 1, unitPrice: 0 }] })}
              >
                {tx("إضافة بند آخر")}
              </AdminButton>
            </div>
            <AdminTextarea
              label={tx("ملاحظات أمر الشراء...")}
              value={poForm.notes}
              onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" onClick={() => setShowPoModal(false)}>{tx("إلغاء")}</AdminButton>
              <AdminButton variant="primary" type="submit">{tx("إرسال واعتماد أمر الشراء")}</AdminButton>
            </div>
          </form>
        </AdminModal>
      )}

      {/* ==============================================================
          MODAL: RECEIVE SHIPMENT (E7)
          ============================================================== */}
      {showReceivingModal && receivingPo && (
        <AdminModal
          isOpen={showReceivingModal}
          onClose={() => setShowReceivingModal(false)}
          title={tx("استلام شحنة توريد لأمر الشراء [{0}]", receivingPo.referenceNumber)}
        >
          <form onSubmit={handleSaveReceiving} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AdminInput
              label={tx("رقم إشعار التسليم / فاتورة المورد (Delivery Note #)")}
              value={receivingForm.deliveryNoteNumber}
              onChange={(e) => setReceivingForm({ ...receivingForm, deliveryNoteNumber: e.target.value })}
            />

            <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                {tx("قاعدة الاستلام: زيادة المخزون تحسب حصراً للكميات المقبولة فقط")}
              </div>
              {receivingForm.items.map((it: any, idx: number) => (
                <div key={idx} style={{ padding: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--facss-gold-400)', marginBottom: '0.35rem' }}>
                    {it.productName} ({tx("المتبقي للطلب: {0}", it.quantityOrdered)})
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                    <AdminInput
                      label={tx("المستلم كلياً")}
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
                      label={tx("المقبول (يدخل المخزون)")}
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
                      label={tx("المرفوض")}
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
                      label={tx("سبب الرفض")}
                      required
                      placeholder={tx("تلف أثناء النقل / عدم مطابقة المواصفات...")}
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
              <AdminButton variant="outline" onClick={() => setShowReceivingModal(false)}>{tx("إلغاء")}</AdminButton>
              <AdminButton variant="primary" type="submit">{tx("تأكيد الاستلام وإيداع المقبول")}</AdminButton>
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
        title={tx("تعديل يدوي موثق لأرصدة المخزون")}
      >
        <form onSubmit={handleSaveAdjustment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminSelect
            label={tx("اختر الصنف")}
            required
            value={adjustForm.productId}
            onChange={(e) => setAdjustForm({ ...adjustForm, productId: e.target.value })}
            options={products.map((p) => ({
              value: p.id,
              label: `${p.sku} - ${isAr ? p.nameAr : (p.nameEn || p.nameAr)} (${tx("الرصيد الفعلي: {0}، المحجوز: {1}", p.quantityOnHand, p.quantityReserved)})`,
            }))}
          />
          <AdminInput
            label={tx("قيمة التعديل (Delta) - موجب للإضافة، سالب للخصم")}
            type="number"
            required
            value={String(adjustForm.delta)}
            onChange={(e) => setAdjustForm({ ...adjustForm, delta: Number(e.target.value) })}
          />
          <AdminTextarea
            label={tx("سبب التعديل الإلزامي (مطلوب للتدقيق الرقابي)")}
            required
            placeholder={tx("تسوية جرد سنوي، استبعاد تالف، تصحيح خطأ مدخلات...")}
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowAdjustModal(false)}>{tx("إلغاء")}</AdminButton>
            <AdminButton variant="primary" type="submit">{tx("تأكيد التعديل وتوثيق الحركة")}</AdminButton>
          </div>
        </form>
      </AdminModal>

      {/* ==============================================================
          MODAL: TECHNICAL INSPECTION (E12)
          ============================================================== */}
      <AdminModal
        isOpen={showInspectionModal}
        onClose={() => setShowInspectionModal(false)}
        title={tx("تسجيل محضر فحص فني للمعدات")}
      >
        <form onSubmit={handleSaveInspection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AdminSelect
            label={tx("الصنف المراد فحصه")}
            required
            value={inspectionForm.productId}
            onChange={(e) => setInspectionForm({ ...inspectionForm, productId: e.target.value })}
            options={products.map((p) => ({ value: p.id, label: `${p.sku} - ${isAr ? p.nameAr : (p.nameEn || p.nameAr)}` }))}
          />
          <AdminSelect
            label={tx("نوع الفحص")}
            required
            value={inspectionForm.inspectionType}
            onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionType: e.target.value })}
            options={[
              { value: 'RECEIVING', label: tx('فحص استلام شحنة جديدة') },
              { value: 'PRE_DELIVERY', label: tx('فحص ما قبل التسليم للعميل') },
              { value: 'PERIODIC', label: tx('فحص ومعايرة دورية') },
              { value: 'RETURN', label: tx('فحص معدات مرتجعة') },
            ]}
          />
          <AdminSelect
            label={tx("النتيجة الفنية")}
            required
            value={inspectionForm.result}
            onChange={(e) => setInspectionForm({ ...inspectionForm, result: e.target.value })}
            options={[
              { value: 'PASS', label: tx('PASS — مجاز ومطابق للمواصفات') },
              { value: 'FAIL', label: tx('FAIL — راسب وغير مطابق (يحظر التسليم)') },
              { value: 'CONDITIONAL', label: tx('CONDITIONAL — معلق بانتظار تعديل') },
            ]}
          />
          <AdminTextarea
            label={tx("ملخص الفحص وقائمة التحقق")}
            value={inspectionForm.checklistSummary}
            onChange={(e) => setInspectionForm({ ...inspectionForm, checklistSummary: e.target.value })}
          />
          <AdminTextarea
            label={tx("النتائج الفنية والملاحظات")}
            value={inspectionForm.findings}
            onChange={(e) => setInspectionForm({ ...inspectionForm, findings: e.target.value })}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowInspectionModal(false)}>{tx("إلغاء")}</AdminButton>
            <AdminButton variant="primary" type="submit">{tx("اعتماد محضر الفحص")}</AdminButton>
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
          title={tx("محضر استلام وتسليم معدات رسمي")}
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
                {isAr ? selectedHandover.centerNameAr : (selectedHandover.centerNameEn || selectedHandover.centerNameAr)}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                {isAr ? selectedHandover.centerNameEn : selectedHandover.centerNameAr}
              </div>
              <div style={{ marginTop: '0.75rem', fontSize: '1.1rem', fontWeight: 800, color: '#0369A1' }}>
                {isAr ? selectedHandover.documentTitleAr : (selectedHandover.documentTitleEn || tx("محضر تسليم واستلام معدات وتجهيزات أمنية وسلامة"))}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                {tx("رقم المحضر")}: <strong>{selectedHandover.deliveryReference}</strong> | {tx("تاريخ التسليم")}:{' '}
                <strong>{new Date(selectedHandover.deliveryDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US')}</strong>
              </div>
            </div>

            {/* Parties Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>{tx("الجهة المستلمة (العميل):")}</div>
                <div>{tx("المنظمة / الشركة:")} <strong>{selectedHandover.client.organization}</strong></div>
                <div>{tx("المستلم المعتمد:")} <strong>{selectedHandover.receivedBy.representativeName}</strong></div>
                <div>{tx("الصفة:")} {selectedHandover.receivedBy.role}</div>
                <div>{tx("الهاتف:")} {selectedHandover.receivedBy.phone}</div>
              </div>
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>{tx("الجهة المسلّمة (المركز):")}</div>
                <div>{tx("الإدارة:")} {selectedHandover.deliveredBy.centerDepartment}</div>
                <div>{tx("المسؤول المسلّم:")} <strong>{selectedHandover.deliveredBy.officerName}</strong></div>
                <div>{tx("مرجع طلب الخدمة:")} {selectedHandover.serviceRequestNumber}</div>
                <div>{tx("موقع التسليم:")} {selectedHandover.deliveryLocation}</div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: isAr ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ padding: '0.5rem' }}>#</th>
                    <th style={{ padding: '0.5rem' }}>{tx("رمز الصنف")}</th>
                    <th style={{ padding: '0.5rem' }}>{tx("بيان المعدات والتجهيزات")}</th>
                    <th style={{ padding: '0.5rem' }}>{tx("الكمية")}</th>
                    <th style={{ padding: '0.5rem' }}>{tx("الرقم التسلسلي")}</th>
                    <th style={{ padding: '0.5rem' }}>{tx("حالة الفحص الفني")}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedHandover.items.map((it: any) => (
                    <tr key={it.itemNumber} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.5rem' }}>{it.itemNumber}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{it.sku}</td>
                      <td style={{ padding: '0.5rem' }}>{isAr ? it.nameAr : (it.nameEn || it.nameAr)}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700 }}>{it.quantity} {it.unit}</td>
                      <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>{it.serialNumber || '—'}</td>
                      <td style={{ padding: '0.5rem', color: '#16A34A', fontWeight: 600 }}>{it.inspectionStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Acknowledgment & Signatures */}
            <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '0.75rem', borderRadius: '6px', fontSize: '0.8rem', color: '#92400E', marginBottom: '1.25rem' }}>
              <strong>{tx("إقرار استلام رسمي:")}</strong> {isAr ? selectedHandover.receivedBy.acknowledgmentTextAr : (tx(selectedHandover.receivedBy.acknowledgmentTextAr) || selectedHandover.receivedBy.acknowledgmentTextAr)}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: '#64748B' }}>{tx("المسلّم عن مركز الحلول المتكاملة للأمن والسلامة (FACSS):")}</div>
                <div style={{ fontWeight: 700, marginTop: '0.5rem' }}>{selectedHandover.deliveredBy.officerName}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{tx("(اعتماد إلكتروني مسجل في النظام)")}</div>
              </div>
              <div>
                <div style={{ color: '#64748B' }}>{tx("المستلم عن الجهة الطالبة:")}</div>
                <div style={{ fontWeight: 700, marginTop: '0.5rem' }}>{selectedHandover.receivedBy.representativeName}</div>
                <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{tx("(اسم الممثل المعتمد المسجل رسمياً)")}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <AdminButton variant="outline" onClick={() => setShowHandoverModal(false)}>{tx("إغلاق")}</AdminButton>
            <AdminButton variant="primary" icon={<Printer size={14} />} onClick={() => window.print()}>
              {tx("طباعة المحضر")}
            </AdminButton>
          </div>
        </AdminModal>
      )}

      {/* ==============================================================
          MODAL: CATEGORY MANAGEMENT & CREATION
          ============================================================== */}
      {showCategoryModal && (
        <AdminModal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          title={editingCategory ? tx("تعديل تصنيف المعدات: {0}", editingCategory.nameAr) : tx("إدارة تصنيفات المعدات وتجهيزات السلامة")}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Form Section */}
            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--facss-gold-400)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{editingCategory ? tx("تعديل بيانات التصنيف") : tx("إضافة تصنيف جديد للسجل")}</span>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({
                        code: `CAT-${Math.floor(100 + Math.random() * 900)}`,
                        nameAr: '',
                        nameEn: '',
                        description: '',
                        icon: 'Package',
                        order: categories.length + 1,
                        isActive: true,
                      });
                    }}
                    style={{ background: 'none', border: 'none', color: '#9CA3AF', fontSize: '0.78rem', cursor: 'pointer' }}
                  >
                    {tx("إلغاء التعديل والبدء بتصنيف جديد")}
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <AdminInput
                  label={tx("رمز التصنيف (Code)")}
                  required
                  value={categoryForm.code}
                  onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  placeholder="FIRE_SAFETY"
                />
                <AdminInput
                  label={tx("أيقونة التصنيف")}
                  value={categoryForm.icon}
                  onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="Shield / Fire / Package"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <AdminInput
                  label={tx("اسم التصنيف بالعربية")}
                  required
                  value={categoryForm.nameAr}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                  placeholder="معدات مكافحة الحريق والسلامة"
                />
                <AdminInput
                  label={tx("اسم التصنيف بالإنجليزية")}
                  value={categoryForm.nameEn}
                  onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                  placeholder="Fire Fighting & Safety Equipment"
                />
              </div>

              <AdminTextarea
                label={tx("الوصف المؤسسي للتصنيف")}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="بيان نطاق التجهيزات والمواصفات المعتمدة التابعة لهذا التصنيف..."
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <AdminCheckbox
                  label={tx("التصنيف نشط ومعتمد في قوائم الاختيار")}
                  checked={categoryForm.isActive}
                  onChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                />
                <AdminButton variant="primary" size="sm" type="submit">
                  {editingCategory ? tx("حفظ التعديلات") : tx("إضافة التصنيف")}
                </AdminButton>
              </div>
            </form>

            {/* Existing Categories Table */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E2E8F0', marginBottom: '0.5rem' }}>
                {tx("التصنيفات المعتمدة الحالية ({0})", categories.length)}
              </div>
              <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: isAr ? 'right' : 'left' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF' }}>
                      <th style={{ padding: '0.5rem' }}>{tx("الرمز")}</th>
                      <th style={{ padding: '0.5rem' }}>{tx("اسم التصنيف")}</th>
                      <th style={{ padding: '0.5rem' }}>{tx("الأصناف")}</th>
                      <th style={{ padding: '0.5rem' }}>{tx("الحالة")}</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>{tx("إجراء")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '1rem', color: '#6B7280' }}>
                          {tx("لا توجد تصنيفات معرفة بعد")}
                        </td>
                      </tr>
                    ) : (
                      categories.map((c) => (
                        <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '0.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--facss-gold-400)' }}>
                            {c.code}
                          </td>
                          <td style={{ padding: '0.5rem', color: '#FFFFFF' }}>
                            {isAr ? c.nameAr : (c.nameEn || c.nameAr)}
                          </td>
                          <td style={{ padding: '0.5rem', color: '#CBD5E1' }}>
                            {c.productsCount ?? c._count?.products ?? 0} {tx("صنف")}
                          </td>
                          <td style={{ padding: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '0.12rem 0.45rem',
                              borderRadius: '4px',
                              background: c.isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: c.isActive ? '#4ADE80' : '#F87171',
                              fontWeight: 700,
                            }}>
                              {c.isActive ? tx("نشط") : tx("معطل")}
                            </span>
                          </td>
                          <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleEditCategory(c)}
                              style={{
                                background: 'none',
                                border: '1px solid rgba(255,255,255,0.15)',
                                color: '#93C5FD',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                              }}
                            >
                              {tx("تعديل")}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <AdminButton variant="outline" onClick={() => setShowCategoryModal(false)}>
                {tx("إغلاق")}
              </AdminButton>
            </div>
          </div>
        </AdminModal>
      )}

      {/* ==============================================================
          MODAL: DIRECT DELIVERY HANDOVER OUTSIDE PRE-EXISTING REQUEST
          ============================================================== */}
      {showDirectDeliveryModal && (
        <AdminModal
          isOpen={showDirectDeliveryModal}
          onClose={() => setShowDirectDeliveryModal(false)}
          title={tx("إنشاء محضر تسليم مباشر للعميل (Direct Handover)")}
          maxWidth="750px"
        >
          <form onSubmit={handleSaveDirectDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: 'rgba(212, 175, 55, 0.08)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid rgba(212, 175, 55, 0.25)', fontSize: '0.82rem', color: '#F3F4F6' }}>
              <strong>{tx("التسليم المباشر:")}</strong> {tx("يتيح تسليم المعدات وتجهيزات السلامة فورياً للعميل دون الحاجة لطلب خدمة مسبق، ويقوم النظام آلياً بتوثيق طلب التوريد، خصم الكميات من المخزون، وإصدار محضر تسليم رسمي.")}
            </div>

            {/* Client & Receiver details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <AdminInput
                label={tx("اسم العميل / المؤسسة الطالبة")}
                required
                value={directDeliveryForm.clientName}
                onChange={(e) => setDirectDeliveryForm({ ...directDeliveryForm, clientName: e.target.value })}
                placeholder="شركة الموانئ / بنك الكريمي / ..."
              />
              <AdminInput
                label={tx("اسم المستلم المعتمد (ممثل العميل)")}
                required
                value={directDeliveryForm.receivedByName}
                onChange={(e) => setDirectDeliveryForm({ ...directDeliveryForm, receivedByName: e.target.value })}
                placeholder="المهندس / أحمد السقاف"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <AdminInput
                label={tx("رقم هاتف المستلم")}
                value={directDeliveryForm.receivedByPhone}
                onChange={(e) => setDirectDeliveryForm({ ...directDeliveryForm, receivedByPhone: e.target.value })}
                placeholder="+967 77..."
              />
              <AdminInput
                label={tx("الصفة / المنصب الوظيفي")}
                value={directDeliveryForm.receivedByRole}
                onChange={(e) => setDirectDeliveryForm({ ...directDeliveryForm, receivedByRole: e.target.value })}
                placeholder="مدير السلامة والأمن الميداني"
              />
            </div>

            <AdminInput
              label={tx("موقع التسليم المعتمد")}
              value={directDeliveryForm.deliveryLocation}
              onChange={(e) => setDirectDeliveryForm({ ...directDeliveryForm, deliveryLocation: e.target.value })}
              placeholder="المقر الرئيسي للعميل - صنعاء"
            />

            {/* Items selection */}
            <div style={{ padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--facss-gold-400)' }}>
                  {tx("المعدات المسلمة والكميات:")}
                </span>
                <AdminButton
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={<Plus size={12} />}
                  onClick={() => {
                    setDirectDeliveryForm({
                      ...directDeliveryForm,
                      items: [
                        ...directDeliveryForm.items,
                        { productId: products[0]?.id || '', quantityDelivered: 1, serialNumbers: '', condition: 'NEW', notes: '' },
                      ],
                    });
                  }}
                >
                  {tx("إضافة بند آخر")}
                </AdminButton>
              </div>

              {directDeliveryForm.items.map((it, idx) => {
                const prod = products.find((p) => p.id === it.productId);
                const avail = prod ? prod.quantityAvailable ?? Math.max(0, prod.quantityOnHand - prod.quantityReserved) : 0;
                const isOverStock = it.quantityDelivered > avail;

                return (
                  <div key={idx} style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', marginBottom: '0.6rem', border: isOverStock ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'block', marginBottom: '0.2rem' }}>
                          {tx("الصنف والمخزون المتاح")}
                        </label>
                        <select
                          className="admin-select"
                          value={it.productId}
                          onChange={(e) => {
                            const newItems = [...directDeliveryForm.items];
                            newItems[idx].productId = e.target.value;
                            setDirectDeliveryForm({ ...directDeliveryForm, items: newItems });
                          }}
                          style={{ width: '100%', height: 'var(--admin-control-height-md)', margin: 0 }}
                        >
                          <option value="">{tx("— اختر الصنف —")}</option>
                          {products.map((p) => {
                            const pAvail = p.quantityAvailable ?? Math.max(0, p.quantityOnHand - p.quantityReserved);
                            return (
                              <option key={p.id} value={p.id}>
                                {p.sku} - {isAr ? p.nameAr : (p.nameEn || p.nameAr)} ({tx("متاح:")} {pAvail})
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'block', marginBottom: '0.2rem' }}>
                          {tx("الكمية المسلمة")}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={avail || 1}
                          className="admin-input"
                          value={it.quantityDelivered}
                          onChange={(e) => {
                            const newItems = [...directDeliveryForm.items];
                            newItems[idx].quantityDelivered = Math.max(1, Number(e.target.value));
                            setDirectDeliveryForm({ ...directDeliveryForm, items: newItems });
                          }}
                          style={{ width: '100%', height: 'var(--admin-control-height-md)' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.78rem', color: '#9CA3AF', display: 'block', marginBottom: '0.2rem' }}>
                          {tx("الحالة الفنية")}
                        </label>
                        <select
                          className="admin-select"
                          value={it.condition}
                          onChange={(e) => {
                            const newItems = [...directDeliveryForm.items];
                            newItems[idx].condition = e.target.value;
                            setDirectDeliveryForm({ ...directDeliveryForm, items: newItems });
                          }}
                          style={{ width: '100%', height: 'var(--admin-control-height-md)', margin: 0 }}
                        >
                          <option value="NEW">{tx("جديد ومعتمد (NEW)")}</option>
                          <option value="MAINTAINED">{tx("تمت معايرته (MAINTAINED)")}</option>
                          <option value="USED_GOOD">{tx("مستعمل بحالة ممتازة")}</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder={tx("الأرقام التسلسلية (اختياري، مفصولة بفواصل)")}
                        className="admin-input"
                        value={it.serialNumbers}
                        onChange={(e) => {
                          const newItems = [...directDeliveryForm.items];
                          newItems[idx].serialNumbers = e.target.value;
                          setDirectDeliveryForm({ ...directDeliveryForm, items: newItems });
                        }}
                        style={{ height: 'var(--admin-control-height-md)', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder={tx("ملاحظات البند")}
                        className="admin-input"
                        value={it.notes}
                        onChange={(e) => {
                          const newItems = [...directDeliveryForm.items];
                          newItems[idx].notes = e.target.value;
                          setDirectDeliveryForm({ ...directDeliveryForm, items: newItems });
                        }}
                        style={{ height: 'var(--admin-control-height-md)', fontSize: '0.8rem' }}
                      />
                      {directDeliveryForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = directDeliveryForm.items.filter((_, i) => i !== idx);
                            setDirectDeliveryForm({ ...directDeliveryForm, items: newItems });
                          }}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.4rem' }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    {isOverStock && (
                      <div style={{ color: '#EF4444', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>
                        {tx("تنبيه: الكمية المطلوبة ({0}) تتجاوز المخزون المتاح حالياً ({1})", it.quantityDelivered, avail)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <AdminTextarea
              label={tx("ملاحظات إضافية على محضر التسليم")}
              value={directDeliveryForm.notes}
              onChange={(e) => setDirectDeliveryForm({ ...directDeliveryForm, notes: e.target.value })}
              placeholder="شروط الضمان أو بنود الاستخدام المعتمدة..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <AdminButton variant="outline" onClick={() => setShowDirectDeliveryModal(false)}>
                {tx("إلغاء")}
              </AdminButton>
              <AdminButton variant="primary" type="submit">
                {tx("إصدار محضر التسليم وخصم المخزون")}
              </AdminButton>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
