import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { CAPABILITIES, assertApiCapability } from '@/lib/rbac';
import { validateCertificateInput } from '@/lib/validations/admin';
import { logActivity } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * Generates a unique certificate number: FACSS-CERT-{YYYY}-{NNNN}
 */
async function generateCertificateNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `FACSS-CERT-${year}-`;

  const lastCert = await prisma.certificate.findFirst({
    where: { certificateNumber: { startsWith: prefix } },
    orderBy: { certificateNumber: 'desc' },
    select: { certificateNumber: true },
  });

  let nextNum = 1;
  if (lastCert) {
    const lastNumStr = lastCert.certificateNumber.replace(prefix, '');
    const lastNum = parseInt(lastNumStr, 10);
    if (!isNaN(lastNum)) {
      nextNum = lastNum + 1;
    }
  }

  return `${prefix}${String(nextNum).padStart(4, '0')}`;
}

/**
 * Generates a crypto-secure 24-character hexadecimal verification code (96-bit entropy).
 */
function generateVerificationCode(): string {
  return crypto.randomBytes(12).toString('hex').toUpperCase();
}

/**
 * GET /api/admin/training/certificates
 * Admin: List all issued certificates.
 */
export async function GET() {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const certificates = await prisma.certificate.findMany({
      include: {
        registration: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            course: {
              select: { id: true, titleAr: true, titleEn: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, certificates });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/training/certificates
 * Admin: Issue a certificate for a COMPLETED registration.
 * Validates: registration exists, status = COMPLETED, no existing certificate, course.hasCertificate.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentUser(true);
    const gate = await assertApiCapability(session, CAPABILITIES.MANAGE_TRAINING);
    if (!gate.authorized) return gate.response!;

    const body = await request.json().catch(() => ({}));
    const validation = validateCertificateInput(body);

    if (!validation.success || !validation.data) {
      return NextResponse.json(
        { error: 'بيانات الشهادة غير صالحة', errors: validation.errors },
        { status: 400 }
      );
    }

    const { registrationId, grade } = validation.data;

    // 1. Verify registration exists
    const registration = await prisma.trainingRegistration.findUnique({
      where: { id: registrationId },
      include: {
        course: { select: { id: true, titleAr: true, titleEn: true, hasCertificate: true } },
        certificate: true,
      },
    });

    if (!registration) {
      return NextResponse.json({ error: 'تسجيل المتدرب غير موجود' }, { status: 404 });
    }

    // 2. Registration must be COMPLETED
    if (registration.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: `لا يمكن إصدار شهادة لتسجيل بحالة [${registration.status}]. يجب أن تكون الحالة COMPLETED.` },
        { status: 400 }
      );
    }

    // 3. Course must support certificates
    if (!registration.course.hasCertificate) {
      return NextResponse.json(
        { error: 'هذه الدورة لا تمنح شهادات (hasCertificate = false)' },
        { status: 400 }
      );
    }

    // 4. No duplicate certificate
    if (registration.certificate) {
      return NextResponse.json(
        { error: `تم إصدار شهادة مسبقاً لهذا التسجيل: ${registration.certificate.certificateNumber}` },
        { status: 409 }
      );
    }

    // 5. Generate unique identifiers
    const certificateNumber = await generateCertificateNumber();

    // Ensure unique verification code (retry up to 5 times)
    let verificationCode = generateVerificationCode();
    let retries = 0;
    while (retries < 5) {
      const exists = await prisma.certificate.findUnique({
        where: { verificationCode },
      });
      if (!exists) break;
      verificationCode = generateVerificationCode();
      retries++;
    }

    // 6. Create certificate
    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber,
        registrationId,
        studentName: registration.fullName,
        courseTitle: registration.course.titleAr,
        grade,
        verificationCode,
      },
    });

    // Send notification to trainee
    if (registration.userId) {
      await prisma.notification.create({
        data: {
          userId: registration.userId,
          titleAr: 'تم إصدار شهادتك التدريبية المعتمدة',
          titleEn: 'Accredited Training Certificate Issued',
          messageAr: `تهانينا! تم إصدار شهادتك المعتمدة لدورة [${registration.course.titleAr}] برقم: ${certificateNumber}.`,
          messageEn: `Congratulations! Your certificate for [${registration.course.titleEn || registration.course.titleAr}] has been issued (#${certificateNumber}).`,
          type: 'SUCCESS',
          link: '/portal/trainee/certificates',
        },
      }).catch(err => console.error('Notification error on cert issuance:', err));
    }

    // 7. Audit log
    await logActivity({
      userId: session?.userId,
      userName: session?.fullName,
      action: 'ISSUE_CERTIFICATE',
      entityType: 'Certificate',
      entityId: certificate.id,
      details: `إصدار شهادة [${certificateNumber}] للمتدرب [${registration.fullName}] — دورة [${registration.course.titleAr}] — رمز التحقق: ${verificationCode}`,
    });

    return NextResponse.json(
      {
        success: true,
        message: `تم إصدار الشهادة بنجاح: ${certificateNumber}`,
        certificate,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Certificate issuance error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
