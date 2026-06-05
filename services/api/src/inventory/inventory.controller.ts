import { Body, Controller, Get, Param, Post, Put, Delete } from "@nestjs/common";
import { InventoryService } from "./inventory.service.js";

@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("products")
  listProducts() {
    return this.inventoryService.listProducts();
  }

  @Get("products/:id")
  getProduct(@Param("id") id: string) {
    return this.inventoryService.getProduct(id);
  }

  @Post("products")
  createProduct(@Body() body: unknown) {
    return this.inventoryService.createProduct(body);
  }

  @Put("products/:id")
  updateProduct(@Param("id") id: string, @Body() body: unknown) {
    return this.inventoryService.updateProduct(id, body);
  }

  @Get("products/:id/batches")
  getProductBatches(@Param("id") productId: string) {
    return this.inventoryService.getProductBatches(productId);
  }

  @Get("batches/:id")
  getBatch(@Param("id") id: string) {
    return this.inventoryService.getBatch(id);
  }

  @Post("batches")
  createBatch(@Body() body: unknown) {
    return this.inventoryService.createBatch(body);
  }

  @Put("batches/:id")
  updateBatch(@Param("id") id: string, @Body() body: unknown) {
    return this.inventoryService.updateBatch(id, body);
  }

  @Post("goods-receipt")
  processGoodsReceipt(@Body() body: unknown) {
    return this.inventoryService.processGoodsReceipt(body);
  }

  @Get("movements")
  listMovements() {
    return this.inventoryService.listMovements();
  }

  @Get("reorder-alerts")
  reorderAlerts() {
    return this.inventoryService.reorderAlerts();
  }
}
