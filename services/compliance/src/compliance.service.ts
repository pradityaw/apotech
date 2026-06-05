import { Injectable } from "@nestjs/common";
import type { ComplianceConnector, ComplianceStatus } from "@apotech/shared";

@Injectable()
export class ComplianceService {
  dashboardSnapshot(): Array<{ connector: ComplianceConnector; status: ComplianceStatus; count: number }> {
    return [
      { connector: "SATUSEHAT", status: "QUEUED", count: 12 },
      { connector: "EMESO", status: "PENDING", count: 2 },
      { connector: "BPOM_VERIFY", status: "REPORTED", count: 57 },
      { connector: "CORETAX", status: "FAILED", count: 1 },
      { connector: "QRIS", status: "REPORTED", count: 88 }
    ];
  }
}
