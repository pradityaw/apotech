import { Injectable } from "@nestjs/common";
import type { Pharmacy } from "@apotech/shared";

@Injectable()
export class PharmaciesService {
  demoPharmacy(): Pharmacy {
    const now = new Date();
    return {
      id: "6db9f5f8-b49f-48be-a6ba-e34fbb9c39bd",
      legalName: "PT ApoTech Demo Indonesia",
      displayName: "Apotek Melati",
      siaNumber: "SIA-DEMO-001",
      npwp: "0123456789012345",
      nikFallbackEnabled: true,
      address: {
        line1: "Jl. Kesehatan No. 7",
        city: "Jakarta Selatan",
        province: "DKI Jakarta",
        postalCode: "12190"
      },
      pseRegistrationNumber: undefined,
      createdAt: now,
      updatedAt: now
    };
  }
}
