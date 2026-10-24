import prisma from '@/lib/prisma';
import { logActivity } from '@/lib/audit';

export interface DynamicOptionItem {
  id: string;
  labelAr: string;
  labelEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  isActive: boolean;
  order: number;
}

export interface DynamicGovernorateItem {
  id: string;
  ar: string;
  en: string;
  isActive: boolean;
  order: number;
}

// ----------------------------------------------------
// DEFAULT INCIDENT CATEGORIES (Fallback & Seed)
// ----------------------------------------------------
export const DEFAULT_INCIDENT_CATEGORIES: DynamicOptionItem[] = [
  {
    id: 'THEFT',
    labelAr: 'سرقة واختلاس وخسائر مادية',
    labelEn: 'Theft, Embezzlement & Asset Loss',
    descriptionAr: 'سرقة ممتلكات، اختفاء عهد، تسلل لمستودعات',
    descriptionEn: 'Stolen assets, missing inventory, warehouse infiltration',
    icon: 'Lock',
    isActive: true,
    order: 1,
  },
  {
    id: 'INTRUSION',
    labelAr: 'اقتحام وتسلل واختراق أمني',
    labelEn: 'Intrusion & Security Breach',
    descriptionAr: 'تسلق أسوار، كسر أقفال، دخول غير مصرح لمواقع محمية',
    descriptionEn: 'Perimeter scaling, broken locks, unauthorized zone entry',
    icon: 'ShieldAlert',
    isActive: true,
    order: 2,
  },
  {
    id: 'FIRE',
    labelAr: 'حريق واشتعال مواد ومخاطر حرارية',
    labelEn: 'Fire & Combustion Incident',
    descriptionAr: 'اندلاع نيران، ماس كهربائي، دخان كثيف، اشتعال مواد',
    descriptionEn: 'Open flames, electrical short, heavy smoke, hazardous fire',
    icon: 'Flame',
    isActive: true,
    order: 3,
  },
  {
    id: 'INJURY',
    labelAr: 'إصابة عمل وحالات طارئة بشرية',
    labelEn: 'Physical Injury & Medical Emergency',
    descriptionAr: 'سقوط، حروق، إصابة حارس أو موظف أثناء الخدمة',
    descriptionEn: 'Falls, burns, guard/staff injury during service',
    icon: 'Activity',
    isActive: true,
    order: 4,
  },
  {
    id: 'SAFETY_INCIDENT',
    labelAr: 'حادث سلامة مهنية وخلل وقائي',
    labelEn: 'Occupational Safety & Hazardous Condition',
    descriptionAr: 'تسرب غاز، انهيار سقايل، خطر بيئي في موقع العمل',
    descriptionEn: 'Gas leak, scaffolding collapse, site hazard',
    icon: 'AlertTriangle',
    isActive: true,
    order: 5,
  },
  {
    id: 'VEHICLE_INCIDENT',
    labelAr: 'حادث مركبة أو تلفيات نقل',
    labelEn: 'Vehicle & Transport Incident',
    descriptionAr: 'اصطدام دورية، انقلاب، عطل طارئ لمركبة أثناء النقل',
    descriptionEn: 'Patrol collision, rollover, vehicle breakdown during transit',
    icon: 'Truck',
    isActive: true,
    order: 6,
  },
  {
    id: 'SECURITY_THREAT',
    labelAr: 'تهديد أمني واشتباه مباشر',
    labelEn: 'Security Threat & Suspicious Activity',
    descriptionAr: 'أجسام مشبوهة، رصد مراقبة معادية، تهديد لفظي أو مسلح',
    descriptionEn: 'Suspicious objects, hostile surveillance, verbal/armed threat',
    icon: 'Shield',
    isActive: true,
    order: 7,
  },
  {
    id: 'ARMED_CONFLICT_TACTICAL',
    labelAr: 'نزاع مسلح وتطورات تكتيكية',
    labelEn: 'Armed Conflict & Tactical Escalation',
    descriptionAr: 'اشتباكات، تحركات عسكرية، قصف، استهداف مباشر',
    descriptionEn: 'Clashes, troop movements, shelling, direct targeting',
    icon: 'Crosshair',
    isActive: true,
    order: 8,
  },
  {
    id: 'HUMANITARIAN_ACCESS_DENIAL',
    labelAr: 'إعاقة وصول إنساني وإغاثي',
    labelEn: 'Humanitarian Access Denial',
    descriptionAr: 'منع قوافل، رفض تصاريح، احتجاز إمدادات',
    descriptionEn: 'Convoy blockage, permit rejection, supply detention',
    icon: 'Ban',
    isActive: true,
    order: 9,
  },
  {
    id: 'PHYSICAL_ATTACK_THREAT',
    labelAr: 'اعتداء وتهديد أمني مباشر',
    labelEn: 'Physical Assault & Direct Threat',
    descriptionAr: 'تهديد طواقم، سطو مسلح، استهداف مقرات',
    descriptionEn: 'Staff intimidation, armed robbery, facility targeting',
    icon: 'Zap',
    isActive: true,
    order: 10,
  },
  {
    id: 'UXO_LANDMINE_HAZARD',
    labelAr: 'مخاطر ألغام ومخلفات حرب غير منفجرة',
    labelEn: 'UXO & Landmine Hazards',
    descriptionAr: 'حقول ألغام جديدة، ذخائر غير منفجرة، شراك',
    descriptionEn: 'New minefields, unexploded ordnance, booby traps',
    icon: 'AlertOctagon',
    isActive: true,
    order: 11,
  },
  {
    id: 'CIVIL_UNREST_ROADBLOCK',
    labelAr: 'اضطرابات مدنية وقطع طرقات',
    labelEn: 'Civil Unrest & Roadblocks',
    descriptionAr: 'قطع خطوط الإمداد، احتجاجات مسلحة، إغلاق معابر',
    descriptionEn: 'Supply line blockages, armed protests, checkpoint closure',
    icon: 'TrafficCone',
    isActive: true,
    order: 12,
  },
  {
    id: 'DETENTION_HARASSMENT',
    labelAr: 'احتجاز ومضايقات وتوقيف',
    labelEn: 'Detention, Harassment & Stoppage',
    descriptionAr: 'توقيف عند نقاط تفتيش، استجواب، سحب وثائق',
    descriptionEn: 'Checkpoint detention, interrogation, document confiscation',
    icon: 'UserX',
    isActive: true,
    order: 13,
  },
  {
    id: 'NATURAL_DISASTER_ENVIRONMENTAL',
    labelAr: 'كوارث ومخاطر بيئية وطبيعية',
    labelEn: 'Natural & Environmental Hazards',
    descriptionAr: 'سيول، انهيارات جبلية، انقطاع مسارات الحركة',
    descriptionEn: 'Flash floods, landslides, transport route disruption',
    icon: 'CloudRain',
    isActive: true,
    order: 14,
  },
];

// ----------------------------------------------------
// DEFAULT SOURCE TYPES (Fallback & Seed)
// ----------------------------------------------------
export const DEFAULT_SOURCE_TYPES: DynamicOptionItem[] = [
  {
    id: 'FIELD_FOCAL_POINT',
    labelAr: 'نقطة اتصال ميدانية للمركز (Focal Point)',
    labelEn: 'Field Focal Point',
    isActive: true,
    order: 1,
  },
  {
    id: 'FIELD_STAFF',
    labelAr: 'كادر أو باحث ميداني تابع للمركز',
    labelEn: 'Center Field Staff / Researcher',
    isActive: true,
    order: 2,
  },
  {
    id: 'EYEWITNESS',
    labelAr: 'شاهد عيان مباشر من موقع الحدث',
    labelEn: 'Direct Eyewitness',
    isActive: true,
    order: 3,
  },
  {
    id: 'COMMUNITY_LEADER',
    labelAr: 'مصدر محلي / شخصية اعتبارية موثوقة',
    labelEn: 'Local / Community Source',
    isActive: true,
    order: 4,
  },
  {
    id: 'SECURITY_GUARD',
    labelAr: 'فرد حراسة أمنية موقعي',
    labelEn: 'On-site Security Guard',
    isActive: true,
    order: 5,
  },
  {
    id: 'CLIENT_REPRESENTATIVE',
    labelAr: 'ممثل المنشأة / العميل المستفيد',
    labelEn: 'Client / Beneficiary Representative',
    isActive: true,
    order: 6,
  },
  {
    id: 'OTHER',
    labelAr: 'مصدر آخر غير مصنف',
    labelEn: 'Other Unclassified Source',
    isActive: true,
    order: 7,
  },
];

// ----------------------------------------------------
// DEFAULT OPERATIONAL RISK CATEGORIES (Fallback & Seed)
// ----------------------------------------------------
export const DEFAULT_RISK_CATEGORIES: DynamicOptionItem[] = [
  {
    id: 'ARMED_CONFLICT_SECURITY',
    labelAr: 'مخاطر أمنية واشتباكات ونزاع مسلح',
    labelEn: 'Security & Armed Conflict Risks',
    isActive: true,
    order: 1,
  },
  {
    id: 'ACCESS_ROADBLOCK_DENIAL',
    labelAr: 'مخاطر إعاقة الوصول وقطع مسارات الحركة',
    labelEn: 'Access Denial & Roadblock Risks',
    isActive: true,
    order: 2,
  },
  {
    id: 'EXPLOSIVE_HAZARD_UXO',
    labelAr: 'مخاطر الذخائر المتفجرة والألغام',
    labelEn: 'Explosive Hazards & Landmines',
    isActive: true,
    order: 3,
  },
  {
    id: 'CRIMINALITY_THEFT',
    labelAr: 'مخاطر الجريمة والسطو والسرقة',
    labelEn: 'Criminality, Robbery & Theft',
    isActive: true,
    order: 4,
  },
  {
    id: 'STAFF_DETENTION_THREAT',
    labelAr: 'مخاطر احتجاز وتهديد الطواقم والكوادر',
    labelEn: 'Staff Detention & Threat Risks',
    isActive: true,
    order: 5,
  },
  {
    id: 'FACILITY_DAMAGE',
    labelAr: 'مخاطر أضرار المنشآت والمرافق',
    labelEn: 'Facility & Infrastructure Damage',
    isActive: true,
    order: 6,
  },
  {
    id: 'ENVIRONMENTAL_NATURAL',
    labelAr: 'مخاطر طبيعية وبيئية ومناخية',
    labelEn: 'Natural & Environmental Hazards',
    isActive: true,
    order: 7,
  },
  {
    id: 'HEALTH_SAFETY',
    labelAr: 'مخاطر الصحة والسلامة المهنية الميدانية',
    labelEn: 'Occupational Health & Safety',
    isActive: true,
    order: 8,
  },
];

// ----------------------------------------------------
// DEFAULT GOVERNORATES (Fallback & Seed)
// ----------------------------------------------------
export const DEFAULT_GOVERNORATES: DynamicGovernorateItem[] = [
  { id: 'aden', ar: 'عدن', en: 'Aden', isActive: true, order: 1 },
  { id: 'lahj', ar: 'لحج', en: 'Lahj', isActive: true, order: 2 },
  { id: 'abyan', ar: 'أبين', en: 'Abyan', isActive: true, order: 3 },
  { id: 'dhalee', ar: 'الضالع', en: "Al Dhale'e", isActive: true, order: 4 },
  { id: 'shabwah', ar: 'شبوة', en: 'Shabwah', isActive: true, order: 5 },
  { id: 'hadramawt_coast', ar: 'حضرموت (الساحل)', en: 'Hadramawt (Coast)', isActive: true, order: 6 },
  { id: 'hadramawt_valley', ar: 'حضرموت (الوادي)', en: 'Hadramawt (Valley)', isActive: true, order: 7 },
  { id: 'al_mahrah', ar: 'المهرة', en: 'Al Mahrah', isActive: true, order: 8 },
  { id: 'socotra', ar: 'سقطرى', en: 'Socotra', isActive: true, order: 9 },
  { id: 'taiz', ar: 'تعز', en: 'Taiz', isActive: true, order: 10 },
  { id: 'al_hudaydah', ar: 'الحديدة', en: 'Al Hudaydah', isActive: true, order: 11 },
  { id: 'marib', ar: 'مأرب', en: 'Marib', isActive: true, order: 12 },
  { id: 'al_jawf', ar: 'الجوف', en: 'Al Jawf', isActive: true, order: 13 },
  { id: 'other', ar: 'أخرى', en: 'Other', isActive: true, order: 14 },
];

export const DYNAMIC_KEYS = {
  INCIDENT_CATEGORIES: 'FIELD_INCIDENT_CATEGORIES',
  SOURCE_TYPES: 'FIELD_SOURCE_TYPES',
  RISK_CATEGORIES: 'OPERATIONAL_RISK_CATEGORIES',
  GOVERNORATES: 'FIELD_GOVERNORATES',
} as const;

/**
 * Loads a JSON setting with strict fallback to default options.
 */
async function loadDynamicSetting<T>(key: string, defaultVal: T): Promise<T> {
  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key },
    });
    if (record && record.value) {
      const parsed = JSON.parse(record.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as T;
      }
    }
  } catch (err) {
    console.error(`Failed to load dynamic setting [${key}], falling back to defaults:`, err);
  }
  return defaultVal;
}

/**
 * Returns active Incident Categories ordered for display.
 */
export async function getDynamicIncidentCategories(onlyActive = true): Promise<DynamicOptionItem[]> {
  const items = await loadDynamicSetting<DynamicOptionItem[]>(
    DYNAMIC_KEYS.INCIDENT_CATEGORIES,
    DEFAULT_INCIDENT_CATEGORIES
  );
  return items
    .filter((it) => (onlyActive ? it.isActive : true))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Returns active Source Types ordered for display.
 */
export async function getDynamicSourceTypes(onlyActive = true): Promise<DynamicOptionItem[]> {
  const items = await loadDynamicSetting<DynamicOptionItem[]>(
    DYNAMIC_KEYS.SOURCE_TYPES,
    DEFAULT_SOURCE_TYPES
  );
  return items
    .filter((it) => (onlyActive ? it.isActive : true))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Returns active Risk Categories ordered for display.
 */
export async function getDynamicRiskCategories(onlyActive = true): Promise<DynamicOptionItem[]> {
  const items = await loadDynamicSetting<DynamicOptionItem[]>(
    DYNAMIC_KEYS.RISK_CATEGORIES,
    DEFAULT_RISK_CATEGORIES
  );
  return items
    .filter((it) => (onlyActive ? it.isActive : true))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Returns active Governorates ordered for display.
 */
export async function getDynamicGovernorates(onlyActive = true): Promise<DynamicGovernorateItem[]> {
  const items = await loadDynamicSetting<DynamicGovernorateItem[]>(
    DYNAMIC_KEYS.GOVERNORATES,
    DEFAULT_GOVERNORATES
  );
  return items
    .filter((it) => (onlyActive ? it.isActive : true))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Returns all dynamic options in a consolidated object (active only or all for admin).
 */
export async function getAllDynamicOptions(onlyActive = true) {
  const [incidentCategories, sourceTypes, riskCategories, governorates] = await Promise.all([
    getDynamicIncidentCategories(onlyActive),
    getDynamicSourceTypes(onlyActive),
    getDynamicRiskCategories(onlyActive),
    getDynamicGovernorates(onlyActive),
  ]);

  return {
    incidentCategories,
    sourceTypes,
    riskCategories,
    governorates,
  };
}

/**
 * Saves a dynamic option array to SystemSetting with audit trail.
 */
export async function saveDynamicOptions(
  key: string,
  items: any[],
  userSession?: { userId?: string; fullName?: string }
) {
  if (!Object.values(DYNAMIC_KEYS).includes(key as any)) {
    throw new Error(`مفتاح الحقل الديناميكي [${key}] غير معتمد`);
  }

  if (!Array.isArray(items)) {
    throw new Error('يجب إرسال عناصر الخيارات كمصفوفة صالحة');
  }

  const jsonValue = JSON.stringify(items);

  const updated = await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: jsonValue,
      category: 'OPERATIONS',
    },
    update: {
      value: jsonValue,
      category: 'OPERATIONS',
    },
  });

  if (userSession?.userId) {
    await logActivity({
      userId: userSession.userId,
      userName: userSession.fullName || 'Admin',
      action: 'UPDATE_DYNAMIC_FIELD_OPTIONS',
      entityType: 'SystemSetting',
      entityId: updated.id,
      details: `تحديث خيارات الحقل الديناميكي [${key}] بإجمالي (${items.length}) خيار`,
    });
  }

  return updated;
}
