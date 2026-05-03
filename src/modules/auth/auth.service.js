import bcrypt           from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { ENV }          from '../../config/env.js'
import { logger }       from '../../utils/logger.js'

const prisma = new PrismaClient()

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function generateTokens(fastify, user) {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name,tokenVersion: user.tokenVersion }

  const accessToken = fastify.jwt.sign(payload, {
    expiresIn: ENV.JWT_EXPIRES_IN
  })

  const refreshToken = fastify.jwt.sign(
    { id: user.id,tokenVersion: user.tokenVersion },
    { expiresIn: ENV.JWT_REFRESH_EXPIRES_IN }
  )

  return { accessToken, refreshToken }
}

function safeUser(user) {
  return {
    id: user.id, name: user.name, email: user.email,
    phone: user.phone, city: user.city, role: user.role,
    isVerified: user.isVerified, createdAt: user.createdAt,
  }
}

// ── Register ──────────────────────────────────
export async function registerUser(fastify, body) {
  const { name, email, phone, password, city } = body

  const emailExists = await prisma.user.findUnique({ where: { email } })
  if (emailExists) {
    const err = new Error('Email already registered')
    err.statusCode = 409
    throw err
  }

  const phoneExists = await prisma.user.findUnique({ where: { phone } })
  if (phoneExists) {
    const err = new Error('Phone number already registered')
    err.statusCode = 409
    throw err
  }

  const hashedPassword = await bcrypt.hash(password, ENV.SALT_ROUNDS)

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashedPassword, city }
  })

  const tokens = generateTokens(fastify, user)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: user.id, expiresAt }
  })

  logger.info('User registered', { userId: user.id, email })

  return { ...tokens, user: safeUser(user) }
}

// ── Login ─────────────────────────────────────
export async function loginUser(fastify, body) {
  const { email, password } = body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const err = new Error('Invalid email or password')
    err.statusCode = 401
    throw err
  }

  if (!user.isActive) {
    const err = new Error('Account deactivated. Contact support.')
    err.statusCode = 403
    throw err
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    const err = new Error('Invalid email or password')
    err.statusCode = 401
    throw err
  }

  const tokens = generateTokens(fastify, user)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: user.id, expiresAt }
  })

  logger.info('User logged in', { userId: user.id })

  return { ...tokens, user: safeUser(user) }
}

// ── Forgot Password ───────────────────────────
export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { message: 'If this email is registered, OTP has been sent' }
  }

  await prisma.otpToken.deleteMany({
    where: { userId: user.id, type: 'PASSWORD_RESET' }
  })

  const otp       = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.otpToken.create({
    data: { otp, userId: user.id, type: 'PASSWORD_RESET', expiresAt }
  })

  // TODO: send via email — for now check server logs for OTP
  logger.info('OTP generated', { userId: user.id, otp })

  return { message: 'If this email is registered, OTP has been sent' }
}

// ── Verify OTP ────────────────────────────────
export async function verifyOtp(email, otp) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const err = new Error('Invalid OTP or email')
    err.statusCode = 400
    throw err
  }

  const record = await prisma.otpToken.findFirst({
    where: {
      userId: user.id, otp, type: 'PASSWORD_RESET',
      isUsed: false, expiresAt: { gt: new Date() }
    }
  })

  if (!record) {
    const err = new Error('Invalid or expired OTP')
    err.statusCode = 400
    throw err
  }

  return { message: 'OTP verified successfully' }
}

// ── Reset Password ────────────────────────────
export async function resetPassword(email, otp, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    const err = new Error('Invalid request')
    err.statusCode = 400
    throw err
  }

  const record = await prisma.otpToken.findFirst({
    where: {
      userId: user.id, otp, type: 'PASSWORD_RESET',
      isUsed: false, expiresAt: { gt: new Date() }
    }
  })

  if (!record) {
    const err = new Error('Invalid or expired OTP')
    err.statusCode = 400
    throw err
  }

  const hashedPassword = await bcrypt.hash(newPassword, ENV.SALT_ROUNDS)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data:  { password: hashedPassword,    tokenVersion: { increment: 1 } }
    }),
    prisma.otpToken.update({
      where: { id: record.id },
      data:  { isUsed: true }
    })
  ])

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })

  logger.info('Password reset', { userId: user.id })

  return { message: 'Password reset successfully. Please login again.' }
}

// ── Change Password (logged in user) ──────────
export async function changePassword(userId, oldPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  // Old password verify karo
  const isMatch = await bcrypt.compare(oldPassword, user.password)
  if (!isMatch) {
    const err = new Error('Old password is incorrect')
    err.statusCode = 400
    throw err
  }

  // Same password check
  const isSame = await bcrypt.compare(newPassword, user.password)
  if (isSame) {
    const err = new Error('New password cannot be same as old password')
    err.statusCode = 400
    throw err
  }

  const hashedPassword = await bcrypt.hash(newPassword, ENV.SALT_ROUNDS)

  await prisma.user.update({
    where: { id: userId },
    data:  { password: hashedPassword,  tokenVersion: { increment: 1 }  }
  })

  // Saare refresh tokens delete karo — other devices se logout
  await prisma.refreshToken.deleteMany({ where: { userId } })

  logger.info('Password changed', { userId })

  return { message: 'Password changed successfully. Please login again.' }
}

// ── Refresh Token ─────────────────────────────
export async function refreshAccessToken(fastify, refreshToken) {
  const record = await prisma.refreshToken.findUnique({
    where:   { token: refreshToken },
    include: { user: true }
  })

  if (!record || record.expiresAt < new Date()) {
    const err = new Error('Invalid or expired refresh token')
    err.statusCode = 401
    throw err
  }

  const tokens    = generateTokens(fastify, record.user)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { id: record.id } }),
    prisma.refreshToken.create({
      data: { token: tokens.refreshToken, userId: record.user.id, expiresAt }
    })
  ])

  return { ...tokens, user: safeUser(record.user) }
}

// ── Logout ────────────────────────────────────
export async function logoutUser(refreshToken) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  return { message: 'Logged out successfully' }
}




// ── Get Me ────────────────────────────────────
export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      id: true, name: true, email: true, phone: true,
      city: true, role: true, isVerified: true, createdAt: true
    }
  })

  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  return user
}