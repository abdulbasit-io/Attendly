const crypto = require('crypto');
const prisma = require('../config/db');
const { haversineDistance } = require('../utils/haversine');
const { eventEmitter } = require('./events');

// Combine hardware fingerprint + IP into one hash so both must match for a
// conflict. Uses SHA-256 truncated to 16 hex chars (same width as client hash).
function combineFingerprint(fingerprint, ipAddress) {
  if (!fingerprint && !ipAddress) return null;
  const input = `${fingerprint || ''}|${ipAddress || ''}`;
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

async function sign(studentId, data) {
  const { sessionId, latitude, longitude, gpsAccuracyM, deviceId, fingerprint, ipAddress } = data;

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

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, fullName: true, matricNumber: true, department: true, level: true },
  });

  if (session.level !== null) {
    if (student?.level !== session.level) {
      const err = new Error(`This session is for ${session.level}L students only`);
      err.status = 403;
      throw err;
    }
  }

  // Check enrollment list if the course has one
  const hasEnrollment = await prisma.courseEnrollment.findFirst({
    where: { courseId: session.courseId },
    select: { id: true },
  });
  if (hasEnrollment) {
    if (!student?.matricNumber) {
      const err = new Error('Your account has no matric number on file. Contact your lecturer.');
      err.status = 403;
      throw err;
    }
    const enrolled = await prisma.courseEnrollment.findUnique({
      where: { courseId_matricNumber: { courseId: session.courseId, matricNumber: student.matricNumber } },
    });
    if (!enrolled) {
      const err = new Error('You are not on the enrollment list for this course.');
      err.status = 403;
      throw err;
    }
  }

  let distance;
  try {
    distance = haversineDistance(
      parseFloat(session.latitude),
      parseFloat(session.longitude),
      latitude,
      longitude
    );
  } catch (err) {
    if (err.code === 'INVALID_COORDS') {
      // Log coordinate error for debugging
      console.error(
        `[ATTENDANCE] Invalid GPS coordinates detected for session ${sessionId}:`,
        err.message
      );
      const errMsg = new Error('GPS data error: Invalid location data. Please contact support.');
      errMsg.status = 400;
      throw errMsg;
    }
    throw err;
  }

  // ACCURACY-AWARE GEOFENCING
  // If GPS accuracy is poor (cell tower triangulation), expand geofence tolerance
  const studentGpsAccuracyM = gpsAccuracyM || 0;
  const lecturerGpsAccuracyM = session.lecturerGpsAccuracyM || 0;
  const combinedUncertaintyM = studentGpsAccuracyM + lecturerGpsAccuracyM;

  // Adaptive geofence: use base geofence, but expand if both sides have poor GPS
  const adjustedGeofenceM = Math.max(
    session.geofenceRadiusM,
    combinedUncertaintyM + 50  // 50m buffer for additional safety margin
  );

  const gpsAccuracyWarning = combinedUncertaintyM > 200
    ? ` (GPS accuracy is ±${lecturerGpsAccuracyM}m lecturer, ±${studentGpsAccuracyM}m student)`
    : '';

  // Log distance for debugging purposes
  console.log(
    `[ATTENDANCE] Student ${studentId} signed in: distance=${Math.round(distance)}m, ` +
    `geofence=${session.geofenceRadiusM}m${combinedUncertaintyM > 0 ? `, adjusted=${Math.round(adjustedGeofenceM)}m` : ''}, ` +
    `coords=[${latitude},${longitude}]${gpsAccuracyWarning}`
  );

  if (distance > adjustedGeofenceM) {
    const recommendedAction = combinedUncertaintyM > 200
      ? ' Try refreshing your location or moving closer to a window/outdoors for better GPS signal.'
      : '';
    const err = new Error(
      `You are too far from the class (${Math.round(distance)}m away, limit is ${Math.round(adjustedGeofenceM)}m).${recommendedAction}`
    );
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

  if (deviceId) {
    const deviceConflict = await prisma.attendance.findUnique({
      where: { sessionId_deviceId: { sessionId, deviceId } },
    });
    if (deviceConflict) {
      const err = new Error('Attendance has already been signed from this device for this session');
      err.status = 409;
      throw err;
    }
  }

  const combinedFingerprint = combineFingerprint(fingerprint, ipAddress);
  if (combinedFingerprint) {
    const fpConflict = await prisma.attendance.findUnique({
      where: { sessionId_fingerprint: { sessionId, fingerprint: combinedFingerprint } },
    });
    if (fpConflict) {
      const err = new Error('Attendance has already been signed from this device for this session');
      err.status = 409;
      throw err;
    }
  }

  if (ipAddress) {
    const ipConflict = await prisma.attendance.findFirst({
      where: { sessionId, ipAddress },
    });
    if (ipConflict) {
      const err = new Error('Attendance has already been signed from this device for this session');
      err.status = 409;
      throw err;
    }
  }

  const attendance = await prisma.attendance.create({
    data: {
      sessionId,
      studentId,
      deviceId: deviceId || null,
      fingerprint: combinedFingerprint,
      ipAddress: ipAddress || null,
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
    markedManually: false,
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

async function signManually(lecturerId, sessionId, studentId) {
  // Verify session belongs to this lecturer and is active
  const session = await prisma.session.findFirst({
    where: { id: sessionId, lecturerId },
  });
  if (!session) {
    const err = new Error('Session not found or access denied');
    err.status = 404;
    throw err;
  }
  if (session.status === 'CLOSED' || session.expiresAt < new Date()) {
    const err = new Error('Cannot mark attendance on a closed or expired session');
    err.status = 400;
    throw err;
  }

  // Verify student exists
  const student = await prisma.user.findUnique({
    where: { id: studentId, role: 'STUDENT' },
    select: { id: true, fullName: true, matricNumber: true, department: true },
  });
  if (!student) {
    const err = new Error('Student not found');
    err.status = 404;
    throw err;
  }

  // Prevent duplicates
  const existing = await prisma.attendance.findUnique({
    where: { sessionId_studentId: { sessionId, studentId } },
  });
  if (existing) {
    const err = new Error('Student has already been marked present for this session');
    err.status = 409;
    throw err;
  }

  const attendance = await prisma.attendance.create({
    data: {
      sessionId,
      studentId,
      markedManually: true,
      latitude: session.latitude,
      longitude: session.longitude,
      distanceM: 0,
    },
  });

  const eventPayload = {
    id: student.id,
    fullName: student.fullName,
    matricNumber: student.matricNumber,
    department: student.department,
    signedAt: attendance.signedAt,
    distanceM: attendance.distanceM,
    markedManually: true,
  };
  eventEmitter.emit(`attendance:${sessionId}`, eventPayload);

  return { attendance, message: 'Student marked present successfully' };
}

module.exports = { sign, signManually, history, byCourse, exportCsv };
