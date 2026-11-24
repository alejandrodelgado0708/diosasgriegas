CREATE TABLE "Shop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radius" INTEGER NOT NULL DEFAULT 150,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Shop_address_key" ON "Shop"("address");

INSERT INTO "Shop" ("name", "address", "latitude", "longitude", "radius", "updatedAt") VALUES
('Solano · Calle 898', 'Calle 898 4384, San Francisco Solano', -34.7812387, -58.3141546, 200, CURRENT_TIMESTAMP),
('Solano · Av. 844 2510', 'Av. 844 2510, San Francisco Solano', -34.7809899, -58.3132082, 200, CURRENT_TIMESTAMP),
('Solano · Av. 844 2678', 'Av. 844 2678, San Francisco Solano', -34.7814877, -58.3140591, 200, CURRENT_TIMESTAMP),
('Lomas · Laprida 151', 'Laprida 151, Lomas de Zamora', -34.7606015, -58.3989141, 200, CURRENT_TIMESTAMP);
