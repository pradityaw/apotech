import { Module } from "@nestjs/common";
import { PharmaciesController } from "./pharmacies.controller.js";
import { PharmaciesService } from "./pharmacies.service.js";

@Module({
  controllers: [PharmaciesController],
  providers: [PharmaciesService],
  exports: [PharmaciesService]
})
export class PharmaciesModule {}
