const { validationResult } = require('express-validator');
const sessionService = require('../services/session.service');
const { eventEmitter } = require('../services/events');

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const result = await sessionService.create(req.user.id, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const result = await sessionService.getById(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function close(req, res, next) {
  try {
    const session = await sessionService.close(req.params.id, req.user.id);
    res.json({ session });
  } catch (err) {
    next(err);
  }
}

async function getInfo(req, res, next) {
  try {
    const info = await sessionService.getInfo(req.params.id);
    res.json(info);
  } catch (err) {
    next(err);
  }
}

// SSE stream for live attendee updates
function stream(req, res) {
  const sessionId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send a heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  const listener = (attendee) => {
    res.write(`data: ${JSON.stringify(attendee)}\n\n`);
  };

  eventEmitter.on(`attendance:${sessionId}`, listener);

  req.on('close', () => {
    clearInterval(heartbeat);
    eventEmitter.off(`attendance:${sessionId}`, listener);
  });
}

async function deleteSession(req, res, next) {
  try {
    await sessionService.deleteSession(req.params.id, req.user.id);
    res.status(200).json({ message: 'Session deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, getById, close, deleteSession, getInfo, stream };
