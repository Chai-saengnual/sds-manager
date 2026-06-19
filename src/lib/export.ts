import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { formatDate } from './utils';

export type ExportCellValue = string | number | boolean | Date | null | undefined;
export type ExportCellFormatter = (value: unknown, row: unknown) => string;

export interface ExportColumn {
  key: string;
  header: string;
  formatter?: ExportCellFormatter;
  width?: number;
}

export interface ExportOptions {
  filename?: string;
  sheetName?: string;
  title?: string;
  includeTimestamp?: boolean;
}

function getHeaders(columns: ExportColumn[]): string[] {
  return columns.map((col) => col.header);
}

function getCellValue(row: Record<string, unknown>, key: string): unknown {
  if (key.includes('.')) {
    return key.split('.').reduce<unknown>((obj, k) => {
      if (obj && typeof obj === 'object') {
        return (obj as Record<string, unknown>)[k];
      }
      return undefined;
    }, row);
  }
  return row[key];
}

function formatCellValue(value: unknown, formatter?: ExportCellFormatter): string {
  if (formatter) return formatter(value, null);
  if (value === null || value === undefined) return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return formatDate(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  options: ExportOptions = {},
): Uint8Array {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const worksheetData = data.map((row) =>
    columns.map((col) => formatCellValue(getCellValue(row, col.key), col.formatter)),
  );

  const ws = XLSX.utils.aoa_to_sheet([getHeaders(columns), ...worksheetData]);

  const colWidths = columns.map((col, i) => ({
    wch: col.width || Math.max(15, getHeaders(columns)[i]?.length || 0),
  }));
  ws['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, ws, options.sheetName || 'Data');

  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(excelBuffer as ArrayBuffer);
}

export function exportToCSV(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  options: ExportOptions = {},
): string {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const headers = getHeaders(columns);
  const rows = data.map((row) =>
    columns.map((col) => {
      const formattedValue = formatCellValue(getCellValue(row, col.key), col.formatter);
      if (formattedValue.includes(',') || formattedValue.includes('"') || formattedValue.includes('\n')) {
        return `"${formattedValue.replace(/"/g, '""')}"`;
      }
      return formattedValue;
    }),
  );

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

export function exportToPDF(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  options: ExportOptions = {},
): Uint8Array {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  if (options.title) {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title, pageWidth / 2, 15, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Generated: ${format(new Date(), 'PPP p')}`,
    pageWidth / 2,
    options.title ? 22 : 15,
    { align: 'center' },
  );

  const headers = getHeaders(columns);
  const tableData = data.map((row) =>
    columns.map((col) => formatCellValue(getCellValue(row, col.key), col.formatter)),
  );

  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: options.title ? 28 : 20,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    columnStyles: columns.reduce<Record<number, { cellWidth?: number }>>((acc, col, i) => {
      if (col.width) acc[i] = { cellWidth: col.width };
      return acc;
    }, {}),
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 15,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'right' },
    );
  }

  return doc.output('arraybuffer') as unknown as Uint8Array;
}

export function downloadExport(data: Uint8Array | string, filename: string, mimeType: string): void {
  const blob = new Blob([data as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
