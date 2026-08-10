-- AlterTable
ALTER TABLE "PropertySettings" ADD COLUMN     "checkoutOffsetHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "idReminderOffsetHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "locationOffsetHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "tiktokUrl" TEXT;
