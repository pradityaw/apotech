import { Module } from "@nestjs/common";
import { AuditModule } from "./audit/audit.module.js";
import { DispensingModule } from "./dispensing/dispensing.module.js";
import { InventoryModule } from "./inventory/inventory.module.js";
import { PharmaciesModule } from "./pharmacies/pharmacies.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [PrismaModule, PharmaciesModule, InventoryModule, DispensingModule, AuditModule]
})
export class AppModule {}
