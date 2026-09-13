import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, organization, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'جميع الحقول الأساسية مطلوبة (الاسم، البريد، الموضوع، الرسالة)' },
        { status: 400 }
      );
    }

    const newMsg = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : null,
        organization: organization ? organization.trim() : null,
        subject: subject.trim(),
        message: message.trim(),
        status: 'UNREAD',
      }
    });

    await prisma.activityLog.create({
      data: {
        action: 'SUBMIT_CONTACT_MESSAGE',
        entityType: 'ContactMessage',
        entityId: newMsg.id,
        details: `رسالة جديدة من ${name} (${email}) بخصوص: ${subject}`,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'تم استلام رسالتكم بنجاح وسيقوم فريق العمل بالتواصل معكم.',
      id: newMsg.id,
    });
  } catch (error: any) {
    console.error('Contact submit error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة لاحقاً.' },
      { status: 500 }
    );
  }
}
