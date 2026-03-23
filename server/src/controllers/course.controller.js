const { validationResult } = require('express-validator');
const courseService = require('../services/course.service');

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const course = await courseService.create(req.user.id, req.body);
    res.status(201).json({ course });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const courses = await courseService.list(req.user.id);
    res.json({ courses });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const course = await courseService.getById(req.params.id, req.user.id);
    res.json(course);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const course = await courseService.update(req.params.id, req.user.id, req.body);
    res.json({ course });
  } catch (err) {
    next(err);
  }
}

async function archive(req, res, next) {
  try {
    const course = await courseService.archive(req.params.id, req.user.id);
    res.json({ course });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById, update, archive };
