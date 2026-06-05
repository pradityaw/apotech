import { z } from "zod";

export const qrisProviderSchema = z.enum(["MIDTRANS", "XENDIT"]);
export type QrisProvider = z.infer<typeof qrisProviderSchema>;

export const qrisChargeRequestSchema = z.object({
  pharmacyId: z.string().uuid(),
  saleId: z.string().uuid(),
  provider: qrisProviderSchema,
  amount: z.number().positive(),
  currency: z.literal("IDR").default("IDR"),
  customerReference: z.string().optional()
});

export const qrisChargeResponseSchema = z.object({
  transactionId: z.string().min(1),
  providerReference: z.string().min(1),
  qrString: z.string().min(1),
  expiresAt: z.coerce.date(),
  snapSignatureVersion: z.string().optional()
});

export type QrisChargeRequest = z.infer<typeof qrisChargeRequestSchema>;
export type QrisChargeResponse = z.infer<typeof qrisChargeResponseSchema>;
