const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { rateLimit } = require('express-rate-limit');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests. Please wait a minute.' },
});

router.post('/register',
  authLimiter,
  [
    body('role').isIn(['LECTURER', 'STUDENT']),
    body('fullName').trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('department').if(body('role').equals('STUDENT')).notEmpty(),
    body('matricNumber').if(body('role').equals('STUDENT')).notEmpty(),
    body('gender').if(body('role').equals('STUDENT')).isIn(['MALE', 'FEMALE']),
  ],
  authController.register
);

router.post('/login',
  authLimiter,
  [
    body('identifier').trim().notEmpty(),
    body('password').notEmpty(),
  ],
  authController.login
);

router.post('/refresh', authController.refresh);

router.post('/forgot-password',
  authLimiter,
  [body('email').isEmail().normalizeEmail()],
  authController.forgotPassword
);

router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  authController.resetPassword
);

router.get('/me', auth, authController.me);

router.put('/profile',
  auth,
  [
    body('fullName').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
    body('department').optional().trim().notEmpty(),
    body('gender').optional().isIn(['MALE', 'FEMALE']),
  ],
  authController.updateProfile
);

module.exports = router;
