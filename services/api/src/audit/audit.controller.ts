import { Body, Controller, Post } from "@nestjs/common";
import { auditLogSchema } from "@apotech/shared";
import { AuditService } from "./audit.service.js";

@Controller("audit")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Post("validate")
  validateAuditLog(@Body() body: unknown) {
    return this.auditService.validate(body);
  }
}
