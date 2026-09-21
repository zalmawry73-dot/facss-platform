import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, ROLES, getUserCapabilities } from '@/lib/rbac';
import { validateIncidentIntake } from '@/lib/validations/incidents';
import { encryptIncidentOriginalPayload } from '@/lib/security/crypto';
import {
  validateAttachmentFile,
  saveIncidentAttachmentToDisk,
} from '@/lib/storage/incident-attachments';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await getCurrentUser(true);
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'غير مصرح: يلزم تسجيل الدخول لتقديم البلاغ الميداني' },
        { status: 401 }
      );
    }

    // Verify user is active in DB
    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json(
        { error: 'الحساب معطل أو غير نشط. يرجى مراجعة إدارة المركز.' },
        { status: 403 }
      );
    }

    // 2. Authorize role and capability
    // Allowed: SUPER_ADMIN, or anyone possessing submit_incident
    const userCaps = await getUserCapabilities(session.userId, session.role);
    const canSubmit = session.role === ROLES.SUPER_ADMIN || userCaps.includes(CAPABILITIES.SUBMIT_INCIDENT);

    if (!canSubmit) {
      return NextResponse.json(
        { error: 'غير مصرح: الحساب لا يملك الصلاحية المعتمدة لتقديم البلاغات الميدانية (submit_incident)' },
        { status: 403 }
      );
    }

    // Hard deny for CLIENT and TRAINEE even if somehow requested
    if (session.role === ROLES.CLIENT || session.role === ROLES.TRAINEE) {
      return NextResponse.json(
        { error: 'بوابات المستفيدين والعملاء غير مخولة بتقديم البلاغات الميدانية الحساسة' },
        { status: 403 }
      );
    }

    // 3. Parse and validate body
    const body = await request.json().catch(() => ({}));
    const validation = validateIncidentIntake(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات البلاغ غير مكتملة أو غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const input = validation.data;

    // 4. Duplicate Submission / Idempotency Prevention
    // Check if the same user submitted an identical narrative within the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentDuplicate = await prisma.incident.findFirst({
      where: {
        createdById: session.userId,
        createdAt: { gte: oneMinuteAgo },
        governorate: input.governorate,
        category: input.category as any,
      },
      select: { id: true, incidentNumber: true, createdAt: true },
    });

    if (recentDuplicate) {
      return NextResponse.json(
        {
          error: 'تم استلام بلاغ مماثل مؤخراً خلال الدقيقة الماضية. لمنع التكرار يرجى التحقق من رقم التتبع السابق.',
          existingIncidentNumber: recentDuplicate.incidentNumber,
        },
        { status: 409 }
      );
    }

    // 5. Encrypt All Sensitive Original Fields with AES-256-GCM
    const encryptedOriginal = encryptIncidentOriginalPayload({
      sourceType: input.sourceType,
      sourceName: input.sourceName,
      sourceContactPhone: input.sourcePhone,
      sourceOrganization: input.sourceOrg,
      exactLatitude: input.exactLatitude,
      exactLongitude: input.exactLongitude,
      exactLocationDesc: input.exactLocationDesc,
      rawDescription: input.rawDescription,
      initialRiskNotes: input.initialRiskNotes,
    });

    // 6. Handle and validate attachments
    const processedAttachments: Array<{
      fileName: string;
      fileSize: number;
      mimeType: string;
      storageKey: string;
    }> = [];

    if (input.attachments && input.attachments.length > 0) {
      for (const att of input.attachments) {
        if (!att.fileName || !att.fileBase64) continue;

        const buffer = Buffer.from(att.fileBase64, 'base64');
        const validation = validateAttachmentFile(att.fileName, buffer, att.mimeType);

        if (!validation.isValid) {
          return NextResponse.json(
            { error: `فشل التحقق من المرفق [${att.fileName}]: ${validation.error}` },
            { status: 400 }
          );
        }

        const saved = await saveIncidentAttachmentToDisk(buffer, att.fileName);
        processedAttachments.push({
          fileName: att.fileName,
          fileSize: saved.fileSize,
          mimeType: att.mimeType || 'application/octet-stream',
          storageKey: saved.storageKey,
        });
      }
    }

    // 7. Atomic Database Transaction
    const year = new Date().getFullYear();
    const count = await prisma.incident.count();
    const incidentNumber = `FACSS-INC-${year}-${String(count + 1).padStart(6, '0')}`;

    const createdIncident = await prisma.$transaction(async (tx) => {
      const incident = await tx.incident.create({
        data: {
          incidentNumber,
          category: input.category as any,
          priority: input.priority as any,
          status: 'RECEIVED',
          governorate: input.governorate,
          district: input.district || null,
          incidentDate: new Date(input.incidentDate),
          createdById: session.userId,
        },
      });

      await tx.incidentOriginal.create({
        data: {
          incidentId: incident.id,
          sourceType: input.sourceType,
          sourceNameEnc: encryptedOriginal.sourceNameEnc || '',
          sourcePhoneEnc: encryptedOriginal.sourcePhoneEnc || null,
          sourceOrgEnc: encryptedOriginal.sourceOrgEnc || null,
          rawDescriptionEnc: encryptedOriginal.rawDescriptionEnc || '',
          exactLocationEnc: encryptedOriginal.exactLocationEnc || null,
          exactLatEnc: encryptedOriginal.exactLatEnc || null,
          exactLngEnc: encryptedOriginal.exactLngEnc || null,
          initialRiskNotesEnc: encryptedOriginal.initialRiskNotesEnc || null,
        },
      });

      if (processedAttachments.length > 0) {
        await tx.incidentAttachment.createMany({
          data: processedAttachments.map((att) => ({
            incidentId: incident.id,
            fileName: att.fileName,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            storageKey: att.storageKey,
            sensitivity: 'ORIGINAL_SENSITIVE',
            hasExifStripped: false,
            uploadedByUserId: session.userId,
          })),
        });
      }

      return incident;
    });

    // 8. Safe Activity Logging (No sensitive fields or raw text logged)
    await logActivity({
      userId: session.userId,
      userName: session.fullName,
      action: 'INTAKE_INCIDENT',
      entityType: 'Incident',
      entityId: createdIncident.id,
      details: `استلام بلاغ ميداني جديد [${createdIncident.incidentNumber}] في محافظة [${createdIncident.governorate}] وتصنيف [${createdIncident.category}]`,
    });

    // 9. Safe Response (Return ONLY tracking number and receipt status, NO original or other incidents)
    return NextResponse.json(
      {
        success: true,
        incidentNumber: createdIncident.incidentNumber,
        status: createdIncident.status,
        receivedAt: createdIncident.createdAt,
        message: 'تم استلام البلاغ الميداني بنجاح وتمريره للفرز الأمني لدى إدارة العمليات.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع أثناء استلام البلاغ' },
      { status: 500 }
    );
  }
}
