-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "deviceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_deviceId_key" ON "Attendance"("sessionId", "deviceId");
