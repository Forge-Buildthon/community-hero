-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Low', 'Medium', 'High', 'Severe');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('reported', 'under_review', 'resolved', 'disputed');

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "description" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'reported',
    "repairImageUrl" TEXT,
    "verificationConfidence" DOUBLE PRECISION,
    "verificationReason" TEXT,
    "fraudRisk" TEXT,
    "communityReports" INTEGER NOT NULL DEFAULT 0,
    "affectedCount" INTEGER NOT NULL DEFAULT 0,
    "confirmedBy" TEXT[],
    "supportingReports" JSONB NOT NULL DEFAULT '[]',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previousRepairImageUrl" TEXT,
    "previousVerificationConfidence" DOUBLE PRECISION,
    "previousVerificationReason" TEXT,
    "previousFraudRisk" TEXT,
    "verificationAttempts" INTEGER,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");
