import type { QrisChargeRequest, QrisChargeResponse } from "@apotech/shared";
import type { GovernmentConnector } from "./connector.js";

export class QrisConnector implements GovernmentConnector<QrisChargeRequest> {
  readonly connector = "QRIS" as const;

  async submit(payload: QrisChargeRequest): Promise<{ externalReference: string; providerStatus: string; raw: QrisChargeResponse }> {
    return {
      externalReference: payload.saleId,
      providerStatus: `STUBBED_${payload.provider}_SNAP`,
      raw: {
        transactionId: `stub-${payload.saleId}`,
        providerReference: payload.provider,
        qrString: "00020101021226660014ID.CO.QRIS.WWW0118936000000000000000215APOTECH-STUB52045812530336054040.005802ID5907APOTECH6013JAKARTA6105121906304ABCD",
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        snapSignatureVersion: "HMAC-SHA512"
      }
    };
  }
}
