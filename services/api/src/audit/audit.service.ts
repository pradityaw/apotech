import { Injectable } from "@nestjs/common";
import { auditLogSchema } from "@apotech/shared";

@Injectable()
export class AuditService {
  validate(input: unknown) {
    return auditLogSchema.parse(input);
  }
}
