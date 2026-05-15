import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { FlammableStatus, RecordStatus } from '@prisma/client';

const sdsRecordSchema = z.object({
  partNumber: z.string().optional(),
  productNameEn: z.string().min(1, 'Product name (EN) is required'),
  productNameTh: z.string().optional(),
  categoryId: z.string().optional(),
  hazardSummary: z.string().optional(),
  hazardClass: z.array(z.string()).optional(),
  flammableStatus: z.nativeEnum(FlammableStatus).optional(),
  status: z.nativeEnum(RecordStatus).optional(),
  revisionDate: z.string().datetime().optional(),
  followUpDate: z.string().datetime().optional(),
  supplier: z.string().optional(),
  manufacturer: z.string().optional(),
  productImageUrl: z.string().url().optional(),
  sdsPdfEnUrl: z.string().url().optional(),
  sdsPdfThUrl: z.string().url().optional(),
  externalLink: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const flammable = searchParams.get('flammable') as FlammableStatus | null;
    const status = searchParams.get('status') as RecordStatus | null;
    const overdue = searchParams.get('overdue') === 'true';
    const missingPdf = searchParams.get('missingPdf') === 'true';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { productNameEn: { contains: search, mode: 'insensitive' } },
        { productNameTh: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
        { hazardSummary: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.categoryId = category;
    if (flammable) where.flammableStatus = flammable;
    if (status) where.status = status;
    if (overdue) where.isOutdated = true;
    if (missingPdf) where.isMissingPdf = true;

    const [records, total] = await Promise.all([
      prisma.sdsRecord.findMany({
        where,
        include: {
          category: true,
          createdBy: { select: { name: true, email: true } },
          updatedBy: { select: { name: true, email: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.sdsRecord.count({ where }),
    ]);

    return NextResponse.json({
      data: records,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('Get SDS records error:', error);
    return NextResponse.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = sdsRecordSchema.parse(body);

    const record = await prisma.sdsRecord.create({
      data: {
        ...validatedData,
        revisionDate: validatedData.revisionDate ? new Date(validatedData.revisionDate) : null,
        followUpDate: validatedData.followUpDate ? new Date(validatedData.followUpDate) : null,
        createdById: session.user.id,
        updatedById: session.user.id,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create SDS record error:', error);
    return NextResponse.json({ error: 'Failed to create record' }, { status: 500 });
  }
}