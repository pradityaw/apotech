import { z } from "zod";

export const consentPurposeSchema = z.enum(["ACCOUNT_REGISTRATION", "DISPENSING", "SATUSEHAT_REPORTING", "EMESO_REPORTING", "TAX_INVOICE"]);
export type ConsentPurpose = z.infer<typeof consentPurposeSchema>;

export const consentRecordSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid(),
  subjectReference: z.string().min(1),
  purpose: consentPurposeSchema,
  granted: z.boolean(),
  capturedAt: z.coerce.date(),
  revokedAt: z.coerce.date().optional(),
  evidence: z.record(z.unknown()).optional()
});

export type ConsentRecord = z.infer<typeof consentRecordSchema>;

export const auditActionSchema = z.enum(["CREATE", "READ", "UPDATE", "DELETE", "EXPORT", "SUBMIT_COMPLIANCE"]);
export type AuditAction = z.infer<typeof auditActionSchema>;

export const auditLogSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid().optional(),
  actorUserId: z.string().uuid().optional(),
  action: auditActionSchema,
  resourceType: z.string().min(1),
  resourceId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  occurredAt: z.coerce.date()
});

export type AuditLog = z.infer<typeof auditLogSchema>;
