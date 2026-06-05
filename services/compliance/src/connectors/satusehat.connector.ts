import type { SatuSehatPharmacyServiceEvent } from "@apotech/shared";
import type { ConnectorResult, GovernmentConnector } from "./connector.js";

export class SatuSehatConnector implements GovernmentConnector<SatuSehatPharmacyServiceEvent> {
  readonly connector = "SATUSEHAT" as const;

  async submit(payload: SatuSehatPharmacyServiceEvent): Promise<ConnectorResult> {
    return {
      externalReference: payload.dispensingEventId,
      providerStatus: "STUBBED_PENDING_OFFICIAL_CREDENTIALS"
    };
  }
}
