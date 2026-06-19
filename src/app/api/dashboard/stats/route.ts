import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await Promise.all([
      prisma.sdsRecord.count(),
      prisma.sdsRecord.count({ where: { flammableStatus: 'FLAMMABLE' } }),
      prisma.sdsRecord.count({ where: { flammableStatus: 'NON_FLAMMABLE' } }),
      prisma.sdsRecord.count({ where: { status: 'ACTIVE' } }),
      prisma.sdsRecord.count({ where: { status: 'INACTIVE' } }),
      prisma.sdsRecord.count({ where: { isOutdated: true } }),
      prisma.sdsRecord.count({ where: { isMissingPdf: true } }),
      prisma.sdsRecord.count({ where: { isAiAnalyzed: true } }),
    ]);

    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        sdsRecord: { select: { productNameEn: true } },
      },
    });

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringRecords = await prisma.sdsRecord.count({
      where: {
        followUpDate: { lte: thirtyDaysFromNow, gte: new Date() },
      },
    });

    const categoryDistribution = await prisma.category.findMany({
      select: {
        name: true,
        color: true,
        _count: { select: { sdsRecords: true } },
      },
    });

    return NextResponse.json({
      stats: {
        totalProducts: stats[0],
        flammableProducts: stats[1],
        nonFlammableProducts: stats[2],
        activeProducts: stats[3],
        inactiveProducts: stats[4],
        overdueReviews: stats[5],
        missingPdfs: stats[6],
        aiAnalyzedCount: stats[7],
        expiringThisMonth: expiringRecords,
      },
      recentActivity,
      categoryDistribution: categoryDistribution.map((c) => ({
        name: c.name,
        color: c.color,
        count: c._count.sdsRecords,
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
