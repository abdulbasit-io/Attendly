const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { auth, requireRole } = require('../middleware/auth');
const courseController = require('../controllers/course.controller');

router.use(auth, requireRole('LECTURER'));

router.post('/',
  [
    body('courseCode').trim().notEmpty().toUpperCase(),
    body('courseTitle').trim().notEmpty().isLength({ min: 2, max: 200 }),
  ],
  courseController.create
);

router.get('/', courseController.list);

router.get('/:id', courseController.getById);

router.put('/:id',
  [
    body('courseCode').optional().trim().notEmpty().toUpperCase(),
    body('courseTitle').optional().trim().notEmpty().isLength({ min: 2, max: 200 }),
  ],
  courseController.update
);

router.patch('/:id/archive', courseController.archive);

module.exports = router;
