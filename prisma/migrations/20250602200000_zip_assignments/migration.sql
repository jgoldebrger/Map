-- CreateTable
CREATE TABLE "ZipCodeAssignment" (
    "id" TEXT NOT NULL,
    "zipCodeId" TEXT NOT NULL,
    "territoryId" TEXT NOT NULL,

    CONSTRAINT "ZipCodeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZipCodeAssignment_zipCodeId_key" ON "ZipCodeAssignment"("zipCodeId");

-- CreateIndex
CREATE INDEX "ZipCodeAssignment_territoryId_idx" ON "ZipCodeAssignment"("territoryId");

-- AddForeignKey
ALTER TABLE "ZipCodeAssignment" ADD CONSTRAINT "ZipCodeAssignment_zipCodeId_fkey" FOREIGN KEY ("zipCodeId") REFERENCES "ZipCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZipCodeAssignment" ADD CONSTRAINT "ZipCodeAssignment_territoryId_fkey" FOREIGN KEY ("territoryId") REFERENCES "Territory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
