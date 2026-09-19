import prisma from './prisma';

export interface CreateNotificationParams {
  userId: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  link?: string | null;
}

/**
 * Safely creates an in-app notification for a user.
 * Wrapped in a safe try-catch so that any notification failure
 * never breaks or rolls back the parent business transaction.
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    if (!params.userId) {
      console.warn('[Notification] Skipping notification: userId is required');
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        titleAr: params.titleAr,
        titleEn: params.titleEn,
        messageAr: params.messageAr,
        messageEn: params.messageEn,
        type: params.type || 'INFO',
        link: params.link || null,
        isRead: false,
      },
    });

    return notification;
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
    return null;
  }
}
