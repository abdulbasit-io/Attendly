const prisma = require('../config/db');
const { haversineDistance } = require('../utils/haversine');
const { eventEmitter } = require('./events');

async function sign(studentId, data) {
  const { sessionId, latitude, longitude } = data;

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    const err = new Error('Session not found');
    err.status = 404;
    throw err;
  }

  if (session.status === 'CLOSED' || session.expiresAt < new Date()) {
    const err = new Error('This session has expired or is closed');
    err.status = 400;
    throw err;
  }

  if (session.level !== null) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { level: true },
    });
    if (student?.level !== session.level) {
      const err = new Error(`This session is for ${session.level}L students only`);
      err.status = 403;
      throw err;
    }
  }

  const distance = haversineDistance(
    parseFloat(session.latitude),
    parseFloat(session.longitude),
    latitude,
    longitude
  );

  if (distance > session.geofenceRadiusM) {
    const err = new Error(`You are too far from the class (${Math.round(distance)}m away, limit is ${session.geofenceRadiusM}m)`);
    err.status = 400;
    throw err;
  }

  const existing = await prisma.attendance.findUnique({
    where: { sessionId_studentId: { sessionId, studentId } },
  });
  if (existing) {
    const err = new Error('You have already signed attendance for this session');
    err.status = 409;
    throw err;
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, fullName: true, matricNumber: true, department: true },
  });

  const attendance = await prisma.attendance.create({
    data: {
      sessionId,
      studentId,
      latitude,
      longitude,
      distanceM: Math.round(distance * 100) / 100,
    },
  });

  // Emit to SSE listeners
  const eventPayload = {
    id: student.id,
    fullName: student.fullName,
    matricNumber: student.matricNumber,
    department: student.department,
    signedAt: attendance.signedAt,
    distanceM: attendance.distanceM,
  };
  eventEmitter.emit(`attendance:${sessionId}`, eventPayload);

  return {
    attendance,
    message: 'Attendance signed successfully',
  };
}

async function history(studentId, courseId) {
  const where = { studentId };

  if (courseId) {
    where.session = { courseId };
  }

  return prisma.attendance.findMany({
    where,
    include: {
      session: {
        include: { course: { select: { courseCode: true, courseTitle: true } } },
      },
    },
    orderBy: { signedAt: 'desc' },
  });
}

async function byCourse(courseId, lecturerId) {
  // Verify course belongs to lecturer
  const course = await prisma.course.findFirst({ where: { id: courseId, lecturerId } });
  if (!course) {
    const err = new Error('Course not found or access denied');
    err.status = 404;
    throw err;
  }

  const sessions = await prisma.session.findMany({
    where: { courseId },
    include: {
      attendances: {
        include: {
          student: { select: { id: true, fullName: true, matricNumber: true, department: true, gender: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Build per-student stats
  const studentMap = {};
  sessions.forEach((session) => {
    session.attendances.forEach((att) => {
      const { id, fullName, matricNumber, department, gender } = att.student;
      if (!studentMap[id]) {
        studentMap[id] = { id, fullName, matricNumber, department, gender, attended: 0 };
      }
      studentMap[id].attended += 1;
    });
  });

  const totalSessions = sessions.length;
  const records = Object.values(studentMap).map((s) => ({
    ...s,
    total: totalSessions,
    percentage: totalSessions ? Math.round((s.attended / totalSessions) * 100) : 0,
  }));

  return {
    course,
    sessions: sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      status: s.status,
      attendeeCount: s.attendances.length,
    })),
    records,
    stats: {
      totalSessions,
      totalStudents: records.length,
    },
  };
}

async function exportCsv(courseId, lecturerId) {
  const { course, sessions, records } = await byCourse(courseId, lecturerId);

  const header = 'Name,Matric Number,Department,Gender,Sessions Attended,Total Sessions,Percentage\n';
  const rows = records.map((r) =>
    `"${r.fullName}","${r.matricNumber || ''}","${r.department || ''}","${r.gender || ''}",${r.attended},${r.total},${r.percentage}%`
  );

  return header + rows.join('\n');
}

module.exports = { sign, history, byCourse, exportCsv };
