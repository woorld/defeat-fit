/*
  Warnings:

  - A unique constraint covering the columns `[statsId,menuId]` on the table `StatsMenu` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "StatsMenu_statsId_menuId_key" ON "StatsMenu"("statsId", "menuId");
