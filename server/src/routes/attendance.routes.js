const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const attendanceController = require('../controllers/attendance.controller');

// Student: sign attendance
router.post('/',
  auth, requireRole('STUDENT'),
  [
    body('sessionId').isUUID(),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('deviceId').optional().isString().isLength({ max: 64 }),
    body('fingerprint').optional().isString().isLength({ max: 32 }),
  ],
  attendanceController.sign
);

// Student: my attendance history
router.get('/history', auth, requireRole('STUDENT'), attendanceController.history);

// Lecturer: records for a course
router.get('/course/:courseId', auth, requireRole('LECTURER'), attendanceController.byCourse);

// Lecturer: export CSV
router.get('/course/:courseId/export', auth, requireRole('LECTURER'), attendanceController.exportCsv);

module.exports = router;
