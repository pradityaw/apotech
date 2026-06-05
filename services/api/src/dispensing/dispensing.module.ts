import { Module } from "@nestjs/common";
import { DispensingController } from "./dispensing.controller.js";
import { DispensingService } from "./dispensing.service.js";

@Module({
  controllers: [DispensingController],
  providers: [DispensingService]
})
export class DispensingModule {}
