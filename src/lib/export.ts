import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatDate } from './utils';

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
  width?: number;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  title?: string;
  includeTimestamp?: boolean;
}

function getFilename(baseName: string, extension: string, options?: ExportOptions): string {
  const timestamp = options?.includeTimestamp !== false ? `_${format(new Date(), 'yyyyMMdd_HHmmss')}` : '';
  return `${baseName}${timestamp}.${extension}`;
}

function getColumnKeys<T>(columns: ExportColumn<T>[]): (keyof T | string)[] {
  return columns.map(col => col.key);
}

function getHeaders(columns: ExportColumn<unknown>[]): string[] {
  return columns.map(col => col.header);
}

function formatCellValue(value: unknown, formatter?: (value: unknown, row: unknown) => string): string {
  if (formatter) return formatter(value, null as unknown);
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Export data to Excel (.xlsx) format
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions = {}
): Uint8Array {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheetData = data.map(row => {
    return columns.map(col => {
      const value = col.key.includes('.')
        ? col.key.split('.').reduce((obj, key) => (obj as Record<string, unknown>)?.[key], row as unknown)
        : row[col.key as keyof T];
      return formatCellValue(value, col.formatter);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet([
    getHeaders(columns),
    ...worksheetData
  ]);

  // Set column widths
  const colWidths = columns.map((col, i) => ({
    wch: col.width || Math.max(15, getHeaders(columns)[i]?.length || 0)
  }));
  ws['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, options.sheetName || 'Data');

  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(excelBuffer as ArrayBuffer);
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions = {}
): string {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = getHeaders(columns);
  const rows = data.map(row => {
    return columns.map(col => {
      const value = col.key.includes('.')
        ? col.key.split('.').reduce((obj, key) => (obj as Record<string, unknown>)?.[key], row as unknown)
        : row[col.key as keyof T];
      const formattedValue = formatCellValue(value, col.formatter);
      // Escape CSV special characters
      if (formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')) {
        return `"${formattedValue.replace(/"/g, '""')}"`;
      }
      return formattedValue;
    });
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Export data to PDF format using jsPDF with autoTable
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions = {}
): Uint8Array {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Add title if provided
  if (options.title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, pageWidth / 2, 15, { align: 'center' });
  }

  // Add timestamp
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'PPP p')}`, pageWidth / 2, options.title ? 22 : 15, { align: 'center' });

  // Prepare table data
  const headers = getHeaders(columns);
  const tableData = data.map(row => {
    return columns.map(col => {
      const value = col.key.includes('.')
        ? col.key.split('.').reduce((obj, key) => (obj as Record<string, unknown>)?.[key], row as unknown)
        : row[col.key as keyof T];
      return formatCellValue(value, col.formatter);
    });
  });

  // Create table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: options.title ? 28 : 20,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185], // Blue header
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.width) {
        acc[i] = { cellWidth: col.width };
      }
      return acc;
    }, {} as Record<number, { cellWidth?: number }>),
  });

  // Add footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' }
    );
  }

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

/**
 * Helper to download a file from buffer data
 */
export function downloadExport(
  data: Uint8Array | string,
  filename: string,
  mimeType: string
): void {
  const blob = data instanceof Uint8Array
    ? new Blob([data], { type: mimeType })
    : new Blob([data], { type: mimeType });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format data for SDS export (specific to SDS Manager app)
 */
export function formatSdsRecordForExport(record: Record<string, unknown>): Record<string, unknown> {
  return {
    'Part Number': record.partNumber || '-',
    'Product Name (EN)': record.productNameEn,
    'Product Name (TH)': record.productNameTh || '-',
    'Category': record.categoryName || '-',
    'Status': record.status,
    'Flammable': record.flammableStatus,
    'Revision Date': record.revisionDate ? formatDate(record.revisionDate as string) : '-',
    'Follow-up Date': record.followUpDate ? formatDate(record.followUpDate as string) : '-',
    'Next Review Date': record.nextReviewDate ? formatDate(record.nextReviewDate as string) : '-',
    'Supplier': record.supplier || '-',
    'Manufacturer': record.manufacturer || '-',
    'Is Outdated': record.isOutdated ? 'Yes' : 'No',
    'Is Missing PDF': record.isMissingPdf ? 'Yes' : 'No',
    'Language': Array.isArray(record.language) ? record.language.join(', ') : '-',
    'Tags': Array.isArray(record.tags) ? record.tags.join(', ') : '-',
    'Notes': record.notes || '-',
    'Created At': record.createdAt ? formatDate(record.createdAt as string) : '-',
    'Updated At': record.updatedAt ? formatDate(record.updatedAt as string) : '-',
  };
}