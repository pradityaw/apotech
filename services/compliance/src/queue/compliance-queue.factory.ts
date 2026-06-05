import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

@Injectable()
export class ComplianceQueueFactory {
  createQueue(name = "compliance-events") {
    return new Queue(name, {
      connection: {
        url: process.env.REDIS_URL ?? "redis://localhost:6379"
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: "exponential", delay: 30_000 },
        removeOnComplete: 1_000,
        removeOnFail: false
      }
    });
  }
}
