import type { CoretaxInvoice } from "@apotech/shared";
import type { ConnectorResult, GovernmentConnector } from "./connector.js";

export class CoretaxConnector implements GovernmentConnector<CoretaxInvoice> {
  readonly connector = "CORETAX" as const;

  async submit(payload: CoretaxInvoice): Promise<ConnectorResult> {
    const nationalIdWorkaround = payload.useNationalIdExportWorkaround || Boolean(payload.buyerNik && !payload.buyerNpwp);
    return {
      externalReference: payload.id,
      providerStatus: nationalIdWorkaround ? "STUBBED_NIK_EXPORT_WORKAROUND" : "STUBBED_CLEARANCE_FLOW"
    };
  }
}
