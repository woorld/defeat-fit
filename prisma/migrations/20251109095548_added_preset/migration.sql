/*
  Warnings:

  - You are about to drop the column `multiplier` on the `Menu` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Preset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PresetMenu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "presetId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "multiplier" REAL NOT NULL,
    CONSTRAINT "PresetMenu_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES "Preset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PresetMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Menu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL
);
INSERT INTO "new_Menu" ("id", "name", "unit") SELECT "id", "name", "unit" FROM "Menu";
DROP TABLE "Menu";
ALTER TABLE "new_Menu" RENAME TO "Menu";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PresetMenu_presetId_menuId_key" ON "PresetMenu"("presetId", "menuId");
