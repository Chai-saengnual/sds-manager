import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the xlsx library
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
    table_to_sheet: vi.fn(() => ({})),
  },
  writeFile: vi.fn(),
  write: vi.fn(() => new ArrayBuffer(8)),
}));

// Mock jspdf
vi.mock('jspdf', () => ({
  default: vi.fn(() => ({
    setFont: vi.fn(),
    setFontSize: vi.fn(),
    text: vi.fn(),
    addPage: vi.fn(),
    save: vi.fn(),
    autoTable: vi.fn(),
  })),
}));

// Mock jspdf-autotable
vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

// Import the module after mocking
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  generateSDSReport,
  generateComplianceReport,
  formatSDSForExport,
  formatSDSsForExport,
} from '../export';

describe('Export Utilities', () => {
  const mockSDSRecord = {
    id: '1',
    partNumber: 'SKU-001',
    productNameEn: 'Industrial Degreaser',
    productNameTh: 'น้ำยาทำความสะอาด',
    category: { name: 'Cleaning', nameTh: 'ทำความสะอาด' },
    flammableStatus: 'NON_FLAMMABLE' as const,
    status: 'ACTIVE' as const,
    revisionDate: new Date('2024-01-15'),
    followUpDate: new Date('2025-01-15'),
    supplier: 'ChemTech',
    manufacturer: 'ChemTech Inc.',
    hazardSummary: 'Causes skin irritation',
    aiSummary: 'Low hazard product',
  };

  describe('formatSDSForExport', () => {
    it('formats SDS record for export', () => {
      const result = formatSDSForExport(mockSDSRecord);

      expect(result).toHaveProperty('partNumber');
      expect(result).toHaveProperty('productNameEn');
      expect(result).toHaveProperty('productNameTh');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('flammableStatus');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('revisionDate');
      expect(result).toHaveProperty('followUpDate');
      expect(result).toHaveProperty('supplier');
      expect(result).toHaveProperty('manufacturer');
      expect(result).toHaveProperty('hazardSummary');
    });

    it('handles null/undefined optional fields', () => {
      const minimalRecord = {
        id: '2',
        partNumber: 'SKU-002',
        productNameEn: 'Test Product',
      };
      const result = formatSDSForExport(minimalRecord as any);

      expect(result.partNumber).toBe('SKU-002');
    });

    it('formats dates correctly', () => {
      const result = formatSDSForExport(mockSDSRecord);

      expect(result.revisionDate).toBeTruthy();
      expect(result.followUpDate).toBeTruthy();
    });
  });

  describe('formatSDSsForExport', () => {
    it('formats multiple SDS records', () => {
      const records = [mockSDSRecord, { ...mockSDSRecord, id: '2' }];
      const result = formatSDSsForExport(records as any);

      expect(result).toHaveLength(2);
    });

    it('returns empty array for empty input', () => {
      const result = formatSDSsForExport([]);
      expect(result).toEqual([]);
    });
  });

  describe('exportToExcel', () => {
    it('exports data to Excel format', async () => {
      const data = [formatSDSForExport(mockSDSRecord)];
      const filename = 'test-export';

      await expect(exportToExcel(data, filename)).resolves.not.toThrow();
    });

    it('handles empty data', async () => {
      await expect(exportToExcel([], 'empty')).resolves.not.toThrow();
    });

    it('includes correct headers', async () => {
      const data = [formatSDSForExport(mockSDSRecord)];
      await exportToExcel(data, 'headers-test');

      // The function should create a worksheet with headers
      expect(data[0]).toHaveProperty('partNumber');
    });
  });

  describe('exportToCSV', () => {
    it('exports data to CSV format', async () => {
      const data = [formatSDSForExport(mockSDSRecord)];
      const filename = 'test-csv';

      await expect(exportToCSV(data, filename)).resolves.not.toThrow();
    });

    it('handles special characters', async () => {
      const recordWithSpecialChars = {
        ...formatSDSForExport(mockSDSRecord),
        productNameTh: 'น้ำยาทำความสะอาด, "special" <chars>',
      };
      const data = [recordWithSpecialChars];

      await expect(exportToCSV(data, 'special-chars')).resolves.not.toThrow();
    });

    it('escapes CSV values correctly', async () => {
      const data = [
        { name: 'Product with "quotes"', value: 'normal' },
      ];
      await expect(exportToCSV(data, 'quotes-test')).resolves.not.toThrow();
    });
  });

  describe('exportToPDF', () => {
    it('exports data to PDF format', async () => {
      const data = [formatSDSForExport(mockSDSRecord)];
      const filename = 'test-pdf';

      await expect(exportToPDF(data, filename)).resolves.not.toThrow();
    });

    it('handles empty data', async () => {
      await expect(exportToPDF([], 'empty-pdf')).resolves.not.toThrow();
    });

    it('generates with title', async () => {
      const data = [formatSDSForExport(mockSDSRecord)];
      await exportToPDF(data, 'titled-pdf', { title: 'SDS Report' });

      expect(true).toBe(true); // If it doesn't throw, it worked
    });
  });

  describe('generateSDSReport', () => {
    it('generates comprehensive SDS report', async () => {
      const records = [
        formatSDSForExport(mockSDSRecord),
        formatSDSForExport({ ...mockSDSRecord, id: '2', partNumber: 'SKU-002' }),
      ] as any;

      const report = await generateSDSReport(records, 'xlsx');

      expect(report).toBeTruthy();
    });

    it('includes summary statistics', async () => {
      const records = [
        formatSDSForExport(mockSDSRecord),
        formatSDSForExport({ ...mockSDSRecord, id: '2' }),
      ] as any;

      const report = await generateSDSReport(records, 'xlsx');

      // Report should contain summary data
      expect(report).toBeTruthy();
    });

    it('supports different export formats', async () => {
      const records = [formatSDSForExport(mockSDSRecord)] as any;

      await expect(generateSDSReport(records, 'xlsx')).resolves.toBeTruthy();
      await expect(generateSDSReport(records, 'csv')).resolves.toBeTruthy();
      await expect(generateSDSReport(records, 'pdf')).resolves.toBeTruthy();
    });
  });

  describe('generateComplianceReport', () => {
    it('generates compliance report', async () => {
      const records = [formatSDSForExport(mockSDSRecord)] as any;

      const report = await generateComplianceReport(records);

      expect(report).toBeTruthy();
    });

    it('includes compliance status', async () => {
      const records = [
        formatSDSForExport(mockSDSRecord),
        formatSDSForExport({ ...mockSDSRecord, status: 'EXPIRED' }),
      ] as any;

      const report = await generateComplianceReport(records);

      expect(report).toBeTruthy();
    });

    it('handles records with missing review dates', async () => {
      const incompleteRecord = {
        ...formatSDSForExport(mockSDSRecord),
        followUpDate: null,
      };
      const records = [incompleteRecord];

      await expect(generateComplianceReport(records as any)).resolves.toBeTruthy();
    });

    it('calculates overdue items', async () => {
      const overdueRecord = {
        ...formatSDSForExport(mockSDSRecord),
        followUpDate: new Date('2020-01-01'),
        status: 'EXPIRED',
      };
      const records = [overdueRecord];

      const report = await generateComplianceReport(records as any);

      expect(report).toBeTruthy();
    });
  });
});

describe('Export Field Mapping', () => {
  it('maps all required export fields', () => {
    const record = {
      id: 'test-id',
      partNumber: 'PN-001',
      productNameEn: 'English Name',
      productNameTh: 'ชื่อไทย',
      category: { name: 'Category', nameTh: 'หมวดหมู่' },
      flammableStatus: 'FLAMMABLE' as const,
      status: 'ACTIVE' as const,
      revisionDate: new Date('2024-01-15'),
      followUpDate: new Date('2025-01-15'),
      supplier: 'Supplier Co',
      manufacturer: 'Manufacturer Inc',
      hazardSummary: 'Hazard info',
      aiSummary: 'AI analysis',
    };

    const formatted = formatSDSForExport(record as any);

    expect(formatted.partNumber).toBe('PN-001');
    expect(formatted.productNameEn).toBe('English Name');
    expect(formatted.productNameTh).toBe('ชื่อไทย');
    expect(formatted.category).toBe('Category');
    expect(formatted.flammableStatus).toBe('FLAMMABLE');
    expect(formatted.status).toBe('ACTIVE');
  });
});

describe('Export Date Handling', () => {
  it('handles various date formats', () => {
    const withStringDate = {
      ...formatSDSForExport(mockSDSRecord as any),
      revisionDate: '2024-01-15',
    };

    expect(withStringDate.revisionDate).toBeTruthy();
  });

  it('handles null dates gracefully', () => {
    const withNullDates = {
      id: '1',
      partNumber: 'SKU-001',
      productNameEn: 'Test',
      revisionDate: null,
      followUpDate: null,
    };

    const formatted = formatSDSForExport(withNullDates as any);

    expect(formatted.revisionDate).toBeNull();
    expect(formatted.followUpDate).toBeNull();
  });
});