-- DropIndex
DROP INDEX "Reservation_externalEventId_key";

-- DropIndex
DROP INDEX "AvailabilityBlock_externalEventId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_roomId_externalEventId_key" ON "Reservation"("roomId", "externalEventId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityBlock_roomId_externalEventId_key" ON "AvailabilityBlock"("roomId", "externalEventId");
