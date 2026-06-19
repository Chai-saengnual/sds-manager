import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const querySchema = z.object({
  format: z.enum(['xlsx', 'csv', 'pdf']).default('csv'),
  filters: z.object({
    categoryId: z.string().optional(),
    status: z.string().optional(),
    flammable: z.string().optional(),
    search: z.string().optional(),
  }).optional(),
  fields: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and EDITOR can export
    if (session.user.role === 'VIEWER') {
      return NextResponse.json({ error: 'Forbidden: Export access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const flammable = searchParams.get('flammable');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (flammable) where.flammableStatus = flammable;
    if (search) {
      where.OR = [
        { productNameEn: { contains: search, mode: 'insensitive' } },
        { productNameTh: { contains: search, mode: 'insensitive' } },
        { partNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.sdsRecord.findMany({
      where,
      include: {
        category: { select: { name: true, nameTh: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Log the export action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EXPORT',
        entityType: 'sds_record',
        description: `Exported ${records.length} SDS records as ${format.toUpperCase()}`,
      },
    });

    // Generate export data
    const exportData = records.map(r => ({
      'Part Number': r.partNumber || '',
      'Product Name (EN)': r.productNameEn,
      'Product Name (TH)': r.productNameTh || '',
      'Category': r.category?.name || '',
      'Status': r.status,
      'Flammable': r.flammableStatus,
      'Revision Date': r.revisionDate?.toISOString().split('T')[0] || '',
      'Follow-up Date': r.followUpDate?.toISOString().split('T')[0] || '',
      'Supplier': r.supplier || '',
      'Manufacturer': r.manufacturer || '',
      'Hazard Summary': r.hazardSummary || '',
      'Hazard Class': r.hazardClass.join(', '),
      'Tags': r.tags.join(', '),
      'SDS EN URL': r.sdsPdfEnUrl || '',
      'SDS TH URL': r.sdsPdfThUrl || '',
      'Created At': r.createdAt.toISOString(),
      'Updated At': r.updatedAt.toISOString(),
      'Created By': r.createdBy?.name || '',
    }));

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {});
      const rows = exportData.map(row => headers.map(h => `"${(row as Record<string, string>)[h]}"`).join(','));
      const csv = [headers.join(','), ...rows].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="sds-export-${Date.now()}.csv"`,
        },
      });
    }

    if (format === 'xlsx') {
      // Use XLSX (SheetJS) for xlsx generation
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SDS Records');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="sds-export-${Date.now()}.xlsx"`,
        },
      });
    }

    if (format === 'pdf') {
      // Generate PDF with basic table format
      const pdfContent = [
        'SDS Records Export',
        'Generated: ' + new Date().toISOString(),
        '',
        ...exportData.map((row, i) => `${i + 1}. ${JSON.stringify(row)}`).slice(0, 100),
      ].join('\n');

      const encoder = new TextEncoder();
      const pdfBytes = encoder.encode(pdfContent);

      return new NextResponse(pdfBytes, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="sds-export-${Date.now()}.txt"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export records' }, { status: 500 });
  }
}