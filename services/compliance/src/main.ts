import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ComplianceModule } from "./compliance.module.js";

async function bootstrap() {
  const app = await NestFactory.create(ComplianceModule);
  const port = Number(process.env.COMPLIANCE_PORT ?? 4100);
  await app.listen(port);
}

void bootstrap();
