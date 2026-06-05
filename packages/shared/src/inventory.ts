import { z } from "zod";

export const productScheduleSchema = z.enum(["GENERAL", "LIMITED_OTC", "PRESCRIPTION", "NARCOTIC", "PSYCHOTROPIC"]);
export type ProductSchedule = z.infer<typeof productScheduleSchema>;

export const productSchema = z.object({
  id: z.string().uuid(),
  bpomRegistrationNumber: z.string().min(1).optional(),
  gtin: z.string().min(8).optional(),
  name: z.string().min(1),
  manufacturer: z.string().min(1).optional(),
  strength: z.string().optional(),
  dosageForm: z.string().optional(),
  schedule: productScheduleSchema,
  reorderPoint: z.number().int().nonnegative().default(0)
});

export type Product = z.infer<typeof productSchema>;

export const stockBatchSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  batchNumber: z.string().min(1),
  lotNumber: z.string().optional(),
  expiryDate: z.coerce.date(),
  quantityOnHand: z.number().int().nonnegative(),
  unitCost: z.number().nonnegative().optional(),
  supplierName: z.string().optional()
});

export type StockBatch = z.infer<typeof stockBatchSchema>;

export const inventoryMovementTypeSchema = z.enum(["RECEIPT", "SALE", "ADJUSTMENT", "RETURN", "TRANSFER_OUT", "TRANSFER_IN"]);
export type InventoryMovementType = z.infer<typeof inventoryMovementTypeSchema>;

export const inventoryMovementSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid(),
  productId: z.string().uuid(),
  batchId: z.string().uuid().optional(),
  type: inventoryMovementTypeSchema,
  quantity: z.number().int(),
  reason: z.string().optional(),
  occurredAt: z.coerce.date(),
  actorUserId: z.string().uuid()
});

export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
