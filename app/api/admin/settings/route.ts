import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateSettingUpdate, ALLOWED_SETTING_KEYS } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

function getCategoryForKey(key: string): string {
  if (key.startsWith('SOCIAL_')) return 'SOCIAL';
  if (['OFFICIAL_PHONE', 'WHATSAPP_PHONE', 'OFFICIAL_EMAIL', 'OPERATIONS_EMAIL', 'TRAINING_EMAIL', 'OFFICIAL_ADDRESS'].includes(key)) {
    return 'CONTACT';
  }
  return 'GENERAL';
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_SETTINGS);
    if (!gate.authorized) return gate.response!;

    // Whitelist only: Never fetch or return secret/config keys
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: [...ALLOWED_SETTING_KEYS] },
      },
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({
      success: true,
      settings,
      allowedKeys: ALLOWED_SETTING_KEYS,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_SETTINGS);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateSettingUpdate(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الإعداد غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { key, value } = validation.data;
    const category = getCategoryForKey(key);

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value, category },
      update: { value, category },
    });

    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'UPDATE_SYSTEM_SETTING',
      entityType: 'SystemSetting',
      entityId: setting.id,
      details: `تحديث الإعداد التشغيلي [${key}] بقيمة جديدة`,
    });

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
