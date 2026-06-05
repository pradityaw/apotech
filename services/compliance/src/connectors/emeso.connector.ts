import type { AdverseEventReport } from "@apotech/shared";
import type { ConnectorResult, GovernmentConnector } from "./connector.js";

export class EmesoConnector implements GovernmentConnector<AdverseEventReport> {
  readonly connector = "EMESO" as const;

  async submit(payload: AdverseEventReport): Promise<ConnectorResult> {
    return {
      externalReference: payload.id,
      providerStatus: process.env.EMESO_MODE === "api" ? "STUBBED_API" : "PORTAL_ASSISTED_READY"
    };
  }
}
