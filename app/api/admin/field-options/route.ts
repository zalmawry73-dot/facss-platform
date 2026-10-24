import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import {
  getAllDynamicOptions,
  saveDynamicOptions,
  DYNAMIC_KEYS,
  DEFAULT_INCIDENT_CATEGORIES,
  DEFAULT_SOURCE_TYPES,
  DEFAULT_RISK_CATEGORIES,
  DEFAULT_GOVERNORATES,
} from '@/lib/dynamic-field-options';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_SETTINGS);
    if (!gate.authorized) return gate.response!;

    const options = await getAllDynamicOptions(false); // return all (active + inactive)
    return NextResponse.json({
      success: true,
      ...options,
      keys: DYNAMIC_KEYS,
    });
  } catch (error: any) {
    console.error('Error fetching admin field options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_SETTINGS);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const { key, items, resetToDefault } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'مفتاح الإعداد مطلوب' }, { status: 400 });
    }

    let itemsToSave = items;

    if (resetToDefault) {
      if (key === DYNAMIC_KEYS.INCIDENT_CATEGORIES) itemsToSave = DEFAULT_INCIDENT_CATEGORIES;
      else if (key === DYNAMIC_KEYS.SOURCE_TYPES) itemsToSave = DEFAULT_SOURCE_TYPES;
      else if (key === DYNAMIC_KEYS.RISK_CATEGORIES) itemsToSave = DEFAULT_RISK_CATEGORIES;
      else if (key === DYNAMIC_KEYS.GOVERNORATES) itemsToSave = DEFAULT_GOVERNORATES;
      else {
        return NextResponse.json({ error: 'المفتاح غير صالح لإعادة الضبط' }, { status: 400 });
      }
    }

    if (!Array.isArray(itemsToSave)) {
      return NextResponse.json(
        { error: 'يجب إرسال عناصر الخيارات كمصفوفة صالحة' },
        { status: 400 }
      );
    }

    const updated = await saveDynamicOptions(key, itemsToSave, {
      userId: session?.userId,
      fullName: session?.fullName,
    });

    return NextResponse.json({
      success: true,
      message: 'تم تحديث خيارات الحقول الديناميكية بنجاح',
      setting: updated,
    });
  } catch (error: any) {
    console.error('Error updating admin field options:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
