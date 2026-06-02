-- PostGIS optional (enable on production Railway/RDS when using spatial queries)
-- CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'LOGISTICS_MANAGER', 'READ_ONLY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'READ_ONLY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Territory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shippingMethodId" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#94a3b8',
    "shipDay" TEXT,
    "cutoffDay" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Territory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "County" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "fipsCode" CHAR(5) NOT NULL,
    "geoJsonId" TEXT,

    CONSTRAINT "County_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountyAssignment" (
    "id" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,

    CONSTRAINT "CountyAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZipCode" (
    "id" TEXT NOT NULL,
    "zip" CHAR(5) NOT NULL,
    "city" TEXT NOT NULL,
    "countyId" TEXT NOT NULL,

    CONSTRAINT "ZipCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "dealerCode" TEXT NOT NULL,
    "dealerName" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" CHAR(2) NOT NULL,
    "zip" CHAR(5) NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "territoryId" TEXT NOT NULL,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ShippingMethod_name_key" ON "ShippingMethod"("name");

-- CreateIndex
CREATE INDEX "Territory_shippingMethodId_idx" ON "Territory"("shippingMethodId");

-- CreateIndex
CREATE INDEX "Territory_active_idx" ON "Territory"("active");

-- CreateIndex
CREATE UNIQUE INDEX "County_fipsCode_key" ON "County"("fipsCode");

-- CreateIndex
CREATE INDEX "County_state_idx" ON "County"("state");

-- CreateIndex
CREATE INDEX "County_name_idx" ON "County"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CountyAssignment_countyId_key" ON "CountyAssignment"("countyId");

-- CreateIndex
CREATE INDEX "CountyAssignment_territoryId_idx" ON "CountyAssignment"("territoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ZipCode_zip_key" ON "ZipCode"("zip");

-- CreateIndex
CREATE INDEX "ZipCode_city_idx" ON "ZipCode"("city");

-- CreateIndex
CREATE INDEX "ZipCode_countyId_idx" ON "ZipCode"("countyId");

-- CreateIndex
CREATE UNIQUE INDEX "Dealer_dealerCode_key" ON "Dealer"("dealerCode");

-- CreateIndex
CREATE INDEX "Dealer_territoryId_idx" ON "Dealer"("territoryId");

-- CreateIndex
CREATE INDEX "Dealer_dealerName_idx" ON "Dealer"("dealerName");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_createdAt_idx" ON "AuditLog"("entityType", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "Territory" ADD CONSTRAINT "Territory_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "ShippingMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountyAssignment" ADD CONSTRAINT "CountyAssignment_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountyAssignment" ADD CONSTRAINT "CountyAssignment_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZipCode" ADD CONSTRAINT "ZipCode_countyId_fkey" FOREIGN KEY ("countyId") REFERENCES "County"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dealer" ADD CONSTRAINT "Dealer_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
