import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const settingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
  group: z.string().default('general'),
  label: z.string().optional(),
  labelTh: z.string().optional(),
});

const updateSettingSchema = settingSchema.partial();

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can view all settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const group = searchParams.get('group');
    const key = searchParams.get('key');

    const where: Record<string, unknown> = {};
    if (group) where.group = group;
    if (key) where.key = key;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    // Parse values based on type
    const parsedSettings = settings.map(s => ({
      ...s,
      value: parseSettingValue(s.value, s.type),
    }));

    return NextResponse.json({ data: parsedSettings });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can update settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Support bulk update or single update
    if (Array.isArray(body)) {
      // Bulk update
      const results = await Promise.all(
        body.map(async (item: unknown) => {
          const validated = updateSettingSchema.parse(item);
          return prisma.systemSetting.upsert({
            where: { key: validated.key || '' },
            create: {
              key: validated.key || '',
              value: validated.value || '',
              type: validated.type || 'string',
              group: validated.group || 'general',
              label: validated.label,
              labelTh: validated.labelTh,
            },
            update: {
              value: validated.value,
              type: validated.type,
              group: validated.group,
              label: validated.label,
              labelTh: validated.labelTh,
            },
          });
        })
      );

      // Log bulk update
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'BULK_UPDATE',
          entityType: 'system_setting',
          description: `Updated ${results.length} settings`,
        },
      });

      return NextResponse.json({ data: results });
    } else {
      // Single update
      const validated = updateSettingSchema.parse(body);

      if (!validated.key) {
        return NextResponse.json({ error: 'Key is required for single update' }, { status: 400 });
      }

      const setting = await prisma.systemSetting.upsert({
        where: { key: validated.key },
        create: {
          key: validated.key,
          value: validated.value || '',
          type: validated.type || 'string',
          group: validated.group || 'general',
          label: validated.label,
          labelTh: validated.labelTh,
        },
        update: {
          value: validated.value,
          type: validated.type,
          group: validated.group,
          label: validated.label,
          labelTh: validated.labelTh,
        },
      });

      // Log the update
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE',
          entityType: 'system_setting',
          entityId: setting.id,
          description: `Updated setting: ${setting.key}`,
        },
      });

      return NextResponse.json({ data: parseSettingValue(setting.value, setting.type) ? { ...setting, value: parseSettingValue(setting.value, setting.type) } : setting });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

function parseSettingValue(value: string, type: string): unknown {
  try {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        return JSON.parse(value);
      default:
        return value;
    }
  } catch {
    return value;
  }
}