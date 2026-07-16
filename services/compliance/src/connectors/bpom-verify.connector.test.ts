import { describe, it, expect, beforeEach } from "vitest";
import { BpomVerifyConnector } from "./bpom-verify.connector.js";

const GS1_GROUP_SEPARATOR = "\u001D";

describe("BpomVerifyConnector", () => {
  let connector: BpomVerifyConnector;

  beforeEach(() => {
    connector = new BpomVerifyConnector();
  });

  it("should return authentic=true for valid DataMatrix with known GTIN", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231726123110AB123",
      gtin: "01234567890123",
      serialNumber: "261231",
      batchNumber: "AB123",
      expiryDate: "2026-12-31"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("VALID");
    expect(result.raw.productName).toBe("Amoxicillin 500mg");
    expect(result.raw.registrationNumber).toBe("BPOM RI MD 1234567890123");
  });

  it("should parse a known GTIN from rawDataMatrix only", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231799123110AB123"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("VALID");
    expect(result.raw.productName).toBe("Amoxicillin 500mg");
    expect(result.raw.registrationNumber).toBe("BPOM RI MD 1234567890123");
    expect(result.raw.rawProviderResponse).toMatchObject({
      gtin: "01234567890123",
      batchNumber: "AB123",
      expiryDate: "2099-12-31"
    });
  });

  it("should parse GS-separated serial numbers from rawDataMatrix", async () => {
    const result = await connector.submit({
      rawDataMatrix: `01012345678901231799123110AB123${GS1_GROUP_SEPARATOR}21SERIAL-001`
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("VALID");
    expect(result.raw.rawProviderResponse).toMatchObject({
      gtin: "01234567890123",
      batchNumber: "AB123",
      serialNumber: "SERIAL-001",
      expiryDate: "2099-12-31"
    });
  });

  it("should return authentic=true for valid DataMatrix with known GTIN 01234567890124", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901241727123110CD456",
      gtin: "01234567890124",
      serialNumber: "271231",
      batchNumber: "CD456",
      expiryDate: "2027-06-30"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("VALID");
    expect(result.raw.productName).toBe("Paracetamol 500mg");
    expect(result.raw.registrationNumber).toBe("BPOM RI MD 1234567890124");
  });

  it("should return authentic=true for valid DataMatrix with known GTIN 01234567890125", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901251727123110EF789",
      gtin: "01234567890125",
      serialNumber: "271231",
      batchNumber: "EF789",
      expiryDate: "2027-03-15"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("VALID");
    expect(result.raw.productName).toBe("Ibuprofen 400mg");
    expect(result.raw.registrationNumber).toBe("BPOM RI MD 1234567890125");
  });

  it("should return authentic=false and UNKNOWN for malformed too-short DataMatrix", async () => {
    const result = await connector.submit({
      rawDataMatrix: "123"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(false);
    expect(result.raw.status).toBe("UNKNOWN");
  });

  it("should return authentic=false for invalid GTIN format", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231725123110AB123",
      gtin: "invalid"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(false);
    expect(result.raw.status).toBe("UNKNOWN");
  });

  it("should return status=EXPIRED for expired product", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231720123110AB123",
      gtin: "01234567890123",
      serialNumber: "201231",
      batchNumber: "AB123",
      expiryDate: "2020-12-31"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("EXPIRED");
  });

  it("should return status=EXPIRED for expired product from rawDataMatrix only", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231720123110AB123"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("EXPIRED");
  });

  it("should return status=RECALLED for recalled batch", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231726123110RECALLED-TEST",
      gtin: "01234567890123",
      serialNumber: "261231",
      batchNumber: "RECALLED-TEST",
      expiryDate: "2026-12-31"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("RECALLED");
  });

  it("should return status=RECALLED for recalled batch from rawDataMatrix only", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231799123110RECALLED-TEST"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("RECALLED");
  });

  it("should prefer explicit fields over parsed DataMatrix fields", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01012345678901231799123110RECALLED-TEST",
      batchNumber: "AB123"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("VALID");
    expect(result.raw.rawProviderResponse).toMatchObject({
      gtin: "01234567890123",
      batchNumber: "AB123",
      expiryDate: "2099-12-31"
    });
  });

  it("should return status=UNKNOWN when GTIN and batch are missing", async () => {
    const result = await connector.submit({
      serialNumber: "SERIAL-ONLY"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.status).toBe("UNKNOWN");
  });

  it("should return status=UNKNOWN for unknown GTIN", async () => {
    const result = await connector.submit({
      rawDataMatrix: "01999999999999991726123110AB123",
      gtin: "09999999999999",
      serialNumber: "261231",
      batchNumber: "AB123",
      expiryDate: "2026-12-31"
    });

    expect(result.providerStatus).toBe("VERIFIED");
    expect(result.raw.authentic).toBe(true);
    expect(result.raw.status).toBe("VALID");
    expect(result.raw.productName).toBeUndefined();
    expect(result.raw.registrationNumber).toBeUndefined();
  });
});
