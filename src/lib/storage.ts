import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

const uuidv4 = randomUUID;

let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

// Supabase client for browser (lazy init)
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createClient(getSupabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    }
    return (_supabase as unknown as Record<string | symbol, unknown>)[prop as string];
  },
});

// Supabase client for server (lazy init)
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY || '');
    }
    return (_supabaseAdmin as unknown as Record<string | symbol, unknown>)[prop as string];
  },
});

// AWS S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const storageProvider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER || 'supabase';
const s3Bucket = process.env.AWS_S3_BUCKET || 'sds-documents';

export type StorageProvider = 'supabase' | 's3';

export function getStorageProvider(): StorageProvider {
  return storageProvider as StorageProvider;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  storageKey?: string;
  error?: string;
}

export async function uploadFile(
  file: File | Buffer,
  path: string,
  contentType: string,
  userId?: string
): Promise<UploadResult> {
  const fileName = `${userId || 'anonymous'}/${uuidv4()}-${path}`;

  try {
    if (getStorageProvider() === 'supabase') {
      const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

      const { data, error } = await supabaseAdmin.storage
        .from(s3Bucket)
        .upload(fileName, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: urlData } = supabaseAdmin.storage
        .from(s3Bucket)
        .getPublicUrl(data.path);

      return { success: true, url: urlData.publicUrl, storageKey: data.path };
    } else {
      const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: fileName,
          Body: buffer,
          ContentType: contentType,
        })
      );

      const url = `https://${s3Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      return { success: true, url, storageKey: fileName };
    }
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload failed' };
  }
}

export async function getFileUrl(storageKey: string): Promise<string | null> {
  try {
    if (getStorageProvider() === 'supabase') {
      const { data } = supabaseAdmin.storage.from(s3Bucket).getPublicUrl(storageKey);
      return data.publicUrl;
    } else {
      const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: storageKey,
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }
  } catch (error) {
    console.error('Get file URL error:', error);
    return null;
  }
}

export async function deleteFile(storageKey: string): Promise<boolean> {
  try {
    if (getStorageProvider() === 'supabase') {
      const { error } = await supabaseAdmin.storage.from(s3Bucket).remove([storageKey]);
      if (error) throw error;
    } else {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: s3Bucket,
          Key: storageKey,
        })
      );
    }
    return true;
  } catch (error) {
    console.error('Delete file error:', error);
    return false;
  }
}

export async function getSignedDownloadUrl(storageKey: string, expiresIn = 3600): Promise<string | null> {
  try {
    if (getStorageProvider() === 'supabase') {
      const { data, error } = await supabaseAdmin.storage
        .from(s3Bucket)
        .createSignedUrl(storageKey, expiresIn);
      if (error) throw error;
      return data.signedUrl;
    } else {
      const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: storageKey,
      });
      return await getSignedUrl(s3Client, command, { expiresIn });
    }
  } catch (error) {
    console.error('Get signed URL error:', error);
    return null;
  }
}