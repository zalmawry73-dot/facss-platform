import prisma from './prisma';
import { ALLOWED_SETTING_KEYS } from './validations/admin';

export interface PublicSettings {
  OFFICIAL_PHONE: string;
  WHATSAPP_PHONE: string;
  OFFICIAL_EMAIL: string;
  OPERATIONS_EMAIL: string;
  TRAINING_EMAIL: string;
  OFFICIAL_ADDRESS: string;
  WORKING_HOURS: string;
  SOCIAL_TWITTER: string;
  SOCIAL_LINKEDIN: string;
  SOCIAL_FACEBOOK: string;
  ANNOUNCEMENT_TEXT: string;
}

const DEFAULT_SETTINGS: PublicSettings = {
  OFFICIAL_PHONE: '+967 2 245 800',
  WHATSAPP_PHONE: '',
  OFFICIAL_EMAIL: 'info@facss-aden.com',
  OPERATIONS_EMAIL: 'services@facss-aden.com',
  TRAINING_EMAIL: 'training@facss-aden.com',
  OFFICIAL_ADDRESS: 'العاصمة عدن - خور مكسر - حي السفارات',
  WORKING_HOURS: 'الأحد - الخميس: 8:00 صباحاً - 4:00 مساءً (استجابة عملياتية ميدانية على مدار الساعة)',
  SOCIAL_TWITTER: '',
  SOCIAL_LINKEDIN: '',
  SOCIAL_FACEBOOK: '',
  ANNOUNCEMENT_TEXT: 'مركز عدن الأول للخدمات الأمنية والدراسات الاستراتيجية — منظومة أمنية متكاملة تُرسي مفهوم الوقاية قبل الاستجابة',
};

/**
 * Safely fetches public institutional settings from the database.
 * Falls back to default values if records do not exist yet.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const records = await prisma.systemSetting.findMany({
      where: {
        key: { in: [...ALLOWED_SETTING_KEYS] },
      },
    });

    const result = { ...DEFAULT_SETTINGS };
    for (const record of records) {
      if (record.key in result && record.value) {
        (result as any)[record.key] = record.value;
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return DEFAULT_SETTINGS;
  }
}
