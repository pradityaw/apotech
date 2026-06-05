import axios from "axios";
import { Injectable } from "@nestjs/common";
import type { SatuSehatPharmacyServiceEvent } from "@apotech/shared";
import type { ConnectorResult, GovernmentConnector } from "./connector.js";

type SatuSehatTokenCache = {
  accessToken: string;
  oauthStatus: number;
  expiresAt: number;
};

type SatuSehatTokenResponse = {
  access_token?: string;
  expires_in?: number;
};

export type SatuSehatFeasibilityResult = {
  oauthStatus: number | string;
  fhirBaseStatus: number | string;
};

@Injectable()
export class SatuSehatConnector implements GovernmentConnector<SatuSehatPharmacyServiceEvent> {
  readonly connector = "SATUSEHAT" as const;
  private tokenCache?: SatuSehatTokenCache;

  async submit(payload: SatuSehatPharmacyServiceEvent): Promise<ConnectorResult> {
    return {
      externalReference: payload.dispensingEventId,
      providerStatus: "STUBBED_PENDING_OFFICIAL_CREDENTIALS"
    };
  }

  async probeFeasibility(): Promise<SatuSehatFeasibilityResult> {
    const tokenResult = await this.fetchAccessToken();
    const fhirBaseStatus = await this.pingFhirBase(tokenResult.accessToken);

    return {
      oauthStatus: tokenResult.status,
      fhirBaseStatus
    };
  }

  private async fetchAccessToken(): Promise<{ status: number | string; accessToken?: string }> {
    const cached = this.getCachedToken();
    if (cached) {
      return { status: cached.oauthStatus, accessToken: cached.accessToken };
    }

    const authUrl = process.env.SATUSEHAT_AUTH_URL;
    if (!authUrl) {
      return { status: "SKIPPED_MISSING_URL" };
    }

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SATUSEHAT_CLIENT_ID ?? "",
      client_secret: process.env.SATUSEHAT_CLIENT_SECRET ?? ""
    });

    try {
      const response = await axios.post<SatuSehatTokenResponse>(authUrl, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        timeout: 10_000,
        validateStatus: () => true
      });
      const accessToken = response.data.access_token;

      if (accessToken) {
        const expiresIn = response.data.expires_in ?? 3600;
        this.tokenCache = {
          accessToken,
          oauthStatus: response.status,
          expiresAt: Date.now() + Math.max(expiresIn - 60, 60) * 1000
        };
      }

      return {
        status: response.status,
        accessToken
      };
    } catch (error) {
      return {
        status: this.httpErrorStatus(error)
      };
    }
  }

  private getCachedToken(): SatuSehatTokenCache | undefined {
    if (!this.tokenCache || this.tokenCache.expiresAt <= Date.now()) {
      return undefined;
    }

    return this.tokenCache;
  }

  private async pingFhirBase(accessToken?: string): Promise<number | string> {
    const baseUrl = process.env.SATUSEHAT_BASE_URL;
    if (!baseUrl) {
      return "SKIPPED_MISSING_URL";
    }

    try {
      const response = await axios.get(`${baseUrl.replace(/\/$/, "")}/Organization`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        timeout: 10_000,
        validateStatus: () => true
      });

      return response.status;
    } catch (error) {
      return this.httpErrorStatus(error);
    }
  }

  private httpErrorStatus(error: unknown): number | string {
    if (axios.isAxiosError(error)) {
      return error.response?.status ?? error.code ?? "ERROR";
    }

    return "ERROR";
  }
}
