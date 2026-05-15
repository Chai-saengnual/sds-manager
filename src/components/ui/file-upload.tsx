'use client';

import * as React from 'react';
import { Upload, X, FileText, Image, FileArchive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

export interface FileUploadProps {
  value?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image;
  if (type === 'application/pdf' || type.includes('document')) return FileText;
  return FileText;
}

export function FileUpload({
  value = [],
  onChange,
  accept,
  multiple = true,
  maxSize = 10,
  maxFiles = 5,
  disabled = false,
  className,
  label,
  hint,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    setError(null);

    const newFiles: UploadedFile[] = [];
    const remainingSlots = maxFiles - value.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSize}MB limit`);
        return;
      }

      if (accept && !accept.split(',').some((ext) => {
        const pattern = ext.trim().toLowerCase();
        if (pattern.startsWith('.')) {
          return file.name.toLowerCase().endsWith(pattern);
        }
        if (pattern.includes('/*')) {
          return file.type.match(new RegExp(pattern.replace('/*', '/.*')));
        }
        return file.type.includes(pattern);
      })) {
        setError(`File ${file.name} has invalid type`);
        return;
      }

      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        file,
      });
    });

    if (newFiles.length > 0) {
      onChange?.([...value, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    onChange?.(value.filter((f) => f.id !== id));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-muted-foreground/25',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="absolute inset-0 z-50 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={(e) => handleFileChange(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full bg-muted p-3">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and drop
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <div
                key={file.id}
                className="flex items-center justify-between rounded-lg border bg-card p-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {accept ? `Accepted: ${accept}` : 'All file types accepted'} • Max {maxSize}MB per file
        {multiple && ` • Up to ${maxFiles} files`}
      </p>
    </div>
  );
}