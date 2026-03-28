const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');

// Lecturer: search registered students by name or matric number
router.get('/search', auth, requireRole('LECTURER'), async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ students: [] });
    }

    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { matricNumber: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, fullName: true, matricNumber: true, department: true, level: true },
      take: 10,
      orderBy: { fullName: 'asc' },
    });

    res.json({ students });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
