import { z } from "zod";

export const complianceConnectorSchema = z.enum(["SATUSEHAT", "EMESO", "BPOM_VERIFY", "CORETAX", "QRIS"]);
export type ComplianceConnector = z.infer<typeof complianceConnectorSchema>;

export const complianceStatusSchema = z.enum(["PENDING", "QUEUED", "REPORTED", "FAILED", "DEAD_LETTER", "SKIPPED"]);
export type ComplianceStatus = z.infer<typeof complianceStatusSchema>;

export const complianceJobSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid(),
  connector: complianceConnectorSchema,
  sourceEventId: z.string().uuid().optional(),
  status: complianceStatusSchema,
  attemptCount: z.number().int().nonnegative(),
  nextAttemptAt: z.coerce.date().optional(),
  lastError: z.string().optional(),
  externalReference: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type ComplianceJob = z.infer<typeof complianceJobSchema>;

export const satuSehatPharmacyServiceEventSchema = z.object({
  dispensingEventId: z.string().uuid(),
  organizationId: z.string().min(1),
  practitionerNik: z.string().optional(),
  fhirPayload: z.record(z.unknown())
});

export type SatuSehatPharmacyServiceEvent = z.infer<typeof satuSehatPharmacyServiceEventSchema>;

export const adverseEventSeveritySchema = z.enum(["MILD", "MODERATE", "SEVERE", "LIFE_THREATENING", "DEATH"]);

export const adverseEventReportSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid(),
  dispensingEventId: z.string().uuid().optional(),
  suspectedProductId: z.string().uuid().optional(),
  patientInitials: z.string().max(8).optional(),
  description: z.string().min(1),
  severity: adverseEventSeveritySchema,
  occurredAt: z.coerce.date(),
  reporterName: z.string().min(1),
  reporterContact: z.string().optional(),
  consentCaptured: z.boolean()
});

export type AdverseEventReport = z.infer<typeof adverseEventReportSchema>;

export const bpomDataMatrixVerifyRequestSchema = z.object({
  rawDataMatrix: z.string().min(1),
  gtin: z.string().optional(),
  serialNumber: z.string().optional(),
  batchNumber: z.string().optional(),
  expiryDate: z.string().optional()
});

export const bpomDataMatrixVerifyResponseSchema = z.object({
  authentic: z.boolean(),
  status: z.enum(["VALID", "INVALID", "EXPIRED", "RECALLED", "UNKNOWN"]),
  productName: z.string().optional(),
  registrationNumber: z.string().optional(),
  checkedAt: z.coerce.date(),
  rawProviderResponse: z.record(z.unknown()).optional()
});

export type BpomDataMatrixVerifyRequest = z.infer<typeof bpomDataMatrixVerifyRequestSchema>;
export type BpomDataMatrixVerifyResponse = z.infer<typeof bpomDataMatrixVerifyResponseSchema>;

export const coretaxInvoiceStatusSchema = z.enum(["DRAFT", "UPLOADED", "VALIDATED", "REJECTED", "QR_ISSUED"]);

export const coretaxInvoiceSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid(),
  saleId: z.string().uuid(),
  buyerNpwp: z.string().optional(),
  buyerNik: z.string().optional(),
  useNationalIdExportWorkaround: z.boolean().default(false),
  status: coretaxInvoiceStatusSchema,
  nsfp: z.string().optional(),
  qrUrl: z.string().url().optional(),
  lastError: z.string().optional()
});

export type CoretaxInvoice = z.infer<typeof coretaxInvoiceSchema>;
