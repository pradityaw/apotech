import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /inventory/products", () => {
    it("should return 3 seeded products", async () => {
      const response = await request(app.getHttpServer())
        .get("/inventory/products")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
      
      const productNames = response.body.map((p: any) => p.name);
      expect(productNames).toContain("Amoxicillin 500mg");
      expect(productNames).toContain("Paracetamol 500mg");
      expect(productNames).toContain("Ibuprofen 400mg");
    });
  });

  describe("POST /inventory/goods-receipt", () => {
    it("should persist a StockBatch + RECEIPT InventoryMovement", async () => {
      const pharmacy = await prisma.pharmacy.findFirst();
      const user = await prisma.user.findFirst();
      const product = await prisma.product.findFirst({
        where: { name: "Amoxicillin 500mg" }
      });

      if (!pharmacy || !user || !product) {
        throw new Error("Seed data not found");
      }

      const goodsReceipt = {
        pharmacyId: pharmacy.id,
        supplierName: "PT Test Supplier",
        receivedAt: new Date().toISOString(),
        actorUserId: user.id,
        lines: [
          {
            productId: product.id,
            batchNumber: `TEST-${Date.now()}`,
            lotNumber: "LOT-TEST-001",
            expiryDate: "2028-12-31",
            quantity: 50,
            unitCost: 6000
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post("/inventory/goods-receipt")
        .send(goodsReceipt)
        .expect(201);

      expect(response.body).toHaveProperty("batches");
      expect(response.body).toHaveProperty("movements");
      expect(response.body.batches).toHaveLength(1);
      expect(response.body.movements).toHaveLength(1);

      expect(response.body.batches[0].batchNumber).toContain("TEST-");
      expect(response.body.batches[0].quantityOnHand).toBe(50);
      expect(response.body.movements[0].type).toBe("RECEIPT");
      expect(response.body.movements[0].quantity).toBe(50);
    });
  });

  describe("GET /inventory/reorder-alerts", () => {
    it("should return products below reorder point", async () => {
      const response = await request(app.getHttpServer())
        .get("/inventory/reorder-alerts")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      
      // At least one product should be below reorder point (Ibuprofen with zero batches)
      const belowReorder = response.body.filter((item: any) => item.isBelowReorderPoint);
      expect(belowReorder.length).toBeGreaterThan(0);
    });
  });
});
