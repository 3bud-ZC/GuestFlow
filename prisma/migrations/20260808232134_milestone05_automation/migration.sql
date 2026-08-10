/*
  Warnings:

  - You are about to drop the column `scheduledTime` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "scheduledTime",
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PropertySettings" ADD COLUMN     "checkoutReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "idReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "locationEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reviewRequestEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "welcomeEnabled" BOOLEAN NOT NULL DEFAULT true;
