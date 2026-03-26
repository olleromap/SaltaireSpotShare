-- CreateEnum
CREATE TYPE "SpotType" AS ENUM ('REGULAR', 'TANDEM', 'HANDICAPPED');

-- AlterTable ParkingSpot: add type and hasEV columns
ALTER TABLE "ParkingSpot" ADD COLUMN "type" "SpotType" NOT NULL DEFAULT 'REGULAR';
ALTER TABLE "ParkingSpot" ADD COLUMN "hasEV" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable SpotAvailability: change DATE to TIMESTAMP
ALTER TABLE "SpotAvailability" ALTER COLUMN "startDate" TYPE TIMESTAMP(3) USING "startDate"::TIMESTAMP(3);
ALTER TABLE "SpotAvailability" ALTER COLUMN "endDate" TYPE TIMESTAMP(3) USING "endDate"::TIMESTAMP(3);

-- AlterTable Reservation: change DATE to TIMESTAMP
ALTER TABLE "Reservation" ALTER COLUMN "startDate" TYPE TIMESTAMP(3) USING "startDate"::TIMESTAMP(3);
ALTER TABLE "Reservation" ALTER COLUMN "endDate" TYPE TIMESTAMP(3) USING "endDate"::TIMESTAMP(3);
