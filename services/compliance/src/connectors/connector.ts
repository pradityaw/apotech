import type { ComplianceConnector } from "@apotech/shared";

export type ConnectorResult = {
  externalReference?: string;
  providerStatus: string;
  raw?: unknown;
};

export interface GovernmentConnector<TPayload = unknown> {
  readonly connector: ComplianceConnector;
  submit(payload: TPayload): Promise<ConnectorResult>;
}
