import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { canAccessOriginalIncident, ROLES } from '@/lib/rbac';
import { decryptIncidentOriginalPayload } from '@/lib/security/crypto';
import { logActivity } from '@/lib/audit';

interface RouteContext {
  params: { id: string };
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const session = await getCurrentUser(true);

    // Strict Gate: STRICTLY SUPER_ADMIN ONLY
    const gate = canAccessOriginalIncident(session);
    if (!gate.authorized) {
      return NextResponse.json(
        { error: gate.error || 'غير مصرح: أصل البلاغ الحساس محصور بمسؤولي الإدارة العليا (SUPER_ADMIN) حصراً' },
        { status: gate.status || 403 }
      );
    }

    // Double check active status in DB
    const dbAdmin = await prisma.user.findUnique({
      where: { id: session!.userId },
      select: { id: true, role: true, isActive: true },
    });

    if (!dbAdmin || !dbAdmin.isActive || dbAdmin.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'غير مصرح: الحساب غير نشط أو فقد رتبة الإدارة العليا' },
        { status: 403 }
      );
    }

    // Fetch encrypted original record
    const originalRecord = await prisma.incidentOriginal.findUnique({
      where: { incidentId: params.id },
      include: {
        incident: {
          select: { id: true, incidentNumber: true, governorate: true },
        },
      },
    });

    if (!originalRecord) {
      return NextResponse.json({ error: 'أصل البلاغ غير متوفر أو لم يُسجل' }, { status: 404 });
    }

    // Decrypt all sensitive fields using AES-256-GCM engine
    const decrypted = decryptIncidentOriginalPayload({
      sourceType: originalRecord.sourceType,
      sourceNameEnc: originalRecord.sourceNameEnc,
      sourcePhoneEnc: originalRecord.sourcePhoneEnc,
      sourceOrgEnc: originalRecord.sourceOrgEnc,
      rawDescriptionEnc: originalRecord.rawDescriptionEnc,
      exactLocationEnc: originalRecord.exactLocationEnc,
      exactLatEnc: originalRecord.exactLatEnc,
      exactLngEnc: originalRecord.exactLngEnc,
      initialRiskNotesEnc: originalRecord.initialRiskNotesEnc,
    });

    // Audit log: Log reading of sensitive original (WITHOUT leaking plaintext into logs)
    await logActivity({
      userId: session!.userId,
      userName: session!.fullName,
      action: 'READ_INCIDENT_ORIGINAL',
      entityType: 'IncidentOriginal',
      entityId: originalRecord.id,
      details: `اطلاع الإدارة العليا وفك تشفير أصل البلاغ الحساس [${originalRecord.incident.incidentNumber}]`,
    });

    return NextResponse.json({
      success: true,
      original: {
        id: originalRecord.id,
        incidentId: originalRecord.incidentId,
        sourceType: decrypted.sourceType,
        sourceName: decrypted.sourceName,
        sourcePhone: decrypted.sourceContactPhone,
        sourceOrganization: decrypted.sourceOrganization,
        exactLocationDesc: decrypted.exactLocationDesc,
        exactLatitude: decrypted.exactLatitude,
        exactLongitude: decrypted.exactLongitude,
        rawDescription: decrypted.rawDescription,
        initialRiskNotes: decrypted.initialRiskNotes,
        createdAt: originalRecord.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
