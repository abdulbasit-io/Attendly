const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/db');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

async function register(data) {
  const { role, fullName, email, password, department, matricNumber, gender, level } = data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('Email already in use');
    err.status = 409;
    throw err;
  }

  if (matricNumber) {
    const existingMatric = await prisma.user.findUnique({ where: { matricNumber } });
    if (existingMatric) {
      const err = new Error('Matric number already registered');
      err.status = 409;
      throw err;
    }
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      role,
      fullName,
      email,
      passwordHash,
      department: department || null,
      matricNumber: matricNumber || null,
      gender: gender || null,
      level: level ? parseInt(level, 10) : null,
    },
  });

  const tokenPayload = { id: user.id, role: user.role };
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
}

async function login(identifier, password) {
  // identifier can be email or matric number
  const isEmail = identifier.includes('@');
  const user = await prisma.user.findFirst({
    where: isEmail
      ? { email: identifier }
      : { matricNumber: identifier },
  });

  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  const tokenPayload = { id: user.id, role: user.role };
  return {
    user: sanitizeUser(user),
    accessToken: signAccessToken(tokenPayload),
    refreshToken: signRefreshToken(tokenPayload),
  };
}

async function refresh(token) {
  const payload = verifyRefreshToken(token);
  if (!payload) {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }

  return { accessToken: signAccessToken({ id: user.id, role: user.role }) };
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent — prevent enumeration

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt: expires },
  });

  // Email sending handled by email.service if SMTP configured
  // For now, log in dev
  if (process.env.NODE_ENV === 'development') {
    console.log(`Password reset token for ${email}: ${token}`);
  }
}

async function resetPassword(token, newPassword) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);
}

async function getUser(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return sanitizeUser(user);
}

async function updateProfile(id, data) {
  const { fullName, department, gender, level } = data;
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(fullName && { fullName }),
      ...(department && { department }),
      ...(gender && { gender }),
      ...(level !== undefined && { level: level ? parseInt(level, 10) : null }),
    },
  });
  return sanitizeUser(user);
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    const err = new Error('Current password is incorrect');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}

module.exports = { register, login, refresh, forgotPassword, resetPassword, getUser, updateProfile, changePassword };
