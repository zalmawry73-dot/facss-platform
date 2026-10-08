import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/verify/[code]
 * Public API: Verify certificate by verification code.
 * No authentication required.
 */
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const code = params.code?.trim();

    if (!code || code.length < 4) {
      return NextResponse.json(
        { error: 'رمز التحقق مطلوب ويجب أن يكون 4 أحرف على الأقل' },
        { status: 400 }
      );
    }

    const certificate = await prisma.certificate.findUnique({
      where: { verificationCode: code.toUpperCase() },
      select: {
        id: true,
        certificateNumber: true,
        studentName: true,
        courseTitle: true,
        issueDate: true,
        grade: true,
        verificationCode: true,
        isRevoked: true,
        revokedAt: true,
      },
    });

    if (!certificate) {
      return NextResponse.json(
        { valid: false, error: 'رمز التحقق غير صالح — لا توجد شهادة مطابقة في قاعدة بيانات المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية' },
        { status: 404 }
      );
    }

    if (certificate.isRevoked) {
      return NextResponse.json({
        valid: false,
        revoked: true,
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseTitle: certificate.courseTitle,
        issueDate: certificate.issueDate,
        revokedAt: certificate.revokedAt,
        message: 'هذه الشهادة تم إلغاؤها ولم تعد سارية المفعول.',
      });
    }

    return NextResponse.json({
      valid: true,
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.studentName,
      courseTitle: certificate.courseTitle,
      issueDate: certificate.issueDate,
      grade: certificate.grade,
      verificationCode: certificate.verificationCode,
      message: 'شهادة صحيحة وسارية المفعول — صادرة رسمياً من المركز المتكامل لخدمات الأمن والسلامة والدراسات الميدانية',
    });
  } catch (error: any) {
    console.error('Certificate verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
