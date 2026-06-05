import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const pharmacy = await prisma.pharmacy.create({
    data: {
      legalName: "PT ApoTech Demo Indonesia",
      displayName: "Apotek Melati",
      siaNumber: "SIA-DEMO-001",
      npwp: "0123456789012345",
      nikFallbackEnabled: true,
      addressLine1: "Jl. Kesehatan No. 7",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      postalCode: "12190",
      pseRegistrationNumber: null
    }
  });

  const owner = await prisma.user.create({
    data: {
      pharmacyId: pharmacy.id,
      email: "owner@apotech.demo",
      fullName: "Dr. Siti Aminah",
      role: "OWNER",
      active: true
    }
  });

  const product1 = await prisma.product.create({
    data: {
      pharmacyId: pharmacy.id,
      bpomRegistrationNumber: "BPOM RI MD 1234567890123",
      gtin: "01234567890123",
      name: "Amoxicillin 500mg",
      manufacturer: "PT Pharma Indonesia",
      strength: "500mg",
      dosageForm: "Capsule",
      schedule: "PRESCRIPTION",
      reorderPoint: 24
    }
  });

  const product2 = await prisma.product.create({
    data: {
      pharmacyId: pharmacy.id,
      bpomRegistrationNumber: "BPOM RI MD 1234567890124",
      gtin: "01234567890124",
      name: "Paracetamol 500mg",
      manufacturer: "PT Pharma Indonesia",
      strength: "500mg",
      dosageForm: "Tablet",
      schedule: "GENERAL",
      reorderPoint: 48
    }
  });

  const product3 = await prisma.product.create({
    data: {
      pharmacyId: pharmacy.id,
      bpomRegistrationNumber: "BPOM RI MD 1234567890125",
      gtin: "01234567890125",
      name: "Ibuprofen 400mg",
      manufacturer: "PT Pharma Indonesia",
      strength: "400mg",
      dosageForm: "Tablet",
      schedule: "LIMITED_OTC",
      reorderPoint: 30
    }
  });

  const batch1 = await prisma.stockBatch.create({
    data: {
      pharmacyId: pharmacy.id,
      productId: product1.id,
      batchNumber: "AB123",
      lotNumber: "LOT001",
      expiryDate: new Date("2026-12-31"),
      quantityOnHand: 12,
      unitCost: 5000,
      supplierName: "PT Supplier A"
    }
  });

  const batch2 = await prisma.stockBatch.create({
    data: {
      pharmacyId: pharmacy.id,
      productId: product2.id,
      batchNumber: "CD456",
      lotNumber: "LOT002",
      expiryDate: new Date("2027-06-30"),
      quantityOnHand: 18,
      unitCost: 3000,
      supplierName: "PT Supplier B"
    }
  });

  const movement1 = await prisma.inventoryMovement.create({
    data: {
      pharmacyId: pharmacy.id,
      productId: product1.id,
      batchId: batch1.id,
      type: "RECEIPT",
      quantity: 12,
      reason: "Initial stock",
      occurredAt: new Date(),
      actorUserId: owner.id
    }
  });

  const movement2 = await prisma.inventoryMovement.create({
    data: {
      pharmacyId: pharmacy.id,
      productId: product2.id,
      batchId: batch2.id,
      type: "RECEIPT",
      quantity: 18,
      reason: "Initial stock",
      occurredAt: new Date(),
      actorUserId: owner.id
    }
  });

  console.log("Seed data created successfully:");
  console.log(`- Pharmacy: ${pharmacy.displayName} (${pharmacy.id})`);
  console.log(`- Owner: ${owner.fullName} (${owner.id})`);
  console.log(`- Products: ${product1.name}, ${product2.name}, ${product3.name}`);
  console.log(`- Batches: ${batch1.batchNumber} (${batch1.quantityOnHand} units), ${batch2.batchNumber} (${batch2.quantityOnHand} units)`);
  console.log(`- Note: ${product3.name} has zero batches (below reorder point of ${product3.reorderPoint})`);
  console.log(`- Note: ${product1.name} is below reorder point (${batch1.quantityOnHand} < ${product1.reorderPoint})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
