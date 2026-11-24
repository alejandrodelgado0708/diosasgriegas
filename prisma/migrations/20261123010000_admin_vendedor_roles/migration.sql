CREATE TYPE "Role" AS ENUM ('administrador', 'vendedor');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

UPDATE "User"
SET "role" = CASE "role"
  WHEN 'admin' THEN 'administrador'
  WHEN 'employee' THEN 'vendedor'
  ELSE "role"
END;

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "Role"
  USING ("role"::"Role");

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'vendedor';
