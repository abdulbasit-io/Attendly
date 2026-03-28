-- Add markedManually flag to Attendance
ALTER TABLE "Attendance" ADD COLUMN "markedManually" BOOLEAN NOT NULL DEFAULT false;

-- Create CourseEnrollment table
CREATE TABLE "CourseEnrollment" (
  "id"           TEXT         NOT NULL,
  "courseId"     TEXT         NOT NULL,
  "matricNumber" TEXT         NOT NULL,
  "studentName"  TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CourseEnrollment"
  ADD CONSTRAINT "CourseEnrollment_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "CourseEnrollment_courseId_matricNumber_key"
  ON "CourseEnrollment"("courseId", "matricNumber");
