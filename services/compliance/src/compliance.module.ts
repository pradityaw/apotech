import { Module } from "@nestjs/common";
import { ComplianceController } from "./compliance.controller.js";
import { ComplianceService } from "./compliance.service.js";
import { ConnectorRegistry } from "./connectors/connector-registry.js";
import { ComplianceQueueFactory } from "./queue/compliance-queue.factory.js";
import { BpomVerifyConnector } from "./connectors/bpom-verify.connector.js";
import { FeasibilityReport } from "./connectors/feasibility-report.js";
import { SatuSehatConnector } from "./connectors/satusehat.connector.js";

@Module({
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    ConnectorRegistry,
    ComplianceQueueFactory,
    BpomVerifyConnector,
    SatuSehatConnector,
    FeasibilityReport
  ]
})
export class ComplianceModule {}
