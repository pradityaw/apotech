import { Controller, Get } from "@nestjs/common";
import { PharmaciesService } from "./pharmacies.service.js";

@Controller("pharmacies")
export class PharmaciesController {
  constructor(private readonly pharmaciesService: PharmaciesService) {}

  @Get("demo")
  demo() {
    return this.pharmaciesService.demoPharmacy();
  }
}
