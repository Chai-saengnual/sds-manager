'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  LayoutGrid,
  List,
  SortAsc,
  SortDesc,
  Download,
  FileText,
  Flame,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Upload,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Header } from '@/components/header';
import { formatDate, isOverdue, isExpiringSoon, getDaysUntil } from '@/lib/utils';
import { FlammableStatus, RecordStatus } from '@prisma/client';

interface SdsRecord {
  id: string;
  partNumber: string | null;
  productNameEn: string;
  productNameTh: string | null;
  category: { name: string; color: string } | null;
  flammableStatus: FlammableStatus;
  status: RecordStatus;
  revisionDate: string | null;
  followUpDate: string | null;
  isOutdated: boolean;
  isMissingPdf: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  data: SdsRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

type ViewMode = 'gallery' | 'tile' | 'table';

export default function SdsListPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [records, setRecords] = useState<SdsRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [flammableFilter, setFlammableFilter] = useState<FlammableStatus | ''>('');
  const [statusFilter, setStatusFilter] = useState<RecordStatus | ''>('');
  const [showOverdue, setShowOverdue] = useState(searchParams.get('overdue') === 'true');
  const [showMissingPdf, setShowMissingPdf] = useState(false);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter sheet
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const fetchRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('pageSize', pageSize.toString());
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (flammableFilter) params.set('flammable', flammableFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (showOverdue) params.set('overdue', 'true');
      if (showMissingPdf) params.set('missingPdf', 'true');
      params.set('sortBy', sortBy);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/sds?${params}`);
      if (response.ok) {
        const data: PaginatedResponse = await response.json();
        setRecords(data.data);
        setTotalRecords(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, search, categoryFilter, flammableFilter, statusFilter, showOverdue, showMissingPdf, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('');
    setFlammableFilter('');
    setStatusFilter('');
    setShowOverdue(false);
    setShowMissingPdf(false);
    setCurrentPage(1);
  };

  const hasActiveFilters = search || categoryFilter || flammableFilter || statusFilter || showOverdue || showMissingPdf;

  const getFlammableIcon = (status: FlammableStatus) => {
    if (status === 'FLAMMABLE') return <Flame className="h-4 w-4 text-orange-500" />;
    if (status === 'NON_FLAMMABLE') return <span className="h-4 w-4 text-blue-500">💧</span>;
    return <span className="h-4 w-4">?</span>;
  };

  const getStatusBadge = (record: SdsRecord) => {
    const statusVariant = record.status === 'ACTIVE' ? 'success' : record.status === 'INACTIVE' ? 'secondary' : 'warning';
    return <Badge variant={statusVariant}>{t(`sds.${record.status.toLowerCase()}`)}</Badge>;
  };

  // Gallery Card View
  const renderGalleryView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {records.map((record) => (
        <Card key={record.id} className="group hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getFlammableIcon(record.flammableStatus)}
                {getStatusBadge(record)}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/sds/${record.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t('common.view')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/sds/${record.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t('common.edit')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/sds/${record.id}/upload`}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link href={`/sds/${record.id}`} className="block">
              <div className="aspect-[4/3] bg-muted rounded-lg mb-3 flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="font-semibold truncate">{record.productNameEn}</h3>
              {record.productNameTh && (
                <p className="text-sm text-muted-foreground truncate">{record.productNameTh}</p>
              )}
              {record.partNumber && (
                <p className="text-xs text-muted-foreground mt-1">PN: {record.partNumber}</p>
              )}
            </Link>

            <div className="mt-3 pt-3 border-t space-y-2">
              {record.category && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: record.category.color }} />
                  <span className="text-sm">{record.category.name}</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {record.followUpDate && (
                  <span className={isOverdue(record.followUpDate) ? 'text-red-500' : ''}>
                    Follow-up: {formatDate(record.followUpDate, 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {record.isOutdated && <Badge variant="destructive" className="text-xs">Outdated</Badge>}
                {record.isMissingPdf && <Badge variant="warning" className="text-xs">Missing PDF</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Table View
  const renderTableView = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => { setSortBy('productNameEn'); toggleSortOrder(); }}>
              Product Name {sortBy === 'productNameEn' && (sortOrder === 'asc' ? <SortAsc className="inline h-4 w-4" /> : <SortDesc className="inline h-4 w-4" />)}
            </TableHead>
            <TableHead>Part Number</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Flammable</TableHead>
            <TableHead className="cursor-pointer" onClick={() => { setSortBy('followUpDate'); toggleSortOrder(); }}>
              Follow-up {sortBy === 'followUpDate' && (sortOrder === 'asc' ? <SortAsc className="inline h-4 w-4" /> : <SortDesc className="inline h-4 w-4" />)}
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell><Checkbox /></TableCell>
              <TableCell>
                <Link href={`/sds/${record.id}`} className="font-medium hover:underline">
                  {record.productNameEn}
                </Link>
                {record.productNameTh && (
                  <p className="text-sm text-muted-foreground">{record.productNameTh}</p>
                )}
              </TableCell>
              <TableCell>{record.partNumber || '-'}</TableCell>
              <TableCell>
                {record.category && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: record.category.color }} />
                    {record.category.name}
                  </div>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(record)}</TableCell>
              <TableCell>{getFlammableIcon(record.flammableStatus)}</TableCell>
              <TableCell className={isOverdue(record.followUpDate) ? 'text-red-500' : ''}>
                {record.followUpDate ? formatDate(record.followUpDate, 'MMM d, yyyy') : '-'}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/sds/${record.id}`}><Eye className="mr-2 h-4 w-4" />View</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/sds/${record.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem><Sparkles className="mr-2 h-4 w-4" />AI Analyze</DropdownMenuItem>
                    <DropdownMenuItem><QrCode className="mr-2 h-4 w-4" />QR Code</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Tile View
  const renderTileView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {records.map((record) => (
        <div key={record.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
          <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {getFlammableIcon(record.flammableStatus)}
              <Link href={`/sds/${record.id}`} className="font-medium truncate hover:underline">
                {record.productNameEn}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {record.partNumber || 'No PN'} • {record.category?.name || 'Uncategorized'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {getStatusBadge(record)}
            {record.isOutdated && <Badge variant="destructive" className="text-xs">Outdated</Badge>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('sds.title')}</h1>
            <p className="text-muted-foreground">
              {totalRecords} records • {records.filter(r => r.isOutdated).length} outdated
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/export">
                <Download className="mr-2 h-4 w-4" />
                {t('common.export')}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/sds/new">
                <Plus className="mr-2 h-4 w-4" />
                {t('sds.addNew')}
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('filters.searchPlaceholder')}
              value={search}
              onChange={handleSearch}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              onClick={() => setIsFilterSheetOpen(true)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {t('common.filter')}
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {[categoryFilter, flammableFilter, statusFilter, showOverdue, showMissingPdf].filter(Boolean).length}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
          </p>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'gallery' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('gallery')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'tile' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('tile')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : records.length > 0 ? (
          <>
            {viewMode === 'gallery' && renderGalleryView()}
            {viewMode === 'table' && renderTableView()}
            {viewMode === 'tile' && renderTileView()}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">{t('messages.noResults')}</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Get started by adding your first SDS record'}
              </p>
              <Button asChild>
                <Link href="/sds/new">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('sds.addNew')}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Filter Sheet */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('common.filter')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.category')}</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.allCategories')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('filters.allCategories')}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('sds.flammableStatus')}</label>
              <Select value={flammableFilter} onValueChange={(v) => setFlammableFilter(v as FlammableStatus | '')}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.all')}</SelectItem>
                  <SelectItem value="FLAMMABLE">{t('sds.flammable')}</SelectItem>
                  <SelectItem value="NON_FLAMMABLE">{t('sds.nonFlammable')}</SelectItem>
                  <SelectItem value="UNKNOWN">{t('sds.unknown')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('common.status')}</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RecordStatus | '')}>
                <SelectTrigger>
                  <SelectValue placeholder={t('filters.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('filters.allStatuses')}</SelectItem>
                  <SelectItem value="ACTIVE">{t('sds.active')}</SelectItem>
                  <SelectItem value="INACTIVE">{t('sds.inactive')}</SelectItem>
                  <SelectItem value="EXPIRED">{t('sds.expired')}</SelectItem>
                  <SelectItem value="PENDING_REVIEW">{t('sds.pendingReview')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="overdue" 
                  checked={showOverdue}
                  onCheckedChange={(checked) => setShowOverdue(checked as boolean)}
                />
                <label htmlFor="overdue" className="text-sm cursor-pointer">
                  {t('filters.showOverdue')}
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox 
                  id="missingPdf" 
                  checked={showMissingPdf}
                  onCheckedChange={(checked) => setShowMissingPdf(checked as boolean)}
                />
                <label htmlFor="missingPdf" className="text-sm cursor-pointer">
                  {t('filters.showMissingPdf')}
                </label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear All Filters
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}