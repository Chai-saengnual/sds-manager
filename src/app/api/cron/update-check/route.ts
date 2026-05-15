import { NextResponse } from 'next/server';
import { differenceInDays, parseISO } from 'date-fns';
import { PrismaClient, RecordStatus } from '@prisma/client';
import { sendExpirationReminder } from '@/lib/email';

const prisma = new PrismaClient();

// Environment configuration
const OUTDATED_THRESHOLD_DAYS = parseInt(process.env.OUTDATED_THRESHOLD_DAYS || '365', 10);
const FOLLOW_UP_REMINDER_DAYS = parseInt(process.env.FOLLOW_UP_REMINDER_DAYS || '30', 10);

interface UpdateCheckResult {
  outdatedRecords: number;
  expiredRecords: number;
  reminderSent: number;
  errors: string[];
}

async function scanOutdatedRecords(): Promise<UpdateCheckResult> {
  const result: UpdateCheckResult = {
    outdatedRecords: 0,
    expiredRecords: 0,
    reminderSent: 0,
    errors: [],
  };

  try {
    // Find records that need update check
    // Criteria: revision date is older than threshold or status is PENDING_REVIEW
    const outdatedThreshold = new Date();
    outdatedThreshold.setDate(outdatedThreshold.getDate() - OUTDATED_THRESHOLD_DAYS);

    const recordsToUpdate = await prisma.sdsRecord.findMany({
      where: {
        OR: [
          // Records with revision date older than threshold
          {
            revisionDate: {
              lt: outdatedThreshold,
            },
          },
          // Records with outdated flag that might be stale
          {
            isOutdated: true,
            updatedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // older than 30 days
            },
          },
        ],
        status: {
          in: [RecordStatus.ACTIVE, RecordStatus.PENDING_REVIEW],
        },
      },
      include: {
        category: true,
      },
    });

    // Mark outdated records
    if (recordsToUpdate.length > 0) {
      await prisma.sdsRecord.updateMany({
        where: {
          id: {
            in: recordsToUpdate.map(r => r.id),
          },
        },
        data: {
          isOutdated: true,
          status: RecordStatus.PENDING_REVIEW,
        },
      });

      result.outdatedRecords = recordsToUpdate.length;
    }
  } catch (error) {
    result.errors.push(`Error scanning outdated records: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Find expired records (follow-up date has passed)
    const expiredRecords = await prisma.sdsRecord.findMany({
      where: {
        followUpDate: {
          lt: new Date(),
        },
        status: {
          in: [RecordStatus.ACTIVE, RecordStatus.PENDING_REVIEW],
        },
      },
      include: {
        category: true,
      },
    });

    // Mark expired records
    if (expiredRecords.length > 0) {
      await prisma.sdsRecord.updateMany({
        where: {
          id: {
            in: expiredRecords.map(r => r.id),
          },
        },
        data: {
          status: RecordStatus.EXPIRED,
        },
      });

      result.expiredRecords = expiredRecords.length;
    }
  } catch (error) {
    result.errors.push(`Error scanning expired records: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  try {
    // Find records approaching follow-up date
    const upcomingThreshold = new Date();
    upcomingThreshold.setDate(upcomingThreshold.getDate() + FOLLOW_UP_REMINDER_DAYS);

    const recordsNeedingReminder = await prisma.sdsRecord.findMany({
      where: {
        followUpDate: {
          gte: new Date(),
          lte: upcomingThreshold,
        },
        status: {
          in: [RecordStatus.ACTIVE],
        },
      },
      include: {
        category: true,
      },
    });

    // Group records by user and send reminders
    if (recordsNeedingReminder.length > 0) {
      // Get all admin users to receive notifications
      const adminUsers = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          isActive: true,
          email: {
            not: null,
          },
        },
      });

      const editorUsers = await prisma.user.findMany({
        where: {
          role: 'EDITOR',
          isActive: true,
          email: {
            not: null,
          },
        },
        take: 5, // Limit to 5 editors
      });

      const notificationRecipients = [
        ...adminUsers.map(u => u.email!).filter(Boolean),
        ...editorUsers.map(u => u.email!).filter(Boolean),
      ];

      // Send notifications (in production, batch these)
      const reminderData = recordsNeedingReminder.map(record => ({
        productName: record.productNameEn,
        partNumber: record.partNumber || undefined,
        followUpDate: record.followUpDate!,
        category: record.category?.name || undefined,
        daysUntilExpiration: differenceInDays(record.followUpDate!, new Date()),
      }));

      for (const recipient of notificationRecipients) {
        const emailResult = await sendExpirationReminder(recipient, reminderData);
        if (emailResult.success) {
          result.reminderSent++;
        }
      }
    }
  } catch (error) {
    result.errors.push(`Error sending reminders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Create audit log entry
  try {
    await prisma.auditLog.create({
      data: {
        action: 'AI_ANALYSIS',
        entityType: 'system',
        entityId: 'cron-update-check',
        description: 'Update check cron job completed',
        descriptionTh: 'งาน Cron ตรวจสอบการอัปเดตเสร็จสิ้น',
        changes: result as unknown as Record<string, unknown>,
      },
    });
  } catch (error) {
    // Non-critical, don't fail the job
    console.error('Failed to create audit log:', error);
  }

  return result;
}

export async function GET(request: Request) {
  // Optional: verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const startTime = Date.now();
    const result = await scanOutdatedRecords();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      results: result,
    });
  } catch (error) {
    console.error('Update check cron failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}