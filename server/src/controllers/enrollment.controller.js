const { validationResult } = require('express-validator');
const enrollmentService = require('../services/enrollment.service');

async function importEnrollment(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const result = await enrollmentService.importEnrollment(req.params.id, req.user.id, req.body.students);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getEnrollment(req, res, next) {
  try {
    const result = await enrollmentService.getEnrollment(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function clearEnrollment(req, res, next) {
  try {
    const result = await enrollmentService.clearEnrollment(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { importEnrollment, getEnrollment, clearEnrollment };
