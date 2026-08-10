-- AlterTable
ALTER TABLE "Reservation" ALTER COLUMN "guestId" DROP NOT NULL,
ALTER COLUMN "numberOfGuests" SET DEFAULT 1,
ADD COLUMN     "externalEventId" TEXT,
ADD COLUMN     "externalSource" TEXT;

-- CreateTable
CREATE TABLE "AvailabilityBlock" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "externalSource" TEXT,
    "externalEventId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AvailabilityBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_externalEventId_key" ON "Reservation"("externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityBlock_externalEventId_key" ON "AvailabilityBlock"("externalEventId");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_propertyId_idx" ON "AvailabilityBlock"("propertyId");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_roomId_idx" ON "AvailabilityBlock"("roomId");

-- CreateIndex
CREATE INDEX "AvailabilityBlock_startDate_idx" ON "AvailabilityBlock"("startDate");

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityBlock" ADD CONSTRAINT "AvailabilityBlock_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
