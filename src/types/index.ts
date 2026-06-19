import { FlammableStatus, RecordStatus, UserRole, NotificationType } from '@prisma/client';

export type { FlammableStatus, RecordStatus, UserRole, NotificationType };

export interface SdsRecordWithRelations {
  id: string;
  partNumber: string | null;
  productNameEn: string;
  productNameTh: string | null;
  categoryId: string | null;
  hazardSummary: string | null;
  hazardClass: string[];
  flammableStatus: FlammableStatus;
  status: RecordStatus;
  revisionDate: Date | null;
  followUpDate: Date | null;
  nextReviewDate: Date | null;
  supplier: string | null;
  manufacturer: string | null;
  productImageUrl: string | null;
  sdsPdfEnUrl: string | null;
  sdsPdfThUrl: string | null;
  externalLink: string | null;
  language: string[];
  tags: string[];
  notes: string | null;
  aiSummary: string | null;
  aiAnalysis: SdsAnalysisData | null;
  isAiAnalyzed: boolean;
  qrCodeUrl: string | null;
  isOutdated: boolean;
  isMissingPdf: boolean;
  isDuplicate: boolean;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: CategorySimple | null;
  createdBy: UserSimple | null;
  updatedBy: UserSimple | null;
}

export interface SdsAnalysisData {
  chemicalNames: string[];
  hazardClassifications: string[];
  ppeRecommendations: string[];
  storageRequirements: string[];
  firstAidInformation: string[];
}

export interface CategorySimple {
  id: string;
  name: string;
  nameTh: string | null;
  color: string;
  icon: string | null;
}

export interface UserSimple {
  id: string;
  name: string | null;
  email: string;
}

export interface DashboardStats {
  totalProducts: number;
  flammableProducts: number;
  nonFlammableProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  overdueReviews: number;
  expiringThisMonth: number;
  missingPdfs: number;
  aiAnalyzedCount: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface CategoryCount {
  category: string;
  count: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  created: number;
  updated: number;
}

export interface FilterParams {
  search?: string;
  category?: string;
  flammable?: FlammableStatus;
  status?: RecordStatus;
  overdue?: boolean;
  missingPdf?: boolean;
  sortBy?: 'productNameEn' | 'revisionDate' | 'followUpDate' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationSettings {
  reminder30Days: boolean;
  reminder60Days: boolean;
  reminder90Days: boolean;
  emailEnabled: boolean;
  recipientEmails: string[];
}

export interface SystemSetting {
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  group: string;
  label?: string;
  labelTh?: string;
  isPublic: boolean;
}

export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  includeFields?: (keyof SdsRecordWithRelations)[];
  filters?: FilterParams;
}

export interface ViewMode {
  mode: 'gallery' | 'tile' | 'table';
  density?: 'compact' | 'normal' | 'comfortable';
}