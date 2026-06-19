import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiInstance) {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiInstance;
}

export interface SdsAnalysisResult {
  chemicalNames: string[];
  hazardClassifications: string[];
  ppeRecommendations: string[];
  storageRequirements: string[];
  firstAidInformation: string[];
  summary: string;
  recommendations: string[];
  warnings: string[];
  confidence: number;
}

export interface UpdateRecommendation {
  recordId: string;
  isOutdated: boolean;
  daysSinceReview: number;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
}

export async function analyzeSdsPdf(textContent: string): Promise<SdsAnalysisResult> {
  const prompt = `Analyze this Safety Data Sheet (SDS) text and extract the following information in JSON format:

{
  "chemicalNames": ["list of chemical names found"],
  "hazardClassifications": ["GHS hazard codes and descriptions"],
  "ppeRecommendations": ["Personal Protective Equipment recommendations"],
  "storageRequirements": ["Storage and handling requirements"],
  "firstAidInformation": ["First aid measures"],
  "summary": "A brief 2-3 sentence summary of this chemical",
  "recommendations": ["Any additional recommendations"],
  "warnings": ["Important warnings"],
  "confidence": 0.0-1.0 confidence score
}

SDS Text:
${textContent.slice(0, 10000)}

Return ONLY valid JSON, no markdown or extra text.`;

  const openai = getOpenAI();
  if (!openai) throw new Error("OpenAI API key not configured");
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in chemical safety and Safety Data Sheets (SDS). Analyze the provided SDS text and extract structured information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      chemicalNames: result.chemicalNames || [],
      hazardClassifications: result.hazardClassifications || [],
      ppeRecommendations: result.ppeRecommendations || [],
      storageRequirements: result.storageRequirements || [],
      firstAidInformation: result.firstAidInformation || [],
      summary: result.summary || '',
      recommendations: result.recommendations || [],
      warnings: result.warnings || [],
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    throw new Error('Failed to analyze SDS document');
  }
}

export async function generateAiSummary(textContent: string): Promise<string> {
  const prompt = `Generate a concise 3-4 sentence summary of this Safety Data Sheet (SDS). Focus on:
1. What the product is and its primary use
2. Main hazards and risks
3. Key safety precautions

SDS Text:
${textContent.slice(0, 8000)}`;

  const openai = getOpenAI();
  if (!openai) throw new Error("OpenAI API key not configured");
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in chemical safety documentation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    return response.choices[0].message.content || 'Summary generation failed';
  } catch (error) {
    console.error('OpenAI summary error:', error);
    throw new Error('Failed to generate summary');
  }
}

export async function checkForDuplicateChemicals(
  records: Array<{ id: string; productNameEn: string; productNameTh?: string | null; aiSummary?: string | null }>
): Promise<Array<{ recordIds: string[]; reason: string; similarity: number }>> {
  const prompt = `Analyze these chemical products and identify potential duplicates. Return JSON array:

{
  "duplicates": [
    {
      "recordIds": ["id1", "id2"],
      "reason": "Similar chemical composition",
      "similarity": 0.0-1.0
    }
  ]
}

Products:
${records.map((r, i) => `[${i}] ${r.id}: ${r.productNameEn}${r.productNameTh ? ` / ${r.productNameTh}` : ''}${r.aiSummary ? `\nSummary: ${r.aiSummary}` : ''}`).join('\n')}

Return ONLY valid JSON.`;

  const openai = getOpenAI();
  if (!openai) throw new Error("OpenAI API key not configured");
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in chemical product identification and duplicate detection.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.duplicates || [];
  } catch (error) {
    console.error('Duplicate detection error:', error);
    return [];
  }
}

export async function generateUpdateRecommendations(
  records: Array<{
    id: string;
    productNameEn: string;
    revisionDate: Date | null;
    followUpDate: Date | null;
    isOutdated: boolean;
    status: string;
  }>
): Promise<UpdateRecommendation[]> {
  const today = new Date();
  
  return records.map((record) => {
    const daysSinceReview = record.revisionDate
      ? Math.floor((today.getTime() - new Date(record.revisionDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const daysUntilFollowUp = record.followUpDate
      ? Math.floor((new Date(record.followUpDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      : -1;

    let priority: 'high' | 'medium' | 'low' = 'low';
    let reason = '';
    let suggestedActions: string[] = [];

    if (daysSinceReview > 730) {
      priority = 'high';
      reason = `SDS has not been reviewed in over ${Math.floor(daysSinceReview / 365)} year(s)`;
      suggestedActions = ['Schedule immediate SDS review', 'Contact supplier for updated version', 'Consider temporary ban until updated'];
    } else if (daysSinceReview > 365) {
      priority = 'high';
      reason = 'SDS has not been reviewed in over 1 year';
      suggestedActions = ['Initiate annual review process', 'Request updated SDS from supplier'];
    } else if (daysSinceReview > 180) {
      priority = 'medium';
      reason = 'SDS approaching annual review deadline';
      suggestedActions = ['Plan SDS review for next quarter'];
    } else if (daysUntilFollowUp < 0 && record.followUpDate) {
      priority = 'high';
      reason = `Follow-up date passed by ${Math.abs(daysUntilFollowUp)} days`;
      suggestedActions = ['Update SDS immediately', 'Set up escalation for non-compliance'];
    } else if (daysUntilFollowUp < 30 && record.followUpDate) {
      priority = 'medium';
      reason = `Follow-up date in ${daysUntilFollowUp} days`;
      suggestedActions = ['Begin review process soon'];
    }

    return {
      recordId: record.id,
      isOutdated: record.isOutdated || daysSinceReview > 365,
      daysSinceReview,
      reason,
      priority,
      suggestedActions,
    };
  });
}

export async function generateComplianceReport(
  records: Array<{
    id: string;
    productNameEn: string;
    status: string;
    isOutdated: boolean;
    isMissingPdf: boolean;
    revisionDate: Date | null;
  }>,
  reportType: 'full' | 'summary' | 'expiring' = 'summary'
): Promise<string> {
  const expiringRecords = records.filter(r => {
    if (!r.revisionDate) return true;
    const daysSince = Math.floor((new Date().getTime() - new Date(r.revisionDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSince > 300 || r.isOutdated;
  });

  const prompt = `Generate a compliance report for Safety Data Sheet management.

Report Type: ${reportType}

Summary Statistics:
- Total Records: ${records.length}
- Expiring/Outdated: ${expiringRecords.length}
- Missing PDFs: ${records.filter(r => r.isMissingPdf).length}
- Inactive: ${records.filter(r => r.status === 'INACTIVE').length}

Records needing attention:
${expiringRecords.slice(0, 20).map(r => `- ${r.productNameEn} (${r.status})${r.isOutdated ? ' - OUTDATED' : ''}${r.isMissingPdf ? ' - MISSING PDF' : ''}`).join('\n')}

Generate a professional compliance report in HTML format.`;

  const openai = getOpenAI();
  if (!openai) throw new Error("OpenAI API key not configured");
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in regulatory compliance and safety documentation.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    return response.choices[0].message.content || 'Report generation failed';
  } catch (error) {
    console.error('Compliance report error:', error);
    throw new Error('Failed to generate compliance report');
  }
}

export async function askSdsQuestion(question: string, context?: string): Promise<string> {
  const prompt = `You are an AI assistant helping with Safety Data Sheet (SDS) questions. ${context ? `Context from relevant SDS:\n${context}\n` : ''}

Question: ${question}

Provide a helpful, accurate response about chemical safety, hazards, PPE, storage, or first aid. If you're unsure or the information isn't in the provided context, say so clearly.`;

  const openai = getOpenAI();
  if (!openai) throw new Error("OpenAI API key not configured");
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant specialized in chemical safety and Safety Data Sheets (SDS).',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    return response.choices[0].message.content || 'I couldn\'t generate a response to your question.';
  } catch (error) {
    console.error('Question answering error:', error);
    throw new Error('Failed to answer question');
  }
}

export { getOpenAI as openai };