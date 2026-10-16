import { vMsg, resolveLocale, ValidationLocale } from './common';

export const VALID_ALERT_SEVERITIES = [
  'INFORMATIONAL',
  'ADVISORY_WATCH',
  'WARNING_HIGH',
  'CRITICAL_FLASH',
] as const;

export type AlertSeverityType = typeof VALID_ALERT_SEVERITIES[number];

export const VALID_ALERT_TIERS = [
  'REDACTED_OPERATIONAL_BRIEFING',
  'EXECUTIVE_FLASH_SUMMARY',
] as const;

export type AlertTierType = typeof VALID_ALERT_TIERS[number];

export interface AlertDraftInput {
  incidentId: string;
  severity: AlertSeverityType;
  titleAr: string;
  titleEn?: string | null;
  bodyAr: string;
  bodyEn?: string | null;
  executiveTitleAr?: string | null;
  executiveSummaryAr?: string | null;
  movementAdviceAr?: string | null;
  movementAdviceEn?: string | null;
  targetGovernorate: string;
  targetDistricts: string[];
  isPrecautionary?: boolean;
}

export interface SensitiveOriginalLeakContext {
  sourceName?: string | null;
  sourcePhone?: string | null;
  sourceContactPhone?: string | null;
  exactLatitude?: number | null;
  exactLongitude?: number | null;
  exactLocationDesc?: string | null;
  rawDescription?: string | null;
}

/**
 * Validates alert draft inputs and runs anti-leakage checks against decrypted original.
 */
export function validateAlertDraftInput(
  input: any,
  sensitiveContext?: SensitiveOriginalLeakContext | null,
  locale?: string
): { isValid: boolean; errors: string[]; sanitizedData?: AlertDraftInput } {
  const errors: string[] = [];
  const loc: ValidationLocale = resolveLocale(locale, input);

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: [vMsg('بيانات التنبيه غير صالحة', 'Invalid alert data', loc)] };
  }

  if (!input.incidentId || typeof input.incidentId !== 'string') {
    errors.push(vMsg('معرّف البلاغ الأصلي مطلوب لربط التنبيه به', 'Original incident ID is required to link the alert', loc));
  }

  if (!VALID_ALERT_SEVERITIES.includes(input.severity)) {
    errors.push(
      vMsg(
        `مستوى خطورة التنبيه غير صالح. المستويات المقبولة: ${VALID_ALERT_SEVERITIES.join(', ')}`,
        `Invalid alert severity level. Accepted levels: ${VALID_ALERT_SEVERITIES.join(', ')}`,
        loc
      )
    );
  }

  // Tier 1: Redacted Operational Briefing
  if (!input.titleAr || typeof input.titleAr !== 'string' || input.titleAr.trim().length < 5) {
    errors.push(
      vMsg(
        'عنوان الإحاطة التشغيلية (المستوى الأول) مطلوب ويجب ألا يقل عن 5 أحرف',
        'Operational briefing title (Tier 1) is required (minimum 5 characters)',
        loc
      )
    );
  }

  if (!input.bodyAr || typeof input.bodyAr !== 'string' || input.bodyAr.trim().length < 15) {
    errors.push(
      vMsg(
        'نص الإحاطة التشغيلية المنقحة (المستوى الأول) مطلوب ويجب ألا يقل عن 15 حرفاً',
        'Redacted operational briefing body (Tier 1) is required (minimum 15 characters)',
        loc
      )
    );
  }

  // Tier 2: Executive Flash Summary
  if (!input.executiveTitleAr || typeof input.executiveTitleAr !== 'string' || input.executiveTitleAr.trim().length < 5) {
    errors.push(
      vMsg(
        'عنوان الملخص التنسيقي الموجز (المستوى الثاني) مطلوب ويجب ألا يقل عن 5 أحرف',
        'Executive flash summary title (Tier 2) is required (minimum 5 characters)',
        loc
      )
    );
  }

  if (!input.executiveSummaryAr || typeof input.executiveSummaryAr !== 'string' || input.executiveSummaryAr.trim().length < 15) {
    errors.push(
      vMsg(
        'نص الملخص التنسيقي الموجز (المستوى الثاني) مطلوب كنص مستقل ويجب ألا يقل عن 15 حرفاً',
        'Executive flash summary body (Tier 2) is required (minimum 15 characters)',
        loc
      )
    );
  }

  if (!input.targetGovernorate || typeof input.targetGovernorate !== 'string' || input.targetGovernorate.trim().length < 2) {
    errors.push(vMsg('المحافظة المستهدفة مطلوبة', 'Target governorate is required', loc));
  }

  let districts: string[] = [];
  if (Array.isArray(input.targetDistricts)) {
    districts = input.targetDistricts.map((d: any) => String(d).trim()).filter(Boolean);
  } else if (typeof input.targetDistricts === 'string') {
    try {
      const parsed = JSON.parse(input.targetDistricts);
      if (Array.isArray(parsed)) {
        districts = parsed.map((d: any) => String(d).trim()).filter(Boolean);
      }
    } catch {
      districts = [input.targetDistricts.trim()];
    }
  }

  if (districts.length === 0) {
    errors.push(
      vMsg(
        'يجب تحديد مديرية أو نطاق جغرافي مستهدف واحد على الأقل',
        'At least one target district or geographic area must be specified',
        loc
      )
    );
  }

  // Anti-Leakage Guard
  if (sensitiveContext) {
    const combinedTexts = [
      input.titleAr,
      input.bodyAr,
      input.executiveTitleAr,
      input.executiveSummaryAr,
      input.movementAdviceAr,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    // Source name
    if (sensitiveContext.sourceName && sensitiveContext.sourceName.trim().length > 2) {
      const src = sensitiveContext.sourceName.trim().toLowerCase();
      if (combinedTexts.includes(src)) {
        errors.push(
          vMsg(
            `فحص التسريب الأمني: تم اكتشاف تسرب لاسم المصدر الحساس [${sensitiveContext.sourceName}] داخل نصوص التنبيه!`,
            `Security Anti-Leak Guard: Sensitive source name [${sensitiveContext.sourceName}] detected in alert text!`,
            loc
          )
        );
      }
    }

    // Source phone
    const phoneVal = sensitiveContext.sourcePhone || sensitiveContext.sourceContactPhone;
    if (phoneVal && phoneVal.trim().length > 5) {
      const phoneDigits = phoneVal.trim().replace(/[\s+-]/g, '');
      const cleanCombined = combinedTexts.replace(/[\s+-]/g, '');
      if (cleanCombined.includes(phoneDigits) || cleanCombined.includes(phoneDigits.slice(-7))) {
        errors.push(
          vMsg(
            'فحص التسريب الأمني: تم اكتشاف تسرب لرقم هاتف المصدر داخل نصوص التنبيه!',
            'Security Anti-Leak Guard: Source contact phone number detected in alert text!',
            loc
          )
        );
      }
    }

    // Exact Coordinates
    if (sensitiveContext.exactLatitude && sensitiveContext.exactLongitude) {
      const latStr = sensitiveContext.exactLatitude.toFixed(3);
      const lngStr = sensitiveContext.exactLongitude.toFixed(3);
      if (combinedTexts.includes(latStr) || combinedTexts.includes(lngStr)) {
        errors.push(
          vMsg(
            'فحص التسريب الأمني: تم اكتشاف تسرب للإحداثيات الدقيقة للحدث داخل نصوص التنبيه!',
            'Security Anti-Leak Guard: Exact event coordinates detected in alert text!',
            loc
          )
        );
      }
    }

    // Exact location description
    if (sensitiveContext.exactLocationDesc && sensitiveContext.exactLocationDesc.trim().length > 6) {
      const locText = sensitiveContext.exactLocationDesc.trim().toLowerCase();
      if (combinedTexts.includes(locText)) {
        errors.push(
          vMsg(
            `فحص التسريب الأمني: تم اكتشاف تسرب للوصف الجغرافي الدقيق [${sensitiveContext.exactLocationDesc}] داخل نصوص التنبيه!`,
            `Security Anti-Leak Guard: Exact location landmark description [${sensitiveContext.exactLocationDesc}] detected in alert text!`,
            loc
          )
        );
      }
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitizedData: {
      incidentId: input.incidentId.trim(),
      severity: input.severity,
      titleAr: input.titleAr.trim(),
      titleEn: input.titleEn ? String(input.titleEn).trim() : null,
      bodyAr: input.bodyAr.trim(),
      bodyEn: input.bodyEn ? String(input.bodyEn).trim() : null,
      executiveTitleAr: input.executiveTitleAr.trim(),
      executiveSummaryAr: input.executiveSummaryAr.trim(),
      movementAdviceAr: input.movementAdviceAr ? String(input.movementAdviceAr).trim() : null,
      movementAdviceEn: input.movementAdviceEn ? String(input.movementAdviceEn).trim() : null,
      targetGovernorate: input.targetGovernorate.trim(),
      targetDistricts: districts,
      isPrecautionary: Boolean(input.isPrecautionary),
    },
  };
}

export interface RecipientSelectionInput {
  recipientUserId: string;
  alertTier: AlertTierType;
}

/**
 * Validates recipient selection input list.
 */
export function validateAlertRecipientsInput(
  recipients: any,
  locale?: string
): { isValid: boolean; errors: string[]; sanitizedRecipients?: RecipientSelectionInput[] } {
  const errors: string[] = [];
  const loc: ValidationLocale = resolveLocale(locale);

  if (!Array.isArray(recipients) || recipients.length === 0) {
    return {
      isValid: false,
      errors: [vMsg('يجب تحديد قائمة مستلمين واحدة على الأقل للتنبيه', 'At least one recipient must be selected for the alert', loc)],
    };
  }

  const seenUsers = new Set<string>();
  const sanitized: RecipientSelectionInput[] = [];

  for (let i = 0; i < recipients.length; i++) {
    const item = recipients[i];
    if (!item || typeof item !== 'object') {
      errors.push(
        vMsg(
          `العنصر رقم ${i + 1} في قائمة المستلمين غير صالح`,
          `Item #${i + 1} in recipient list is invalid`,
          loc
        )
      );
      continue;
    }

    if (!item.recipientUserId || typeof item.recipientUserId !== 'string') {
      errors.push(
        vMsg(
          `معرف المستلم في العنصر رقم ${i + 1} مفقود`,
          `Recipient ID is missing in item #${i + 1}`,
          loc
        )
      );
      continue;
    }

    if (seenUsers.has(item.recipientUserId)) {
      errors.push(
        vMsg(
          `المستخدم [${item.recipientUserId}] مكرر في قائمة المستلمين`,
          `User [${item.recipientUserId}] is duplicated in recipient list`,
          loc
        )
      );
      continue;
    }
    seenUsers.add(item.recipientUserId);

    if (!VALID_ALERT_TIERS.includes(item.alertTier)) {
      errors.push(
        vMsg(
          `مستوى المحتوى المحدد للمستخدم [${item.recipientUserId}] غير صالح (${item.alertTier})`,
          `Content tier specified for user [${item.recipientUserId}] is invalid (${item.alertTier})`,
          loc
        )
      );
      continue;
    }

    sanitized.push({
      recipientUserId: item.recipientUserId.trim(),
      alertTier: item.alertTier,
    });
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [], sanitizedRecipients: sanitized };
}
