import { AuditAction } from '@prisma/client';
import prisma from './prisma';

export interface AuditLogData {
  userId?: string;
  sdsRecordId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  descriptionTh?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        sdsRecordId: data.sdsRecordId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes as never,
        oldValues: data.oldValues as never,
        newValues: data.newValues as never,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        description: data.description,
        descriptionTh: data.descriptionTh,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

export function detectChanges<T extends Record<string, unknown>>(
  oldRecord: T,
  newRecord: Partial<T>
): Record<string, { old: unknown; new: unknown }> | undefined {
  const changes: Record<string, { old: unknown; new: unknown }> = {};
  const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);

  for (const key of allKeys) {
    const oldValue = oldRecord[key];
    const newValue = newRecord[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }

  return Object.keys(changes).length > 0 ? changes : undefined;
}

export function getActionDescription(action: AuditAction, entityName: string, isThai = false): string {
  const descriptions: Record<AuditAction, { en: string; th: string }> = {
    CREATE: { en: `Created ${entityName}`, th: `สร้าง ${entityName}` },
    UPDATE: { en: `Updated ${entityName}`, th: `แก้ไข ${entityName}` },
    DELETE: { en: `Deleted ${entityName}`, th: `ลบ ${entityName}` },
    VIEW: { en: `Viewed ${entityName}`, th: `ดู ${entityName}` },
    DOWNLOAD: { en: `Downloaded ${entityName}`, th: `ดาวน์โหลด ${entityName}` },
    UPLOAD: { en: `Uploaded ${entityName}`, th: `อัปโหลด ${entityName}` },
    LOGIN: { en: `User logged in`, th: `ผู้ใช้เข้าสู่ระบบ` },
    LOGOUT: { en: `User logged out`, th: `ผู้ใช้ออกจากระบบ` },
    EXPORT: { en: `Exported ${entityName}`, th: `ส่งออก ${entityName}` },
    AI_ANALYSIS: { en: `AI analysis on ${entityName}`, th: `วิเคราะห์ AI บน ${entityName}` },
    BULK_UPDATE: { en: `Bulk updated ${entityName}`, th: `อัปเดตหลายรายการ ${entityName}` },
  };

  return isThai ? descriptions[action]?.th || descriptions[action].en : descriptions[action]?.en;
}