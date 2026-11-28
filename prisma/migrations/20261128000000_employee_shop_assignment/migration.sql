ALTER TABLE "User" ADD COLUMN "assignedShopId" INTEGER;

CREATE INDEX "User_assignedShopId_idx" ON "User"("assignedShopId");

ALTER TABLE "User" ADD CONSTRAINT "User_assignedShopId_fkey" FOREIGN KEY ("assignedShopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;