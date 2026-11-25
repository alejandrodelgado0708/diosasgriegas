CREATE TYPE "Role_new" AS ENUM ('administrador', 'vendedor', 'local');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'vendedor';
ALTER TABLE "User" ADD COLUMN "localAddress" TEXT;

CREATE TABLE "StoreSale" (
    "id" TEXT NOT NULL,
    "localUserId" TEXT NOT NULL,
    "saleDate" TEXT NOT NULL,
    "saleNumber" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "size" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "soldBy" TEXT NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoreSale_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoreSale_localUserId_saleDate_saleNumber_key" ON "StoreSale"("localUserId", "saleDate", "saleNumber");
CREATE INDEX "StoreSale_localUserId_soldAt_idx" ON "StoreSale"("localUserId", "soldAt");
ALTER TABLE "StoreSale" ADD CONSTRAINT "StoreSale_localUserId_fkey" FOREIGN KEY ("localUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
