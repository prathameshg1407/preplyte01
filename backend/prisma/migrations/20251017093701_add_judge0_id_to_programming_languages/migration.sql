/*
  Warnings:

  - A unique constraint covering the columns `[judge0Id]` on the table `programming_languages` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "programming_languages" ADD COLUMN     "judge0Id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "programming_languages_judge0Id_key" ON "programming_languages"("judge0Id");

-- CreateIndex
CREATE INDEX "programming_languages_judge0Id_idx" ON "programming_languages"("judge0Id");
