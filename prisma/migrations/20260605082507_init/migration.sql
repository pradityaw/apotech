-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'PHARMACIST', 'CASHIER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "ProductSchedule" AS ENUM ('GENERAL', 'LIMITED_OTC', 'PRESCRIPTION', 'NARCOTIC', 'PSYCHOTROPIC');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RECEIPT', 'SALE', 'ADJUSTMENT', 'RETURN', 'TRANSFER_OUT', 'TRANSFER_IN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS', 'CARD', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ComplianceConnector" AS ENUM ('SATUSEHAT', 'EMESO', 'BPOM_VERIFY', 'CORETAX', 'QRIS');

-- CreateEnum
CREATE TYPE "ComplianceStatus" AS ENUM ('PENDING', 'QUEUED', 'REPORTED', 'FAILED', 'DEAD_LETTER', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AdverseEventSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING', 'DEATH');

-- CreateEnum
CREATE TYPE "CoretaxInvoiceStatus" AS ENUM ('DRAFT', 'UPLOADED', 'VALIDATED', 'REJECTED', 'QR_ISSUED');

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('ACCOUNT_REGISTRATION', 'DISPENSING', 'SATUSEHAT_REPORTING', 'EMESO_REPORTING', 'TAX_INVOICE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'SUBMIT_COMPLIANCE');

-- CreateTable
CREATE TABLE "Pharmacy" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "siaNumber" TEXT NOT NULL,
    "npwp" TEXT,
    "nikFallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "addressLine1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "pseRegistrationNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pharmacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "bpomRegistrationNumber" TEXT,
    "gtin" TEXT,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "strength" TEXT,
    "dosageForm" TEXT,
    "schedule" "ProductSchedule" NOT NULL DEFAULT 'GENERAL',
    "reorderPoint" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockBatch" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "lotNumber" TEXT,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(14,2),
    "supplierName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "type" "InventoryMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT NOT NULL,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensingEvent" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "cashierUserId" TEXT NOT NULL,
    "pharmacistUserId" TEXT,
    "patientReference" TEXT,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "qrisTransactionId" TEXT,
    "completedOffline" BOOLEAN NOT NULL DEFAULT false,
    "syncClientId" TEXT,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DispensingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensingLine" (
    "id" TEXT NOT NULL,
    "dispensingEventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "batchId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(14,2) NOT NULL,
    "prescriptionRequired" BOOLEAN NOT NULL DEFAULT false,
    "prescriptionNumber" TEXT,

    CONSTRAINT "DispensingLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceJob" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "connector" "ComplianceConnector" NOT NULL,
    "sourceEventId" TEXT,
    "status" "ComplianceStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "externalReference" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdverseEventReport" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "dispensingEventId" TEXT,
    "suspectedProductId" TEXT,
    "patientInitials" TEXT,
    "description" TEXT NOT NULL,
    "severity" "AdverseEventSeverity" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "reporterName" TEXT NOT NULL,
    "reporterContact" TEXT,
    "consentCaptured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdverseEventReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoretaxInvoice" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "buyerNpwp" TEXT,
    "buyerNik" TEXT,
    "useNationalIdExportWorkaround" BOOLEAN NOT NULL DEFAULT false,
    "status" "CoretaxInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "nsfp" TEXT,
    "qrUrl" TEXT,
    "xmlPayload" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoretaxInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "subjectReference" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "evidence" JSONB,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "pharmacyId" TEXT,
    "actorUserId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pharmacy_siaNumber_idx" ON "Pharmacy"("siaNumber");

-- CreateIndex
CREATE INDEX "Pharmacy_npwp_idx" ON "Pharmacy"("npwp");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_pharmacyId_role_idx" ON "User"("pharmacyId", "role");

-- CreateIndex
CREATE INDEX "Product_pharmacyId_name_idx" ON "Product"("pharmacyId", "name");

-- CreateIndex
CREATE INDEX "Product_bpomRegistrationNumber_idx" ON "Product"("bpomRegistrationNumber");

-- CreateIndex
CREATE INDEX "Product_gtin_idx" ON "Product"("gtin");

-- CreateIndex
CREATE INDEX "StockBatch_pharmacyId_expiryDate_idx" ON "StockBatch"("pharmacyId", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "StockBatch_productId_batchNumber_key" ON "StockBatch"("productId", "batchNumber");

-- CreateIndex
CREATE INDEX "InventoryMovement_pharmacyId_occurredAt_idx" ON "InventoryMovement"("pharmacyId", "occurredAt");

-- CreateIndex
CREATE INDEX "InventoryMovement_productId_idx" ON "InventoryMovement"("productId");

-- CreateIndex
CREATE INDEX "DispensingEvent_pharmacyId_dispensedAt_idx" ON "DispensingEvent"("pharmacyId", "dispensedAt");

-- CreateIndex
CREATE INDEX "DispensingEvent_syncClientId_idx" ON "DispensingEvent"("syncClientId");

-- CreateIndex
CREATE INDEX "DispensingLine_dispensingEventId_idx" ON "DispensingLine"("dispensingEventId");

-- CreateIndex
CREATE INDEX "DispensingLine_productId_idx" ON "DispensingLine"("productId");

-- CreateIndex
CREATE INDEX "ComplianceJob_pharmacyId_connector_status_idx" ON "ComplianceJob"("pharmacyId", "connector", "status");

-- CreateIndex
CREATE INDEX "ComplianceJob_status_nextAttemptAt_idx" ON "ComplianceJob"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "AdverseEventReport_pharmacyId_occurredAt_idx" ON "AdverseEventReport"("pharmacyId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "CoretaxInvoice_saleId_key" ON "CoretaxInvoice"("saleId");

-- CreateIndex
CREATE INDEX "CoretaxInvoice_pharmacyId_status_idx" ON "CoretaxInvoice"("pharmacyId", "status");

-- CreateIndex
CREATE INDEX "ConsentRecord_pharmacyId_subjectReference_purpose_idx" ON "ConsentRecord"("pharmacyId", "subjectReference", "purpose");

-- CreateIndex
CREATE INDEX "AuditLog_pharmacyId_occurredAt_idx" ON "AuditLog"("pharmacyId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_idx" ON "AuditLog"("resourceType", "resourceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingEvent" ADD CONSTRAINT "DispensingEvent_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingEvent" ADD CONSTRAINT "DispensingEvent_cashierUserId_fkey" FOREIGN KEY ("cashierUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingEvent" ADD CONSTRAINT "DispensingEvent_pharmacistUserId_fkey" FOREIGN KEY ("pharmacistUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLine" ADD CONSTRAINT "DispensingLine_dispensingEventId_fkey" FOREIGN KEY ("dispensingEventId") REFERENCES "DispensingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLine" ADD CONSTRAINT "DispensingLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensingLine" ADD CONSTRAINT "DispensingLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StockBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceJob" ADD CONSTRAINT "ComplianceJob_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceJob" ADD CONSTRAINT "ComplianceJob_sourceEventId_fkey" FOREIGN KEY ("sourceEventId") REFERENCES "DispensingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdverseEventReport" ADD CONSTRAINT "AdverseEventReport_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdverseEventReport" ADD CONSTRAINT "AdverseEventReport_dispensingEventId_fkey" FOREIGN KEY ("dispensingEventId") REFERENCES "DispensingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdverseEventReport" ADD CONSTRAINT "AdverseEventReport_suspectedProductId_fkey" FOREIGN KEY ("suspectedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoretaxInvoice" ADD CONSTRAINT "CoretaxInvoice_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoretaxInvoice" ADD CONSTRAINT "CoretaxInvoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "DispensingEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "Pharmacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
