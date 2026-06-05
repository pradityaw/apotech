import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Injectable, type OnModuleInit } from "@nestjs/common";
import { BpomVerifyConnector } from "./bpom-verify.connector.js";
import { SatuSehatConnector } from "./satusehat.connector.js";

@Injectable()
export class FeasibilityReport implements OnModuleInit {
  constructor(
    private readonly satuSehatConnector: SatuSehatConnector,
    private readonly bpomVerifyConnector: BpomVerifyConnector
  ) {}

  async onModuleInit(): Promise<void> {
    this.loadRootEnv();

    const satuSehat = await this.satuSehatConnector.probeFeasibility();
    const bpomStatus = await this.bpomVerifyConnector.probeEndpoint();

    console.log(`[FEASIBILITY] SatuSehat OAuth2: HTTP ${satuSehat.oauthStatus}`);
    console.log(`[FEASIBILITY] SatuSehat FHIR base: HTTP ${satuSehat.fhirBaseStatus}`);
    console.log(
      bpomStatus === "SKIPPED"
        ? "[FEASIBILITY] BPOM endpoint: SKIPPED"
        : `[FEASIBILITY] BPOM endpoint: HTTP ${bpomStatus}`
    );
  }

  private loadRootEnv(): void {
    const envPath = this.findEnvPath();
    if (!envPath) {
      return;
    }

    const envFile = readFileSync(envPath, "utf8");
    for (const line of envFile.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) {
        continue;
      }

      const [, key, rawValue = ""] = match;
      if (!key || process.env[key] !== undefined) {
        continue;
      }

      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }

  private findEnvPath(): string | undefined {
    let current = process.cwd();

    while (true) {
      const candidate = join(current, ".env");
      if (existsSync(candidate)) {
        return candidate;
      }

      const parent = dirname(current);
      if (parent === current) {
        return undefined;
      }

      current = parent;
    }
  }
}
