-- CreateEnum
CREATE TYPE "RetailerKind" AS ENUM ('store', 'webshop');

-- CreateEnum
CREATE TYPE "ListingSource" AS ENUM ('producer', 'community', 'admin');

-- DropIndex
DROP INDEX "Retailer_name_key";

-- AlterTable
ALTER TABLE "PriceListing" ADD COLUMN     "addedById" TEXT,
ADD COLUMN     "source" "ListingSource" NOT NULL DEFAULT 'admin';

-- AlterTable
ALTER TABLE "Retailer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "kind" "RetailerKind" NOT NULL DEFAULT 'store',
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "aroma" INTEGER,
ADD COLUMN     "cuerpo" INTEGER,
ADD COLUMN     "equilibrio" INTEGER,
ADD COLUMN     "final" INTEGER,
ADD COLUMN     "sabor" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Retailer_name_city_key" ON "Retailer"("name", "city");

-- AddForeignKey
ALTER TABLE "PriceListing" ADD CONSTRAINT "PriceListing_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

