import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { analyzeSdsPdf, generateAiSummary } from '@/lib/openai';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { textContent, analysisType = 'full' } = await request.json();

    if (!textContent) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    // Create analysis record
    const analysis = await prisma.aiAnalysisResult.create({
      data: {
        sdsRecordId: id,
        analysisType,
        status: 'PROCESSING',
      },
    });

    try {
      let result;
      let summary = '';

      if (analysisType === 'summary') {
        summary = await generateAiSummary(textContent);
        result = { summary };
      } else {
        result = await analyzeSdsPdf(textContent);
        summary = result.summary;
      }

      // Update analysis record
      await prisma.aiAnalysisResult.update({
        where: { id: analysis.id },
        data: {
          status: 'COMPLETED',
          extractedData: result as object,
          summary,
          recommendations: result.recommendations || [],
          warnings: result.warnings || [],
          confidence: result.confidence,
          completedAt: new Date(),
        },
      });

      // Update SDS record with AI summary
      await prisma.sdsRecord.update({
        where: { id },
        data: {
          aiSummary: summary,
          aiAnalysis: result as object,
          isAiAnalyzed: true,
        },
      });

      return NextResponse.json({
        analysisId: analysis.id,
        result,
        summary,
      });
    } catch (aiError) {
      // Update analysis record with error
      await prisma.aiAnalysisResult.update({
        where: { id: analysis.id },
        data: {
          status: 'FAILED',
          errorMessage: aiError instanceof Error ? aiError.message : 'AI analysis failed',
        },
      });

      throw aiError;
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}