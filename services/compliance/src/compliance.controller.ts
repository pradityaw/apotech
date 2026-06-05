import { Body, Controller, Get, Post } from "@nestjs/common";
import { bpomDataMatrixVerifyRequestSchema, complianceJobSchema } from "@apotech/shared";
import { BpomVerifyConnector } from "./connectors/bpom-verify.connector.js";
import { ComplianceService } from "./compliance.service.js";

@Controller("compliance")
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly bpomVerifyConnector: BpomVerifyConnector
  ) {}

  @Get("dashboard")
  dashboard() {
    return this.complianceService.dashboardSnapshot();
  }

  @Post("jobs/validate")
  validateJob(@Body() body: unknown) {
    return complianceJobSchema.parse(body);
  }

  @Post("bpom/verify")
  async verifyDataMatrix(@Body() body: unknown) {
    const validated = bpomDataMatrixVerifyRequestSchema.parse(body);
    return this.bpomVerifyConnector.submit(validated);
  }
}
