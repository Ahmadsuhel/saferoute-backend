-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('SAFE', 'CAUTION', 'DANGER');

-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceLat" DOUBLE PRECISION NOT NULL,
    "sourceLng" DOUBLE PRECISION NOT NULL,
    "sourceAddr" TEXT,
    "destLat" DOUBLE PRECISION NOT NULL,
    "destLng" DOUBLE PRECISION NOT NULL,
    "destAddr" TEXT,
    "distance" DOUBLE PRECISION,
    "duration" DOUBLE PRECISION,
    "safetyScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "pathData" JSONB,
    "city" TEXT NOT NULL DEFAULT 'Delhi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
