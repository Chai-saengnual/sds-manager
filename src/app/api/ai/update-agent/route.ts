import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sdsRecordId = searchParams.get('sdsRecordId');

    if (!sdsRecordId) {
      return NextResponse.json({ error: 'sdsRecordId is required' }, { status: 400 });
    }

    // Fetch the SDS record
    const sdsRecord = await prisma.sdsRecord.findUnique({
      where: { id: sdsRecordId },
      include: {
        aiAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        category: true,
      },
    });

    if (!sdsRecord) {
      return NextResponse.json({ error: 'SDS record not found' }, { status: 404 });
    }

    // Check if update is needed based on settings
    const thresholdDaysSetting = await prisma.systemSetting.findUnique({
      where: { key: 'ai_update_threshold_days' },
    });
    const thresholdDays = thresholdDaysSetting ? parseInt(thresholdDaysSetting.value) : 30;

    const needsUpdate = sdsRecord.revisionDate
      ? (Date.now() - new Date(sdsRecord.revisionDate).getTime()) / (1000 * 60 * 60 * 24) > thresholdDays
      : true;

    // Check for newer versions (simulate external check)
    const updateRecommendation = {
      isOutdated: sdsRecord.isOutdated || needsUpdate,
      lastRevisionDate: sdsRecord.revisionDate?.toISOString() || null,
      daysSinceRevision: sdsRecord.revisionDate
        ? Math.floor((Date.now() - new Date(sdsRecord.revisionDate).getTime()) / (1000 * 60 * 60 * 24))
        : null,
      recommendation: needsUpdate ? 'Consider checking for updated version' : 'Current version appears up to date',
      thresholdDays,
    };

    // Log the AI analysis
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        sdsRecordId,
        action: 'AI_ANALYSIS',
        entityType: 'ai_analysis',
        description: 'AI Update Agent: Checked for updates',
      },
    });

    return NextResponse.json({
      data: {
        sdsRecord: {
          id: sdsRecord.id,
          partNumber: sdsRecord.partNumber,
          productNameEn: sdsRecord.productNameEn,
          revisionDate: sdsRecord.revisionDate,
          status: sdsRecord.status,
        },
        updateAnalysis: updateRecommendation,
        recentAnalyses: sdsRecord.aiAnalyses.map(a => ({
          id: a.id,
          analysisType: a.analysisType,
          status: a.status,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('AI Update Agent error:', error);
    return NextResponse.json({ error: 'Failed to run update agent' }, { status: 500 });
  }
}