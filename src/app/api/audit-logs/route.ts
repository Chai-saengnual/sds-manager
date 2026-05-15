import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { AuditAction } from '@prisma/client';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin can view audit logs
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    const where: Record<string, unknown> = {};

    if (params.userId) where.userId = params.userId;
    if (params.action) where.action = params.action;
    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(params.startDate);
      }
      if (params.endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(params.endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          sdsRecord: { select: { id: true, productNameEn: true, partNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}