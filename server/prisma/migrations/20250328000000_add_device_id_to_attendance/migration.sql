-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "deviceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_deviceId_key" ON "Attendance"("sessionId", "deviceId");

-- Add fingerprint column and unique constraint
ALTER TABLE "Attendance" ADD COLUMN "fingerprint" TEXT;
CREATE UNIQUE INDEX "Attendance_sessionId_fingerprint_key" ON "Attendance"("sessionId", "fingerprint");
