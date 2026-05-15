'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Download } from 'lucide-react';

export interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
  download?: boolean;
  downloadName?: string;
}

export function QRCode({ value, size = 200, className, download, downloadName }: QRCodeProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isClient, setIsClient] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (!isClient || !canvasRef.current || !value) return;

    const generateQR = async () => {
      try {
        const QRCode = await import('qrcode');
        const canvas = canvasRef.current!;
        
        await QRCode.toCanvas(canvas, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });
        setError(null);
      } catch (err) {
        setError('Failed to generate QR code');
        console.error('QR generation error:', err);
      }
    };

    generateQR();
  }, [isClient, value, size]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = downloadName || `qrcode-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  if (!isClient) {
    return (
      <div
        className={cn('flex items-center justify-center bg-muted rounded-lg', className)}
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn('flex items-center justify-center bg-destructive/10 rounded-lg', className)}
        style={{ width: size, height: size }}
      >
        <span className="text-sm text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <div className={cn('relative inline-block', className)}>
      <canvas ref={canvasRef} />
      {download && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute bottom-2 right-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      )}
    </div>
  );
}