import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

const sendNotificationSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  type: z.nativeEnum(NotificationType),
  channel: z.nativeEnum(NotificationChannel).default('EMAIL'),
  title: z.string().min(1, 'Title is required'),
  titleTh: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
  messageTh: z.string().optional(),
  sdsRecordId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and EDITOR can send notifications
    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden: Notification access denied' }, { status: 403 });
    }

    const body = await request.json();
    const validated = sendNotificationSchema.parse(body);

    // Resolve recipient
    let recipientId = validated.userId;
    if (!recipientId && validated.email) {
      const user = await prisma.user.findUnique({
        where: { email: validated.email },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found with given email' }, { status: 404 });
      }
      recipientId = user.id;
    }

    if (!recipientId && session.user.role !== 'ADMIN') {
      // Non-admins can only send to themselves
      recipientId = session.user.id;
    }

    if (!recipientId) {
      return NextResponse.json({ error: 'Recipient not specified' }, { status: 400 });
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        type: validated.type,
        channel: validated.channel,
        status: NotificationStatus.PENDING,
        title: validated.title,
        titleTh: validated.titleTh,
        message: validated.message,
        messageTh: validated.messageTh,
        sdsRecordId: validated.sdsRecordId,
        scheduledFor: validated.scheduledFor ? new Date(validated.scheduledFor) : null,
        emailTo: validated.email || undefined,
        emailSubject: validated.title,
        emailBody: validated.message,
      },
    });

    // Simulate email sending (in production, integrate with email service)
    // For now, mark as sent immediately if not scheduled
    if (!validated.scheduledFor) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE',
        entityType: 'notification',
        entityId: notification.id,
        description: `Sent ${validated.type} notification to user ${recipientId}`,
      },
    });

    return NextResponse.json({
      data: notification,
      message: validated.scheduledFor ? 'Notification scheduled' : 'Notification sent',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Send notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}