ALTER TABLE "StoreSale" ADD COLUMN "productDetail" TEXT;
UPDATE "StoreSale" SET "productDetail" = '' WHERE "productDetail" IS NULL;
ALTER TABLE "StoreSale" ALTER COLUMN "productDetail" SET NOT NULL;
