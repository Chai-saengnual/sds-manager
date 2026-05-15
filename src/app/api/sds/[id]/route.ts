import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { FlammableStatus, RecordStatus } from '@prisma/client';
import { createAuditLog, detectChanges } from '@/lib/audit';

const sdsRecordSchema = z.object({
  partNumber: z.string().optional(),
  productNameEn: z.string().min(1, 'Product name (EN) is required'),
  productNameTh: z.string().optional(),
  categoryId: z.string().optional(),
  hazardSummary: z.string().optional(),
  hazardClass: z.array(z.string()).optional(),
  flammableStatus: z.nativeEnum(FlammableStatus).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  revisionDate: z.string().datetime().optional().nullable(),
  followUpDate: z.string().datetime().optional().nullable(),
  supplier: z.string().optional(),
  manufacturer: z.string().optional(),
  productImageUrl: z.string().url().optional().nullable(),
  sdsPdfEnUrl: z.string().url().optional().nullable(),
  sdsPdfThUrl: z.string().url().optional().nullable(),
  externalLink: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const record = await prisma.sdsRecord.findUnique({
      where: { id },
      include: {
        category: true,
        createdBy: { select: { name: true, email: true } },
        updatedBy: { select: { name: true, email: true } },
        uploadedFiles: true,
        aiAnalyses: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    // Log view action
    const session = await auth();
    if (session?.user) {
      await createAuditLog({
        userId: session.user.id,
        sdsRecordId: id,
        action: 'VIEW',
        entityType: 'sds_record',
        entityId: id,
        description: `Viewed SDS record: ${record.productNameEn}`,
      });
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Get SDS record error:', error);
    return NextResponse.json({ error: 'Failed to fetch record' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existingRecord = await prisma.sdsRecord.findUnique({
      where: { id },
    });

    if (!existingRecord) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = sdsRecordSchema.parse(body);

    const changes = detectChanges(
      existingRecord as unknown as Record<string, unknown>,
      validatedData
    );

    const record = await prisma.sdsRecord.update({
      where: { id },
      data: {
        ...validatedData,
        revisionDate: validatedData.revisionDate ? new Date(validatedData.revisionDate) : null,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
        updatedById: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        category: true,
      },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      sdsRecordId: id,
      action: 'UPDATE',
      entityType: 'sds_record',
      entityId: id,
      changes,
      description: `Updated SDS record: ${record.productNameEn}`,
    });

    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Update SDS record error:', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const record = await prisma.sdsRecord.findUnique({
      where: { id },
    });

    if (!record) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    await prisma.sdsRecord.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      sdsRecordId: id,
      action: 'DELETE',
      entityType: 'sds_record',
      entityId: id,
      oldValues: record as unknown as Record<string, unknown>,
      description: `Deleted SDS record: ${record.productNameEn}`,
    });

    return NextResponse.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete SDS record error:', error);
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}