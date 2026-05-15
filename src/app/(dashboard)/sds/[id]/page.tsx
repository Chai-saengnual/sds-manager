'use client';

import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FileText,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  QrCode,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle,
  Flame,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/header';
import { formatDate, formatRelativeTime, getDaysUntil, isOverdue } from '@/lib/utils';
import { FlammableStatus, RecordStatus } from '@prisma/client';

interface SdsRecord {
  id: string;
  partNumber: string | null;
  productNameEn: string;
  productNameTh: string | null;
  hazardSummary: string | null;
  hazardClass: string[];
  flammableStatus: FlammableStatus;
  status: RecordStatus;
  revisionDate: string | null;
  followUpDate: string | null;
  nextReviewDate: string | null;
  supplier: string | null;
  manufacturer: string | null;
  productImageUrl: string | null;
  sdsPdfEnUrl: string | null;
  sdsPdfThUrl: string | null;
  externalLink: string | null;
  tags: string[];
  notes: string | null;
  aiSummary: string | null;
  aiAnalysis: object | null;
  isAiAnalyzed: boolean;
  qrCodeUrl: string | null;
  isOutdated: boolean;
  isMissingPdf: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string; color: string } | null;
  createdBy: { name: string | null; email: string } | null;
  updatedBy: { name: string | null; email: string } | null;
}

function SdsDetailContent({ id }: { id: string }) {
  const { t } = useTranslation();
  const [record, setRecord] = useState<SdsRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRecord() {
      try {
        const response = await fetch(`/api/sds/${id}`);
        if (response.ok) {
          const data = await response.json();
          setRecord(data);
        }
      } catch (error) {
        console.error('Failed to fetch record:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRecord();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto p-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Record not found</h3>
              <Button asChild className="mt-4">
                <Link href="/sds">Back to SDS List</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const daysUntilFollowUp = getDaysUntil(record.followUpDate);
  const overdue = isOverdue(record.followUpDate);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {record.flammableStatus === 'FLAMMABLE' && (
                <Badge variant="destructive"><Flame className="h-3 w-3 mr-1" />Flammable</Badge>
              )}
              <Badge variant={record.status === 'ACTIVE' ? 'success' : 'secondary'}>
                {record.status}
              </Badge>
              {record.isOutdated && <Badge variant="destructive">Outdated</Badge>}
              {record.isMissingPdf && <Badge variant="warning">Missing PDF</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{record.productNameEn}</h1>
            {record.productNameTh && (
              <p className="text-lg text-muted-foreground">{record.productNameTh}</p>
            )}
            {record.partNumber && (
              <p className="text-sm text-muted-foreground mt-1">Part Number: {record.partNumber}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/sds/${id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/sds/${id}/upload`}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </Link>
            </Button>
            <Button variant="outline">
              <QrCode className="mr-2 h-4 w-4" />
              QR Code
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {record.category && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('common.category')}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: record.category.color }} />
                        <span className="font-medium">{record.category.name}</span>
                      </div>
                    </div>
                  )}
                  {record.supplier && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('sds.supplier')}</p>
                      <p className="font-medium">{record.supplier}</p>
                    </div>
                  )}
                  {record.manufacturer && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('sds.manufacturer')}</p>
                      <p className="font-medium">{record.manufacturer}</p>
                    </div>
                  )}
                  {record.revisionDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t('sds.revisionDate')}</p>
                      <p className="font-medium">{formatDate(record.revisionDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{t('sds.followUpDate')}</p>
                    <p className={`font-medium ${overdue ? 'text-red-500' : ''}`}>
                      {record.followUpDate ? formatDate(record.followUpDate) : '-'}
                      {daysUntilFollowUp !== null && (
                        <span className="text-sm ml-2">
                          ({daysUntilFollowUp > 0 ? `in ${daysUntilFollowUp} days` : `${Math.abs(daysUntilFollowUp)} days overdue`})
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {record.hazardSummary && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">{t('sds.hazardSummary')}</p>
                    <p>{record.hazardSummary}</p>
                  </div>
                )}

                {record.hazardClass.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">{t('sds.hazardClass')}</p>
                    <div className="flex flex-wrap gap-2">
                      {record.hazardClass.map((cls, i) => (
                        <Badge key={i} variant="outline">{cls}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {record.tags.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">{t('sds.tags')}</p>
                    <div className="flex flex-wrap gap-2">
                      {record.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Files Card */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sds.pdfEnglish')} & Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {record.sdsPdfEnUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{t('sds.pdfEnglish')}</p>
                          <p className="text-sm text-muted-foreground">PDF Document</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={record.sdsPdfEnUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-muted-foreground">{t('sds.pdfEnglish')}</p>
                          <p className="text-sm text-muted-foreground">Not uploaded</p>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/sds/${id}/upload?type=SDS_PDF_EN`}>Upload</Link>
                      </Button>
                    </div>
                  )}

                  {record.sdsPdfThUrl ? (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{t('sds.pdfThai')}</p>
                          <p className="text-sm text-muted-foreground">PDF Document</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={record.sdsPdfThUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-muted-foreground">{t('sds.pdfThai')}</p>
                          <p className="text-sm text-muted-foreground">Not uploaded</p>
                        </div>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/sds/${id}/upload?type=SDS_PDF_TH`}>Upload</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle><Sparkles className="h-5 w-5 inline mr-2" />AI Analysis</CardTitle>
                  <CardDescription>Auto-generated insights from the SDS</CardDescription>
                </div>
                {!record.isAiAnalyzed && (
                  <Button>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Now
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {record.aiSummary ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Summary</p>
                      <p className="text-muted-foreground">{record.aiSummary}</p>
                    </div>
                    {record.aiAnalysis && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Extracted Data</p>
                        <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto">
                          {JSON.stringify(record.aiAnalysis, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No AI analysis yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a PDF and run AI analysis to extract insights
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {record.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('sds.notes')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{record.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <Badge variant={record.status === 'ACTIVE' ? 'success' : 'secondary'} className="mt-1">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {record.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Flammable Status</p>
                  <Badge variant={record.flammableStatus === 'FLAMMABLE' ? 'destructive' : 'secondary'} className="mt-1">
                    <Flame className="h-3 w-3 mr-1" />
                    {record.flammableStatus}
                  </Badge>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Review Progress</span>
                    {daysUntilFollowUp !== null && (
                      <span className={`text-sm font-medium ${overdue ? 'text-red-500' : ''}`}>
                        {Math.max(0, Math.floor(daysUntilFollowUp / 365 * 100))}%
                      </span>
                    )}
                  </div>
                  <Progress value={daysUntilFollowUp !== null ? Math.max(0, Math.min(100, (1 - daysUntilFollowUp / 365) * 100)) : 100} />
                </div>
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(record.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{formatRelativeTime(record.updatedAt)}</span>
                </div>
                {record.createdBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span>{record.createdBy.name || record.createdBy.email}</span>
                  </div>
                )}
                {record.updatedBy && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated By</span>
                    <span>{record.updatedBy.name || record.updatedBy.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Links */}
            {(record.externalLink || record.productImageUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>External Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {record.externalLink && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={record.externalLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Product Link
                      </a>
                    </Button>
                  )}
                  {record.productImageUrl && (
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href={record.productImageUrl} target="_blank" rel="noopener noreferrer">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Product Image
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SdsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('');
  
  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  if (!id) return null;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SdsDetailContent id={id} />
    </Suspense>
  );
}