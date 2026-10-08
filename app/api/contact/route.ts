import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkRateLimit, rateLimitResponse, LIMITERS } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    // Rate Limiting: 5 messages per 10 minutes per IP (Anti-Spam protection)
    const rateCheck = checkRateLimit(request, 'CONTACT', LIMITERS.CONTACT);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const body = await request.json();
    const { name, email, phone, organization, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'جميع الحقول الأساسية مطلوبة (الاسم، البريد، الموضوع، الرسالة)' },
        { status: 400 }
      );
    }

    const sanitizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'صيغة البريد الإلكتروني غير صالحة' },
        { status: 400 }
      );
    }

    // Input bounds validation
    if (String(name).length > 100 || String(subject).length > 200 || String(message).length > 5000) {
      return NextResponse.json(
        { error: 'تجاوزت بعض الحقول الحد الأقصى المسموح به من المحارف' },
        { status: 400 }
      );
    }

    const isComplaint = body.messageType === 'COMPLAINT';
    const messageType = isComplaint ? 'COMPLAINT' : 'GENERAL_INQUIRY';
    const priority = ['NORMAL', 'HIGH', 'URGENT'].includes(body.priority) ? body.priority : 'NORMAL';

    let referenceNumber: string | null = null;
    let dueAt: Date | null = null;
    let slaStatus: string | null = null;

    if (isComplaint) {
      const { getSlaConfig, calculateComplaintDueAt } = await import('@/lib/sla-engine');
      const slaConfig = await getSlaConfig();
      const now = new Date();
      const year = now.getFullYear();
      const complaintCount = await prisma.contactMessage.count({
        where: { messageType: 'COMPLAINT' },
      });
      referenceNumber = `FACSS-CMP-${year}-${String(complaintCount + 1).padStart(6, '0')}`;
      const dueInfo = calculateComplaintDueAt(priority, now, slaConfig);
      dueAt = dueInfo.dueAt;
      slaStatus = 'ON_TIME';
    }

    const newMsg = await prisma.contactMessage.create({
      data: {
        name: String(name).trim(),
        email: sanitizedEmail,
        phone: phone ? String(phone).trim() : null,
        organization: organization ? String(organization).trim() : null,
        subject: String(subject).trim(),
        message: String(message).trim(),
        status: 'UNREAD',
        messageType,
        referenceNumber,
        priority: priority as any,
        dueAt,
        slaStatus,
      }
    });

    await prisma.activityLog.create({
      data: {
        action: isComplaint ? 'SUBMIT_COMPLAINT' : 'SUBMIT_CONTACT_MESSAGE',
        entityType: 'ContactMessage',
        entityId: newMsg.id,
        details: isComplaint
          ? `شكوى جديدة برقم مرجعي [${referenceNumber}] من ${name} (${sanitizedEmail}) بخصوص: ${subject}`
          : `رسالة جديدة من ${name} (${sanitizedEmail}) بخصوص: ${subject}`,
      }
    });

    return NextResponse.json({
      success: true,
      message: isComplaint
        ? `تم استلام الشكوى بنجاح وقيدت بالرقم المرجعي الرسمي [${referenceNumber}]. سنقوم بمراجعتها ومعالجتها خلال المهلة المحددة.`
        : 'تم استلام رسالتكم بنجاح وسيقوم فريق العمل بالتواصل معكم.',
      id: newMsg.id,
      referenceNumber,
      messageType,
    });
  } catch (error: any) {
    console.error('Contact submit error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}
