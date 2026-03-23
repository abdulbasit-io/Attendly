const prisma = require('../config/db');

async function create(lecturerId, data) {
  const { courseCode, courseTitle } = data;
  return prisma.course.create({
    data: { lecturerId, courseCode, courseTitle },
  });
}

async function list(lecturerId) {
  return prisma.course.findMany({
    where: { lecturerId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { sessions: true } },
    },
  });
}

async function getById(id, lecturerId) {
  const course = await prisma.course.findFirst({
    where: { id, lecturerId },
    include: {
      sessions: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { attendances: true } } },
      },
    },
  });

  if (!course) {
    const err = new Error('Course not found');
    err.status = 404;
    throw err;
  }

  return { course, sessions: course.sessions };
}

async function update(id, lecturerId, data) {
  const course = await prisma.course.findFirst({ where: { id, lecturerId } });
  if (!course) {
    const err = new Error('Course not found');
    err.status = 404;
    throw err;
  }

  return prisma.course.update({
    where: { id },
    data: {
      ...(data.courseCode && { courseCode: data.courseCode }),
      ...(data.courseTitle && { courseTitle: data.courseTitle }),
    },
  });
}

async function archive(id, lecturerId) {
  const course = await prisma.course.findFirst({ where: { id, lecturerId } });
  if (!course) {
    const err = new Error('Course not found');
    err.status = 404;
    throw err;
  }

  return prisma.course.update({
    where: { id },
    data: { isArchived: !course.isArchived },
  });
}

module.exports = { create, list, getById, update, archive };
