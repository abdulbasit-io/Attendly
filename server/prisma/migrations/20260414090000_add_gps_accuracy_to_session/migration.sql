-- Add GPS accuracy tracking to Session model
-- This allows accuracy-aware geofencing when both lecturer and students use cell tower GPS

ALTER TABLE "Session" ADD COLUMN "lecturerGpsAccuracyM" INTEGER DEFAULT 0;

-- Index for querying sessions by accuracy
CREATE INDEX "Session_lecturerGpsAccuracyM_idx" ON "Session"("lecturerGpsAccuracyM");
