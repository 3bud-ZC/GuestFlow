-- AlterTable
ALTER TABLE "Room" ADD COLUMN "airbnbCalendarName" TEXT;
ALTER TABLE "Room" ADD COLUMN "airbnbIcalUrl" TEXT;
ALTER TABLE "Room" ADD COLUMN "airbnbLastSyncError" TEXT;
ALTER TABLE "Room" ADD COLUMN "airbnbLastSyncedAt" TIMESTAMP(3);
ALTER TABLE "Room" ADD COLUMN "airbnbListingId" TEXT;
ALTER TABLE "Room" ADD COLUMN "airbnbSyncEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Room_airbnbIcalUrl_key" ON "Room"("airbnbIcalUrl");
