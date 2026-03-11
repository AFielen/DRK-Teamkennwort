import { db } from './db';
import { auditLog } from './schema';
import type { AuditAction } from './audit-labels';

export type { AuditAction };
export { AUDIT_LABELS } from './audit-labels';

interface LogAuditParams {
  tenantId: string;
  userId?: string;
  teamId?: string;
  entryId?: string;
  action: AuditAction;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  await db.insert(auditLog).values({
    tenantId: params.tenantId,
    userId: params.userId,
    teamId: params.teamId,
    entryId: params.entryId,
    action: params.action,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    metadata: params.metadata,
  });
}
