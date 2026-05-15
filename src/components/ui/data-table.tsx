'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  accessorKey?: keyof T;
  accessorFn?: (row: T) => React.ReactNode;
  header: string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  pageIndex?: number;
  pageSize?: number;
  pageCount?: number;
  isLoading?: boolean;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  pageIndex = 0,
  pageSize = 10,
  pageCount = 1,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  emptyMessage = 'No data available',
  className,
}: DataTableProps<T>) {
  const renderCell = (row: T, column: DataTableColumn<T>) => {
    if (column.cell) {
      return column.cell(row);
    }
    if (column.accessorKey) {
      return String(row[column.accessorKey] ?? '');
    }
    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    return '';
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border">
        <table className="w-full caption-bottom text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b transition-colors hover:bg-muted/50">
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={cn('p-4 align-middle', column.className)}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <select
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(0)}
                disabled={pageIndex === 0}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(pageIndex - 1)}
                disabled={pageIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(pageIndex + 1)}
                disabled={pageIndex >= pageCount - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange?.(pageCount - 1)}
                disabled={pageIndex >= pageCount - 1}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}