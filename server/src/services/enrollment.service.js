const prisma = require('../config/db');

// Verify course belongs to lecturer
async function assertOwner(courseId, lecturerId) {
  const course = await prisma.course.findFirst({ where: { id: courseId, lecturerId } });
  if (!course) {
    const err = new Error('Course not found or access denied');
    err.status = 404;
    throw err;
  }
  return course;
}

async function importEnrollment(courseId, lecturerId, students) {
  await assertOwner(courseId, lecturerId);

  if (!Array.isArray(students) || students.length === 0) {
    const err = new Error('students array is required and must not be empty');
    err.status = 422;
    throw err;
  }

  // Upsert all students (update name if matric already exists)
  const results = await prisma.$transaction(
    students.map(({ matricNumber, studentName }) =>
      prisma.courseEnrollment.upsert({
        where: { courseId_matricNumber: { courseId, matricNumber } },
        update: { studentName: studentName || null },
        create: { courseId, matricNumber, studentName: studentName || null },
      })
    )
  );

  return { imported: results.length, total: await prisma.courseEnrollment.count({ where: { courseId } }) };
}

async function getEnrollment(courseId, lecturerId) {
  await assertOwner(courseId, lecturerId);

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    orderBy: { matricNumber: 'asc' },
  });

  return { enrollments, total: enrollments.length };
}

async function clearEnrollment(courseId, lecturerId) {
  await assertOwner(courseId, lecturerId);

  const { count } = await prisma.courseEnrollment.deleteMany({ where: { courseId } });
  return { deleted: count };
}

module.exports = { importEnrollment, getEnrollment, clearEnrollment };
