import { z } from "zod";
import { dispensingEventSchema } from "@apotech/shared";

export const offlineSyncEnvelopeSchema = z.object({
  clientId: z.string().min(1),
  deviceId: z.string().min(1),
  pharmacyId: z.string().uuid(),
  logicalClock: z.number().int().nonnegative(),
  createdOfflineAt: z.coerce.date(),
  payload: dispensingEventSchema
});

export type OfflineSyncEnvelope = z.infer<typeof offlineSyncEnvelopeSchema>;

export const posImplementationNote = "Deferred: implement as React Native Android-first or PWA after API/compliance foundation stabilizes.";
