import { z } from "zod";

export const indonesiaProvinceSchema = z.string().min(2);

export const pharmacySchema = z.object({
  id: z.string().uuid(),
  legalName: z.string().min(1),
  displayName: z.string().min(1),
  siaNumber: z.string().min(1).describe("Surat Izin Apotek number"),
  npwp: z.string().min(15).max(16).optional(),
  nikFallbackEnabled: z.boolean().default(false),
  address: z.object({
    line1: z.string().min(1),
    city: z.string().min(1),
    province: indonesiaProvinceSchema,
    postalCode: z.string().min(5).max(10)
  }),
  pseRegistrationNumber: z.string().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date()
});

export type Pharmacy = z.infer<typeof pharmacySchema>;

export const userRoleSchema = z.enum(["OWNER", "PHARMACIST", "CASHIER", "AUDITOR"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.string().uuid(),
  pharmacyId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  role: userRoleSchema,
  active: z.boolean(),
  createdAt: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;
