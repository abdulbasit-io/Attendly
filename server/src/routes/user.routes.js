const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { auth, requireRole } = require('../middleware/auth');
const { eventEmitter } = require('../services/events');

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

router.get('/session-stream', auth, requireRole('LECTURER'), (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  const listener = (session) => {
    res.write(`data: ${JSON.stringify(session)}\n\n`);
  };

  eventEmitter.on(`sessionCreated:${req.user.id}`, listener);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventEmitter.off(`sessionCreated:${req.user.id}`, listener);
  });
});

module.exports = router;
