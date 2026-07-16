import axios from "axios";
import { Injectable } from "@nestjs/common";
import type { BpomDataMatrixVerifyRequest, BpomDataMatrixVerifyResponse } from "@apotech/shared";
import type { GovernmentConnector } from "./connector.js";

const GS1_GROUP_SEPARATOR = "\u001D";
const GS1_VARIABLE_FIELD_MAX_LENGTH = 20;

type ParsedBpomDataMatrixFields = {
  gtin?: string;
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
};

@Injectable()
export class BpomVerifyConnector implements GovernmentConnector<BpomDataMatrixVerifyRequest> {
  readonly connector = "BPOM_VERIFY" as const;

  async submit(payload: BpomDataMatrixVerifyRequest): Promise<{ providerStatus: string; raw: BpomDataMatrixVerifyResponse }> {
    const rawDataMatrix = payload.rawDataMatrix;
    const parsedFields = rawDataMatrix ? this.parseGs1DataMatrix(rawDataMatrix) : {};
    const gtin = payload.gtin ?? parsedFields.gtin;
    const serialNumber = payload.serialNumber ?? parsedFields.serialNumber;
    const batchNumber = payload.batchNumber ?? parsedFields.batchNumber;
    const expiryDate = payload.expiryDate ?? parsedFields.expiryDate;

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
        expiryDate,
        parsedDataMatrix: parsedFields
      }
    };

    return {
      providerStatus: "VERIFIED",
      raw: verificationResult
    };
  }

  async probeEndpoint(): Promise<number | "SKIPPED" | string> {
    const baseUrl = process.env.BPOM_VERIFY_BASE_URL;
    if (!baseUrl || baseUrl.includes("replace")) {
      return "SKIPPED";
    }

    try {
      const response = await axios.get(baseUrl, {
        timeout: 10_000,
        validateStatus: () => true
      });

      return response.status;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response?.status ?? error.code ?? "ERROR";
      }

      return "ERROR";
    }
  }

  private parseGs1DataMatrix(rawDataMatrix: string): ParsedBpomDataMatrixFields {
    const dataMatrix = this.normalizeGs1DataMatrix(rawDataMatrix);
    const fields: ParsedBpomDataMatrixFields = {};
    let position = 0;

    while (position < dataMatrix.length) {
      if (dataMatrix[position] === GS1_GROUP_SEPARATOR) {
        position += 1;
        continue;
      }

      const applicationIdentifier = dataMatrix.slice(position, position + 2);

      switch (applicationIdentifier) {
        case "01": {
          const valueStart = position + 2;
          const gtin = dataMatrix.slice(valueStart, valueStart + 14);
          if (!/^[0-9]{14}$/.test(gtin)) {
            return fields;
          }

          fields.gtin = gtin;
          position = valueStart + 14;
          break;
        }
        case "17": {
          const valueStart = position + 2;
          const expiryDate = this.formatGs1ExpiryDate(dataMatrix.slice(valueStart, valueStart + 6));
          if (!expiryDate) {
            return fields;
          }

          fields.expiryDate = expiryDate;
          position = valueStart + 6;
          break;
        }
        case "10": {
          const field = this.readGs1VariableField(dataMatrix, position + 2);
          if (field.value) {
            fields.batchNumber = field.value;
          }
          position = field.nextPosition;
          break;
        }
        case "21": {
          const field = this.readGs1VariableField(dataMatrix, position + 2);
          if (field.value) {
            fields.serialNumber = field.value;
          }
          position = field.nextPosition;
          break;
        }
        default:
          return fields;
      }
    }

    return fields;
  }

  private normalizeGs1DataMatrix(rawDataMatrix: string): string {
    return rawDataMatrix
      .trim()
      .replace(/^\]d2/i, "")
      .replace(/^\]C1/i, "")
      .replace(/\((\d{2})\)/g, "$1");
  }

  private readGs1VariableField(dataMatrix: string, valueStart: number): { value: string; nextPosition: number } {
    const maxValueEnd = Math.min(dataMatrix.length, valueStart + GS1_VARIABLE_FIELD_MAX_LENGTH);
    const separatorPosition = dataMatrix.indexOf(GS1_GROUP_SEPARATOR, valueStart);

    if (separatorPosition !== -1 && separatorPosition <= maxValueEnd) {
      return {
        value: dataMatrix.slice(valueStart, separatorPosition),
        nextPosition: separatorPosition + 1
      };
    }

    const nextAiPosition = this.findNextApplicationIdentifier(dataMatrix, valueStart, maxValueEnd);
    const valueEnd = nextAiPosition ?? maxValueEnd;

    return {
      value: dataMatrix.slice(valueStart, valueEnd),
      nextPosition: valueEnd
    };
  }

  private findNextApplicationIdentifier(
    dataMatrix: string,
    valueStart: number,
    valueEnd: number
  ): number | undefined {
    for (let position = valueStart + 1; position < valueEnd; position += 1) {
      if (this.isKnownApplicationIdentifierBoundary(dataMatrix, position)) {
        return position;
      }
    }

    return undefined;
  }

  private isKnownApplicationIdentifierBoundary(dataMatrix: string, position: number): boolean {
    const applicationIdentifier = dataMatrix.slice(position, position + 2);

    switch (applicationIdentifier) {
      case "01":
        return /^[0-9]{14}$/.test(dataMatrix.slice(position + 2, position + 16));
      case "17":
        return this.formatGs1ExpiryDate(dataMatrix.slice(position + 2, position + 8)) !== undefined;
      case "10":
      case "21":
        return position + 2 < dataMatrix.length;
      default:
        return false;
    }
  }

  private formatGs1ExpiryDate(yyMMdd: string): string | undefined {
    if (!/^[0-9]{6}$/.test(yyMMdd)) {
      return undefined;
    }

    const year = 2000 + Number(yyMMdd.slice(0, 2));
    const month = Number(yyMMdd.slice(2, 4));
    const encodedDay = Number(yyMMdd.slice(4, 6));

    if (month < 1 || month > 12) {
      return undefined;
    }

    const day = encodedDay === 0 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : encodedDay;
    const expiryDate = new Date(Date.UTC(year, month - 1, day));

    if (
      expiryDate.getUTCFullYear() !== year ||
      expiryDate.getUTCMonth() !== month - 1 ||
      expiryDate.getUTCDate() !== day
    ) {
      return undefined;
    }

    return expiryDate.toISOString().slice(0, 10);
  }

  private simulateAuthenticityCheck(
    rawDataMatrix: string | undefined,
    gtin?: string,
    serialNumber?: string,
    batchNumber?: string
  ): boolean {
    if (rawDataMatrix !== undefined && rawDataMatrix.length < 8) {
      return false;
    }

    if (!rawDataMatrix && !gtin && !serialNumber && !batchNumber) {
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
    if (gtin && !/^[0-9]{8,14}$/.test(gtin)) {
      return "UNKNOWN";
    }

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
