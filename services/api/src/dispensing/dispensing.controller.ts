import { Body, Controller, Post } from "@nestjs/common";
import { dispensingEventSchema } from "@apotech/shared";
import { DispensingService } from "./dispensing.service.js";

@Controller("dispensing")
export class DispensingController {
  constructor(private readonly dispensingService: DispensingService) {}

  @Post("events/validate")
  validateEvent(@Body() body: unknown) {
    const event = dispensingEventSchema.parse(body);
    return this.dispensingService.acceptValidatedEvent(event);
  }
}
