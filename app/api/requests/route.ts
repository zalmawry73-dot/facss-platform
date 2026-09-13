import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getCurrentUser();
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

    // Generate unique request number: FACSS-SR-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const requestNumber = `FACSS-SR-${year}-${randomSuffix}`;

    const newRequest = await prisma.serviceRequest.create({
      data: {
        requestNumber,
        serviceId,
        userId: session?.userId || null,
        organization: organization.trim(),
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        priority: priority || 'NORMAL',
        description: description.trim(),
        status: 'NEW',
      },
      include: { service: true }
    });

    // Create initial tracking note
    await prisma.serviceRequestNote.create({
      data: {
        requestId: newRequest.id,
        authorId: session?.userId || null,
        authorName: 'نظام الاستقبال الآلي لمركز FACSS',
        note: `تم تسجيل طلب الخدمة رقم ${requestNumber} بنجاح وإحالته إلى إدارة العمليات للمراجعة.`,
        isClientVisible: true,
      }
    });

    // If user is logged in, send notification
    if (session?.userId) {
      await prisma.notification.create({
        data: {
          userId: session.userId,
          titleAr: 'تم استلام طلب الخدمة بنجاح',
          titleEn: 'Service Request Successfully Received',
          messageAr: `تم تسجيل طلبكم رقم ${requestNumber} بنجاح. سنقوم بالتواصل معكم بعد المراجعة.`,
          messageEn: `Your request ${requestNumber} has been logged. Our operations team will contact you shortly.`,
          type: 'SUCCESS',
          link: `/portal/client/requests/${newRequest.id}`,
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
        details: `طلب خدمة جديد [${requestNumber}] لصالح: ${organization} (${newRequest.service.titleAr})`,
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
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If client, only their requests; if admin/manager, all requests
    const isStaff = session.role === 'SUPER_ADMIN' || session.role === 'ADMIN' || session.role.includes('MANAGER');

    const requests = await prisma.serviceRequest.findMany({
      where: isStaff ? {} : { userId: session.userId },
      include: {
        service: true,
        assignedEmployee: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
