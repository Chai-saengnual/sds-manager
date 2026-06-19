'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { isOverdue, formatDate } from '@/lib/utils';

const FLAMMABLE_VALUES = ['FLAMMABLE', 'NON_FLAMMABLE', 'UNKNOWN'] as const;
const STATUS_VALUES = ['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING_REVIEW'] as const;

const formSchema = z.object({
  productNameEn: z.string().min(1, 'Product name (EN) is required'),
  productNameTh: z.string().optional(),
  partNumber: z.string().optional(),
  categoryId: z.string().optional(),
  hazardSummary: z.string().optional(),
  hazardClass: z.string().optional(),
  flammableStatus: z.enum(FLAMMABLE_VALUES).optional(),
  status: z.enum(STATUS_VALUES).optional(),
  revisionDate: z.string().optional(),
  followUpDate: z.string().optional(),
  supplier: z.string().optional(),
  manufacturer: z.string().optional(),
  sdsPdfEnUrl: z.string().url().optional().or(z.literal('')),
  sdsPdfThUrl: z.string().url().optional().or(z.literal('')),
  externalLink: z.string().url().optional().or(z.literal('')),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
  nameTh?: string | null;
  color: string;
}

interface SdsFormPageProps {
  mode: 'create' | 'edit';
  id?: string;
}

export function SdsFormPage({ mode, id }: SdsFormPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const enInputRef = useRef<HTMLInputElement>(null);
  const thInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productNameEn: '',
      productNameTh: '',
      partNumber: '',
      hazardSummary: '',
      hazardClass: '',
      flammableStatus: 'UNKNOWN',
      status: 'ACTIVE',
      tags: '',
      notes: '',
    },
  });

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !id) return;
    setIsLoading(true);
    fetch(`/api/sds/${id}`)
      .then((r) => r.json())
      .then((record) => {
        reset({
          productNameEn: record.productNameEn || '',
          productNameTh: record.productNameTh || '',
          partNumber: record.partNumber || '',
          categoryId: record.categoryId || '',
          hazardSummary: record.hazardSummary || '',
          hazardClass: (record.hazardClass || []).join(', '),
          flammableStatus: record.flammableStatus || 'UNKNOWN',
          status: record.status || 'ACTIVE',
          revisionDate: record.revisionDate ? record.revisionDate.slice(0, 10) : '',
          followUpDate: record.followUpDate ? record.followUpDate.slice(0, 10) : '',
          supplier: record.supplier || '',
          manufacturer: record.manufacturer || '',
          sdsPdfEnUrl: record.sdsPdfEnUrl || '',
          sdsPdfThUrl: record.sdsPdfThUrl || '',
          externalLink: record.externalLink || '',
          tags: (record.tags || []).join(', '),
          notes: record.notes || '',
        });
      })
      .catch((err) => {
        toast({ title: 'Failed to load record', variant: 'destructive' });
        console.error(err);
      })
      .finally(() => setIsLoading(false));
  }, [mode, id, reset, toast]);

  const flammable = watch('flammableStatus');
  const status = watch('status');
  const categoryId = watch('categoryId');

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || null,
        hazardClass: values.hazardClass
          ? values.hazardClass.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        tags: values.tags
          ? values.tags.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        revisionDate: values.revisionDate || null,
        followUpDate: values.followUpDate || null,
        sdsPdfEnUrl: values.sdsPdfEnUrl || null,
        sdsPdfThUrl: values.sdsPdfThUrl || null,
        externalLink: values.externalLink || null,
      };

      const url = mode === 'edit' && id ? `/api/sds/${id}` : '/api/sds';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Save failed');
      }
      const saved = await res.json();
      toast({ title: mode === 'edit' ? 'Record updated' : 'Record created', variant: 'success' });
      router.push(`/sds/${saved.id}`);
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  async function onDelete() {
    if (!id) return;
    if (!confirm('Delete this SDS record? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sds/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Record deleted', variant: 'success' });
      router.push('/sds');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Delete failed';
      toast({ title: msg, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  }

  const followUpVal = watch('followUpDate');
  const overdue = followUpVal ? isOverdue(followUpVal) : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 max-w-4xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href={id ? `/sds/${id}` : '/sds'}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === 'edit' ? 'Edit SDS Record' : 'New SDS Record'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'edit' ? 'Update chemical safety data' : 'Add a new chemical or product'}
            </p>
          </div>
          {mode === 'edit' && (
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
              <CardDescription>Basic product details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="productNameEn">
                    Product Name (EN) <span className="text-destructive">*</span>
                  </Label>
                  <Input id="productNameEn" {...register('productNameEn')} placeholder="e.g. Acetone" />
                  {errors.productNameEn && (
                    <p className="text-sm text-destructive">{errors.productNameEn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productNameTh">Product Name (TH)</Label>
                  <Input id="productNameTh" {...register('productNameTh')} placeholder="ชื่อภาษาไทย" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Part Number (P/N)</Label>
                  <Input id="partNumber" {...register('partNumber')} placeholder="e.g. 100006759" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <Select value={categoryId || ''} onValueChange={(v) => setValue('categoryId', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">— None —</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flammableStatus">Flammable</Label>
                  <Select
                    value={flammable || 'UNKNOWN'}
                    onValueChange={(v) => setValue('flammableStatus', v as FormValues['flammableStatus'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNKNOWN">— Unknown —</SelectItem>
                      <SelectItem value="FLAMMABLE">🔥 Flammable</SelectItem>
                      <SelectItem value="NON_FLAMMABLE">✓ Non-Flammable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status || 'ACTIVE'}
                    onValueChange={(v) => setValue('status', v as FormValues['status'])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hazard Information</CardTitle>
              <CardDescription>Safety classifications and warnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hazardSummary">Hazard Summary</Label>
                <Textarea
                  id="hazardSummary"
                  {...register('hazardSummary')}
                  placeholder="e.g. Highly flammable, causes skin and eye irritation"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hazardClass">Hazard Class (comma-separated GHS codes)</Label>
                <Input id="hazardClass" {...register('hazardClass')} placeholder="e.g. GHS02, GHS07" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input id="supplier" {...register('supplier')} placeholder="e.g. ChemTech Industries" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input id="manufacturer" {...register('manufacturer')} placeholder="e.g. ChemTech Manufacturing" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" {...register('tags')} placeholder="e.g. solvent, flammable, technical-grade" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dates</CardTitle>
              <CardDescription>Revision and follow-up schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="revisionDate">Revision Date</Label>
                  <Input id="revisionDate" type="date" {...register('revisionDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpDate">Follow-Up Date</Label>
                  <Input id="followUpDate" type="date" {...register('followUpDate')} />
                  {followUpVal && (
                    <p className={`text-xs ${overdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {overdue ? `⚠ ${formatDate(followUpVal)} — Overdue` : formatDate(followUpVal)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SDS Documents & Links</CardTitle>
              <CardDescription>PDF URLs and external references</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sdsPdfEnUrl">SDS PDF URL (EN)</Label>
                  <Input
                    id="sdsPdfEnUrl"
                    {...register('sdsPdfEnUrl')}
                    placeholder="https://… SharePoint URL"
                    ref={enInputRef}
                  />
                  {errors.sdsPdfEnUrl && (
                    <p className="text-sm text-destructive">{errors.sdsPdfEnUrl.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sdsPdfThUrl">SDS PDF URL (TH)</Label>
                  <Input
                    id="sdsPdfThUrl"
                    {...register('sdsPdfThUrl')}
                    placeholder="https://… SharePoint URL"
                    ref={thInputRef}
                  />
                  {errors.sdsPdfThUrl && (
                    <p className="text-sm text-destructive">{errors.sdsPdfThUrl.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="externalLink">External Product Link</Label>
                <Input id="externalLink" {...register('externalLink')} placeholder="https://…" />
                {errors.externalLink && (
                  <p className="text-sm text-destructive">{errors.externalLink.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" {...register('notes')} placeholder="Internal notes…" rows={3} />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href={id ? `/sds/${id}` : '/sds'}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {mode === 'edit' ? 'Save Changes' : 'Create Record'}
            </Button>
          </div>
        </form>

        {mode === 'edit' && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Badge variant="outline">v1.0</Badge>
            Last change tracked automatically in the audit log.
          </div>
        )}
      </main>
    </div>
  );
}
