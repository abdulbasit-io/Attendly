const prisma = require('../config/db');
const { generateSessionQR } = require('../utils/qrGenerator');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

async function create(lecturerId, data) {
  const { courseId, timeLimitMinutes, latitude, longitude, geofenceRadiusM = 50 } = data;

  // Verify course belongs to this lecturer
  const course = await prisma.course.findFirst({ where: { id: courseId, lecturerId } });
  if (!course) {
    const err = new Error('Course not found or access denied');
    err.status = 404;
    throw err;
  }

  const expiresAt = new Date(Date.now() + timeLimitMinutes * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      courseId,
      lecturerId,
      latitude,
      longitude,
      geofenceRadiusM,
      timeLimitMinutes,
      qrPayload: `session_${Date.now()}`,
      expiresAt,
    },
    include: { course: true },
  });

  // Update the qrPayload with the actual session ID (after creation)
  await prisma.session.update({
    where: { id: session.id },
    data: { qrPayload: session.id },
  });

  const { attendUrl, imageBase64 } = await generateSessionQR(session.id, CLIENT_URL);

  // Schedule auto-close
  setTimeout(async () => {
    await prisma.session.updateMany({
      where: { id: session.id, status: 'ACTIVE' },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }, timeLimitMinutes * 60 * 1000);

  return {
    session: { ...session, qrPayload: session.id },
    qrCodeImage: imageBase64,
    attendUrl,
  };
}

async function getById(id, lecturerId) {
  const session = await prisma.session.findFirst({
    where: { id, lecturerId },
    include: {
      course: true,
      attendances: {
        include: {
          student: {
            select: { id: true, fullName: true, matricNumber: true, department: true },
          },
        },
        orderBy: { signedAt: 'asc' },
      },
    },
  });

  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  const { imageBase64 } = await generateSessionQR(session.id, CLIENT_URL);

  return {
    session,
    qrCodeImage: imageBase64,
    attendees: session.attendances.map((a) => ({
      id: a.student.id,
      fullName: a.student.fullName,
      matricNumber: a.student.matricNumber,
      department: a.student.department,
      signedAt: a.signedAt,
      distanceM: a.distanceM,
    })),
  };
}

async function close(id, lecturerId) {
  const session = await prisma.session.findFirst({ where: { id, lecturerId } });
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }
  if (session.status === 'CLOSED') {
    const err = new Error('Session is already closed');
    err.status = 400;
    throw err;
  }

  return prisma.session.update({
    where: { id },
    data: { status: 'CLOSED', closedAt: new Date() },
  });
}

async function getInfo(id) {
  const session = await prisma.session.findUnique({
    where: { id },
    include: { course: { include: { lecturer: { select: { fullName: true } } } } },
  });

  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  return {
    courseTitle: session.course.courseTitle,
    courseCode: session.course.courseCode,
    lecturerName: session.course.lecturer.fullName,
    status: session.status,
    expiresAt: session.expiresAt,
    geofenceRadiusM: session.geofenceRadiusM,
  };
}

module.exports = { create, getById, close, getInfo };
