import { Injectable } from "@nestjs/common";
import type { DispensingEvent } from "@apotech/shared";

@Injectable()
export class DispensingService {
  acceptValidatedEvent(event: DispensingEvent) {
    return {
      accepted: true,
      complianceJobs: ["SATUSEHAT", "CORETAX"],
      event
    };
  }
}
