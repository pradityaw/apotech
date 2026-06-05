import { Injectable } from "@nestjs/common";
import type { BpomDataMatrixVerifyRequest, BpomDataMatrixVerifyResponse } from "@apotech/shared";
import type { GovernmentConnector } from "./connector.js";

@Injectable()
export class BpomVerifyConnector implements GovernmentConnector<BpomDataMatrixVerifyRequest> {
  readonly connector = "BPOM_VERIFY" as const;

  async submit(payload: BpomDataMatrixVerifyRequest): Promise<{ providerStatus: string; raw: BpomDataMatrixVerifyResponse }> {
    const { rawDataMatrix, gtin, serialNumber, batchNumber, expiryDate } = payload;

    const verificationResult: BpomDataMatrixVerifyResponse = {
      authentic: this.simulateAuthenticityCheck(rawDataMatrix, gtin, serialNumber, batchNumber),
      status: this.determineStatus(gtin, batchNumber, expiryDate),
      checkedAt: new Date(),
      productName: gtin ? this.lookupProductName(gtin) : undefined,
      registrationNumber: gtin ? this.lookupRegistrationNumber(gtin) : undefined,
      rawProviderResponse: {
        rawDataMatrix,
        gtin,
        serialNumber,
        batchNumber,
        expiryDate
      }
    };

    return {
      providerStatus: "VERIFIED",
      raw: verificationResult
    };
  }

  private simulateAuthenticityCheck(
    rawDataMatrix: string,
    gtin?: string,
    serialNumber?: string,
    batchNumber?: string
  ): boolean {
    if (!rawDataMatrix || rawDataMatrix.length < 8) {
      return false;
    }

    if (gtin && !/^[0-9]{8,14}$/.test(gtin)) {
      return false;
    }

    if (batchNumber && batchNumber.length < 3) {
      return false;
    }

    return true;
  }

  private determineStatus(
    gtin?: string,
    batchNumber?: string,
    expiryDate?: string
  ): "VALID" | "INVALID" | "EXPIRED" | "RECALLED" | "UNKNOWN" {
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < new Date()) {
        return "EXPIRED";
      }
    }

    if (!gtin || !batchNumber) {
      return "UNKNOWN";
    }

    if (batchNumber === "RECALLED-TEST") {
      return "RECALLED";
    }

    return "VALID";
  }

  private lookupProductName(gtin: string): string | undefined {
    const mockProducts: Record<string, string> = {
      "01234567890123": "Amoxicillin 500mg",
      "01234567890124": "Paracetamol 500mg",
      "01234567890125": "Ibuprofen 400mg"
    };
    return mockProducts[gtin];
  }

  private lookupRegistrationNumber(gtin: string): string | undefined {
    const mockRegistrations: Record<string, string> = {
      "01234567890123": "BPOM RI MD 1234567890123",
      "01234567890124": "BPOM RI MD 1234567890124",
      "01234567890125": "BPOM RI MD 1234567890125"
    };
    return mockRegistrations[gtin];
  }
}
