import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import type { Product, StockBatch, InventoryMovement } from "@apotech/shared";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    return this.prisma.product.findMany();
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }

  async createProduct(input: unknown) {
    return this.prisma.product.create({ data: input as any });
  }

  async updateProduct(id: string, input: unknown) {
    return this.prisma.product.update({ where: { id }, data: input as any });
  }

  async getProductBatches(productId: string) {
    return this.prisma.stockBatch.findMany({ where: { productId } });
  }

  async getBatch(id: string) {
    const batch = await this.prisma.stockBatch.findUnique({ where: { id } });
    if (!batch) {
      throw new NotFoundException(`Batch ${id} not found`);
    }
    return batch;
  }

  async createBatch(input: unknown) {
    return this.prisma.stockBatch.create({ data: input as any });
  }

  async updateBatch(id: string, input: unknown) {
    return this.prisma.stockBatch.update({ where: { id }, data: input as any });
  }

  async processGoodsReceipt(input: unknown) {
    const receipt = input as any;
    const { pharmacyId, lines, supplierName, receivedAt } = receipt;

    const results = await this.prisma.$transaction(async (tx) => {
      const createdBatches = [];
      const createdMovements = [];

      for (const line of lines) {
        const batch = await tx.stockBatch.create({
          data: {
            pharmacyId,
            productId: line.productId,
            batchNumber: line.batchNumber,
            lotNumber: line.lotNumber,
            expiryDate: new Date(line.expiryDate),
            quantityOnHand: line.quantity,
            unitCost: line.unitCost,
            supplierName
          }
        });
        createdBatches.push(batch);

        const movement = await tx.inventoryMovement.create({
          data: {
            pharmacyId,
            productId: line.productId,
            batchId: batch.id,
            type: "RECEIPT",
            quantity: line.quantity,
            reason: `Goods receipt from ${supplierName}`,
            occurredAt: receivedAt ? new Date(receivedAt) : new Date(),
            actorUserId: receipt.actorUserId
          }
        });
        createdMovements.push(movement);
      }

      return { batches: createdBatches, movements: createdMovements };
    });

    return results;
  }

  async listMovements() {
    return this.prisma.inventoryMovement.findMany({ take: 100, orderBy: { occurredAt: "desc" } });
  }

  async reorderAlerts() {
    const products = await this.prisma.product.findMany({
      include: { stockBatches: true }
    });

    return products
      .map((product) => {
        const totalQuantity = product.stockBatches.reduce((sum, batch) => sum + batch.quantityOnHand, 0);
        const oldestExpiry = product.stockBatches.length > 0
          ? product.stockBatches.reduce((oldest, batch) =>
            batch.expiryDate < oldest.expiryDate ? batch : oldest
          ).expiryDate
          : null;

        return {
          productName: product.name,
          quantityOnHand: totalQuantity,
          reorderPoint: product.reorderPoint,
          oldestExpiryDate: oldestExpiry?.toISOString(),
          isBelowReorderPoint: totalQuantity < product.reorderPoint
        };
      })
      .filter((alert) => alert.isBelowReorderPoint);
  }
}
