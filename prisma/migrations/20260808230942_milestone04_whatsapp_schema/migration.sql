/*
  Warnings:

  - You are about to drop the column `content` on the `MessageTemplate` table. All the data in the column will be lost.
  - Added the required column `metaTemplateName` to the `MessageTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "MessageTemplate" DROP COLUMN "content",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "languageCode" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "metaTemplateName" TEXT NOT NULL;
