/*
  Warnings:

  - You are about to drop the column `actualCheckIn` on the `Reservation` table. All the data in the column will be lost.
  - You are about to drop the column `actualCheckOut` on the `Reservation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Reservation" DROP COLUMN "actualCheckIn",
DROP COLUMN "actualCheckOut",
ADD COLUMN     "actualCheckInAt" TIMESTAMP(3),
ADD COLUMN     "actualCheckOutAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "completedAt" TIMESTAMP(3);
