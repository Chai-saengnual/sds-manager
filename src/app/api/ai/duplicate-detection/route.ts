import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const duplicateDetectionSchema = z.object({
  sdsRecordId: z.string().optional(),
  partNumber: z.string().optional(),
  productNameEn: z.string().optional(),
  productNameTh: z.string().optional(),
  threshold: z.number().min(0).max(1).default(0.85),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sdsRecordId, partNumber, productNameEn, productNameTh, threshold } = duplicateDetectionSchema.parse(body);

    if (!sdsRecordId && !partNumber && !productNameEn && !productNameTh) {
      return NextResponse.json({ error: 'At least one search criteria is required' }, { status: 400 });
    }

    // Build search query
    const where: Record<string, unknown> = {};

    if (sdsRecordId) where.id = { not: sdsRecordId };

    if (partNumber) {
      where.OR = [
        { partNumber: { equals: partNumber } },
        { partNumber: { contains: partNumber, mode: 'insensitive' } },
      ];
    }

    if (productNameEn || productNameTh) {
      where.AND = [];
      if (productNameEn) {
        (where.AND as unknown[]).push({
          OR: [
            { productNameEn: { equals: productNameEn } },
            { productNameEn: { contains: productNameEn, mode: 'insensitive' } },
          ],
        });
      }
      if (productNameTh) {
        (where.AND as unknown[]).push({
          OR: [
            { productNameTh: { equals: productNameTh } },
            { productNameTh: { contains: productNameTh, mode: 'insensitive' } },
          ],
        });
      }
    }

    // Search for potential duplicates
    const potentialDuplicates = await prisma.sdsRecord.findMany({
      where,
      include: {
        category: { select: { name: true } },
        createdBy: { select: { name: true } },
      },
      take: 20,
    });

    // Score and filter duplicates
    const scoredDuplicates = potentialDuplicates.map(record => {
      let score = 0;
      const matches: string[] = [];

      // Exact match on part number
      if (partNumber && record.partNumber?.toLowerCase() === partNumber.toLowerCase()) {
        score += 1;
        matches.push('partNumber_exact');
      } else if (partNumber && record.partNumber?.toLowerCase().includes(partNumber.toLowerCase())) {
        score += 0.5;
        matches.push('partNumber_partial');
      }

      // Exact match on product name
      if (productNameEn && record.productNameEn.toLowerCase() === productNameEn.toLowerCase()) {
        score += 1;
        matches.push('productNameEn_exact');
      } else if (productNameEn && record.productNameEn.toLowerCase().includes(productNameEn.toLowerCase())) {
        score += 0.5;
        matches.push('productNameEn_partial');
      }

      if (productNameTh && record.productNameTh?.toLowerCase() === productNameTh.toLowerCase()) {
        score += 0.8;
        matches.push('productNameTh_exact');
      } else if (productNameTh && record.productNameTh?.toLowerCase().includes(productNameTh.toLowerCase())) {
        score += 0.4;
        matches.push('productNameTh_partial');
      }

      // Normalize score
      const maxScore = (partNumber ? 1 : 0) + (productNameEn ? 1 : 0) + (productNameTh ? 0.8 : 0);
      const normalizedScore = maxScore > 0 ? score / maxScore : 0;

      return {
        record: {
          id: record.id,
          partNumber: record.partNumber,
          productNameEn: record.productNameEn,
          productNameTh: record.productNameTh,
          category: record.category?.name,
          status: record.status,
          createdAt: record.createdAt,
          createdBy: record.createdBy?.name,
        },
        score: normalizedScore,
        matches,
        isDuplicate: normalizedScore >= threshold,
      };
    });

    // Filter by threshold and sort by score
    const duplicates = scoredDuplicates
      .filter(d => d.score >= threshold)
      .sort((a, b) => b.score - a.score);

    // Mark records as potential duplicates if needed
    if (duplicates.length > 0 && sdsRecordId) {
      await prisma.sdsRecord.update({
        where: { id: sdsRecordId },
        data: { isDuplicate: true },
      });

      // Create AI analysis result
      await prisma.aiAnalysisResult.create({
        data: {
          sdsRecordId,
          analysisType: 'duplicate_detection',
          status: 'COMPLETED',
          extractedData: { duplicates: duplicates.length },
          summary: `Found ${duplicates.length} potential duplicate(s)`,
          confidence: duplicates[0]?.score || 0,
        },
      });
    }

    // Log the detection
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        sdsRecordId,
        action: 'AI_ANALYSIS',
        entityType: 'ai_analysis',
        description: `AI Duplicate Detection: Found ${duplicates.length} duplicate(s)`,
      },
    });

    return NextResponse.json({
      data: {
        totalChecked: potentialDuplicates.length,
        duplicatesFound: duplicates.length,
        threshold,
        duplicates,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Duplicate detection error:', error);
    return NextResponse.json({ error: 'Failed to detect duplicates' }, { status: 500 });
  }
}