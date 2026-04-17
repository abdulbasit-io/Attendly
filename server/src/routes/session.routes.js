const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const sessionController = require('../controllers/session.controller');

// Create session (lecturer only)
router.post('/',
  auth, requireRole('LECTURER'),
  [
    body('courseId').isUUID(),
    body('timeLimitMinutes').isInt({ min: 1, max: 180 }),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('geofenceRadiusM').optional().isInt({ min: 10, max: 500 }),
    body('gpsAccuracyM').optional().isInt({ min: 0, max: 5000 }),
    body('level').optional().isInt({ min: 100, max: 900 }),
  ],
  sessionController.create
);

// Get session detail (lecturer — full data)
router.get('/:id', auth, requireRole('LECTURER'), sessionController.getById);

// Close session (lecturer only)
router.patch('/:id/close', auth, requireRole('LECTURER'), sessionController.close);

// Delete session (lecturer only)
router.delete('/:id', auth, requireRole('LECTURER'), sessionController.deleteSession);

// SSE stream for live attendee updates (lecturer only)
router.get('/:id/stream', auth, requireRole('LECTURER'), sessionController.stream);

// Session info for student (public-ish — just requires auth, not lecturer)
router.get('/:id/info', auth, sessionController.getInfo);

module.exports = router;
