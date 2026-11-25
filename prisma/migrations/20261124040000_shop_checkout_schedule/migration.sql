ALTER TABLE "Shop" ADD COLUMN "scheduledExitTime" TEXT;
ALTER TABLE "Punch" ADD COLUMN "shopId" INTEGER;
UPDATE "Punch" SET "shopId"=(SELECT id FROM "Shop" WHERE active=true LIMIT 1) WHERE "shopId" IS NULL AND (SELECT COUNT(*) FROM "Shop" WHERE active=true)=1;
CREATE INDEX "Punch_shopId_inAt_idx" ON "Punch"("shopId", "inAt");
ALTER TABLE "Punch" ADD CONSTRAINT "Punch_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
