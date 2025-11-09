-- CreateTable
CREATE TABLE "Menu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "multiplier" REAL NOT NULL,
    "unit" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Stats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "defeatCount" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "StatsMenu" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "statsId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "count" INTEGER NOT NULL,
    CONSTRAINT "StatsMenu_statsId_fkey" FOREIGN KEY ("statsId") REFERENCES "Stats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StatsMenu_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "Menu" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Stats_date_key" ON "Stats"("date");
