import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { uploadFile } from '@/lib/storage';
import { createAuditLog } from '@/lib/audit';
import { FileType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as FileType;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validFileTypes: FileType[] = ['SDS_PDF_EN', 'SDS_PDF_TH', 'PRODUCT_IMAGE'];
    if (!validFileTypes.includes(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Validate file type
    const allowedMimeTypes: Record<FileType, string[]> = {
      SDS_PDF_EN: ['application/pdf'],
      SDS_PDF_TH: ['application/pdf'],
      PRODUCT_IMAGE: ['image/jpeg', 'image/png', 'image/webp'],
      QR_CODE: ['image/png', 'image/svg+xml'],
      EXPORT: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      OTHER: [],
    };

    if (!allowedMimeTypes[fileType].includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type for this category' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 });
    }

    const path = `${fileType.toLowerCase()}/${id}/${file.name}`;
    const uploadResult = await uploadFile(file, path, file.type, session.user.id);

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 500 });
    }

    // Create file record
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        sdsRecordId: id,
        fileName: file.name,
        fileType,
        fileSize: file.size,
        mimeType: file.type,
        storageKey: uploadResult.storageKey!,
        storageUrl: uploadResult.url!,
        uploadedBy: session.user.id,
      },
    });

    // Update SDS record with file URL
    const updateData: Record<string, string> = {};
    if (fileType === 'SDS_PDF_EN') updateData.sdsPdfEnUrl = uploadResult.url!;
    if (fileType === 'SDS_PDF_TH') updateData.sdsPdfThUrl = uploadResult.url!;
    if (fileType === 'PRODUCT_IMAGE') updateData.productImageUrl = uploadResult.url!;

    if (Object.keys(updateData).length > 0) {
      await prisma.sdsRecord.update({
        where: { id },
        data: { ...updateData, isMissingPdf: false },
      });
    }

    // Create audit log
    await createAuditLog({
      userId: session.user.id,
      sdsRecordId: id,
      action: 'UPLOAD',
      entityType: 'uploaded_file',
      entityId: uploadedFile.id,
      description: `Uploaded ${fileType}: ${file.name}`,
    });

    return NextResponse.json({
      file: uploadedFile,
      url: uploadResult.url,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}