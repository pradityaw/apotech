import { Injectable } from "@nestjs/common";
import type { ComplianceConnector } from "@apotech/shared";
import type { GovernmentConnector } from "./connector.js";
import { BpomVerifyConnector } from "./bpom-verify.connector.js";
import { CoretaxConnector } from "./coretax.connector.js";
import { EmesoConnector } from "./emeso.connector.js";
import { QrisConnector } from "./qris.connector.js";
import { SatuSehatConnector } from "./satusehat.connector.js";

@Injectable()
export class ConnectorRegistry {
  private readonly connectors: Record<ComplianceConnector, GovernmentConnector> = {
    SATUSEHAT: new SatuSehatConnector(),
    EMESO: new EmesoConnector(),
    BPOM_VERIFY: new BpomVerifyConnector(),
    CORETAX: new CoretaxConnector(),
    QRIS: new QrisConnector()
  };

  get(connector: ComplianceConnector): GovernmentConnector {
    return this.connectors[connector];
  }
}
