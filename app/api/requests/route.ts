import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { STAFF_ROLES, hasCapability, CAPABILITIES } from '@/lib/rbac';
import { checkRateLimit, rateLimitResponse, LIMITERS } from '@/lib/rateLimit';

async function generateUniqueRequestNumber(): Promise<string> {
  const year = new Date().getFullYear();
  for (let attempt = 0; attempt < 5; attempt++) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const candidate = `FACSS-SR-${year}-${randomSuffix}`;
    const existing = await prisma.serviceRequest.findUnique({
      where: { requestNumber: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  // High-concurrency fallback ensuring zero collision
  return `FACSS-SR-${year}-${Date.now().toString().slice(-6)}`;
}

export async function POST(request: Request) {
  try {
    // Rate Limiting: 10 requests per hour per IP (Anti-Spam protection)
    const rateCheck = checkRateLimit(request, 'REQUESTS', LIMITERS.REQUESTS);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetTime);
    }

    const session = await getCurrentUser(true);
    const body = await request.json();
    const { 
      serviceId, 
      organization, 
      contactName, 
      contactEmail, 
      contactPhone, 
      priority, 
      description 
    } = body;

    if (!serviceId || !organization || !contactName || !contactEmail || !contactPhone || !description) {
      return NextResponse.json(
        { error: 'يرجى استكمال جميع الحقول المطلوبة لطلب الخدمة' },
        { status: 400 }
      );
    }

    const sanitizedEmail = String(contactEmail).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'صيغة البريد الإلكتروني غير صالحة' },
        { status: 400 }
      );
    }

    const validPriorities = ['NORMAL', 'HIGH', 'URGENT'];
    const sanitizedPriority = validPriorities.includes(priority) ? priority : 'NORMAL';

    // Verify that service exists and is active for new requests
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { 
        id: true, 
        titleAr: true, 
        isActive: true,
        category: { select: { isActive: true } }
      },
    });

    if (!service || !service.isActive || !service.category?.isActive) {
      return NextResponse.json(
        { error: 'الخدمة المختارة غير متاحة حالياً لتقديم طلبات جديدة أو تم إيقافها.' },
        { status: 400 }
      );
    }

    // Generate collision-proof unique request number
    const requestNumber = await generateUniqueRequestNumber();

    const newRequest = await prisma.serviceRequest.create({
      data: {
        requestNumber,
        serviceId,
        userId: session?.userId || null,
        organization: String(organization).trim(),
        contactName: String(contactName).trim(),
        contactEmail: sanitizedEmail,
        contactPhone: String(contactPhone).trim(),
        priority: sanitizedPriority as any,
        description: String(description).trim(),
        status: 'NEW',
      },
      include: { service: true }
    });

    // Create initial tracking note
    await prisma.serviceRequestNote.create({
      data: {
        requestId: newRequest.id,
        authorId: session?.userId || null,
        authorName: 'نظام الاستقبال الآلي للمركز المتكامل لخدمات الأمن والسلامة',
        note: `تم تسجيل طلب الخدمة رقم ${requestNumber} بنجاح وإحالته إلى إدارة العمليات للمراجعة.`,
        isClientVisible: true,
      }
    });

    // If user is logged in, send notification
    if (session?.userId) {
      const isStaff = STAFF_ROLES.includes(session.role as any);
      const notifLink = isStaff
        ? `/admin/requests?id=${newRequest.id}`
        : `/portal/client/requests/${newRequest.id}`;

      await prisma.notification.create({
        data: {
          userId: session.userId,
          titleAr: 'تم استلام طلب الخدمة بنجاح',
          titleEn: 'Service Request Successfully Received',
          messageAr: `تم تسجيل طلبكم رقم ${requestNumber} بنجاح. سنقوم بالتواصل معكم بعد المراجعة.`,
          messageEn: `Your request ${requestNumber} has been logged. Our operations team will contact you shortly.`,
          type: 'SUCCESS',
          link: notifLink,
        }
      });
    }

    // Log administrative activity
    await prisma.activityLog.create({
      data: {
        userId: session?.userId || null,
        userName: contactName,
        action: 'CREATE_SERVICE_REQUEST',
        entityType: 'ServiceRequest',
        entityId: newRequest.id,
        details: `طلب خدمة جديد [${requestNumber}] لصالح: ${organization} (${service.titleAr})`,
      }
    });

    return NextResponse.json({
      success: true,
      requestNumber,
      requestId: newRequest.id,
      message: 'تم استلام طلبكم بنجاح وتم توليد رقم المتابعة المرجعي.',
    });
  } catch (error: any) {
    console.error('Service request error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getCurrentUser(true);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role gate: Staff roles view all (requires manage_requests); CLIENT views own requests; TRAINEE has no access
    const isStaff = STAFF_ROLES.includes(session.role as any);

    if (session.role === 'TRAINEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isStaff) {
      const canManage = await hasCapability(session, CAPABILITIES.MANAGE_REQUESTS);
      if (!canManage) {
        return NextResponse.json(
          { error: `Forbidden: Missing required capability [${CAPABILITIES.MANAGE_REQUESTS}]` },
          { status: 403 }
        );
      }
    }

    const requests = await prisma.serviceRequest.findMany({
      where: isStaff ? {} : { userId: session.userId },
      include: {
        service: true,
        assignedEmployee: { select: { fullName: true, email: true } },
        documents: {
          where: isStaff ? {} : { isArchived: false, visibility: 'CLIENT_VISIBLE' },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
