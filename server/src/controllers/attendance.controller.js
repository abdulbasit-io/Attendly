const { validationResult } = require('express-validator');
const attendanceService = require('../services/attendance.service');

async function sign(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    const result = await attendanceService.sign(req.user.id, { ...req.body, ipAddress: ip });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const history = await attendanceService.history(req.user.id, req.query.courseId);
    res.json({ history });
  } catch (err) {
    next(err);
  }
}

async function byCourse(req, res, next) {
  try {
    const result = await attendanceService.byCourse(req.params.courseId, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function exportCsv(req, res, next) {
  try {
    const csv = await attendanceService.exportCsv(req.params.courseId, req.user.id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${req.params.courseId}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

async function signManually(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const result = await attendanceService.signManually(req.user.id, req.params.sessionId, req.body.studentId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { sign, signManually, history, byCourse, exportCsv };
