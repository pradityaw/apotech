import { z } from "zod";

export const paymentMethodSchema = z.enum(["CASH", "QRIS", "CARD", "TRANSFER"]);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const dispensingLineSchema = z.object({
  productId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  prescriptionRequired: z.boolean(),
  prescriptionNumber: z.string().optional()
});

export const dispensingEventSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid(),
  cashierUserId: z.string().uuid(),
  pharmacistUserId: z.string().uuid().optional(),
  patientReference: z.string().optional().describe("Minimized local patient reference; avoid unnecessary PII."),
  lines: z.array(dispensingLineSchema).min(1),
  grossAmount: z.number().nonnegative(),
  paymentMethod: paymentMethodSchema,
  qrisTransactionId: z.string().optional(),
  completedOffline: z.boolean().default(false),
  syncClientId: z.string().optional(),
  dispensedAt: z.coerce.date()
});

export type DispensingEvent = z.infer<typeof dispensingEventSchema>;
