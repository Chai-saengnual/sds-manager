'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';

const sdsFormSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  casNumber: z.string().optional(),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().optional(),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  supplier: z.string().optional(),
  contactInfo: z.string().optional(),
  expiryDate: z.string().optional(),
  storageCondition: z.string().optional(),
  hazardClass: z.string().optional(),
  signalWord: z.string().optional(),
  ghsStatements: z.string().optional(),
});

export type SDSFormData = z.infer<typeof sdsFormSchema>;

export interface SDSFormProps {
  initialData?: Partial<SDSFormData>;
  onSubmit: (data: SDSFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function SDSForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: SDSFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SDSFormData>({
    resolver: zodResolver(sdsFormSchema),
    defaultValues: initialData,
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{initialData?.productName ? 'Edit SDS' : 'New Safety Data Sheet'}</CardTitle>
        <CardDescription>
          Fill in the details for the chemical or product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="productName">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="productName"
                {...register('productName')}
                placeholder="e.g., Acetone"
              />
              {errors.productName && (
                <p className="text-sm text-destructive">{errors.productName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="casNumber">CAS Number</Label>
              <Input
                id="casNumber"
                {...register('casNumber')}
                placeholder="e.g., 67-64-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">
                Manufacturer <span className="text-destructive">*</span>
              </Label>
              <Input
                id="manufacturer"
                {...register('manufacturer')}
                placeholder="e.g., Sigma-Aldrich"
              />
              {errors.manufacturer && (
                <p className="text-sm text-destructive">{errors.manufacturer.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">
                Department <span className="text-destructive">*</span>
              </Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="e.g., Chemistry Lab"
              />
              {errors.department && (
                <p className="text-sm text-destructive">{errors.department.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="e.g., Cabinet A-3"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  {...register('quantity')}
                  type="number"
                  placeholder="e.g., 500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  {...register('unit')}
                  placeholder="e.g., mL"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                {...register('supplier')}
                placeholder="e.g., Fisher Scientific"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactInfo">Contact Info</Label>
              <Input
                id="contactInfo"
                {...register('contactInfo')}
                placeholder="e.g., emergency@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                {...register('expiryDate')}
                type="date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageCondition">Storage Condition</Label>
              <Input
                id="storageCondition"
                {...register('storageCondition')}
                placeholder="e.g., Room temp, ventilated"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hazardClass">Hazard Class</Label>
              <Input
                id="hazardClass"
                {...register('hazardClass')}
                placeholder="e.g., Flammable liquid"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signalWord">Signal Word</Label>
              <select
                id="signalWord"
                {...register('signalWord')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select...</option>
                <option value="Danger">Danger</option>
                <option value="Warning">Warning</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ghsStatements">GHS Statements</Label>
            <textarea
              id="ghsStatements"
              {...register('ghsStatements')}
              className={cn(
                'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
              )}
              placeholder="Enter GHS hazard statements (H-codes)"
            />
          </div>

          <div className="flex justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData?.productName ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}