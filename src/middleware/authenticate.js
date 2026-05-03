import { logger }             from '../utils/logger.js'
import { isTokenBlacklisted } from '../utils/tokenBlacklist.js'
import { PrismaClient }       from '@prisma/client'

const prisma = new PrismaClient()

export async function authenticate(request, reply) {
  try {
    const authHeader = request.headers['authorization']

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success:   false,
        message:   'Unauthorized — no token provided',
        timestamp: new Date().toISOString()
      })
    }

    const token = authHeader.split(' ')[1]

    const blacklisted = await isTokenBlacklisted(token)
    if (blacklisted) {
      return reply.status(401).send({
        success:   false,
        message:   'Session expired. Please login again.',
        timestamp: new Date().toISOString()
      })
    }

    await request.jwtVerify()

    // DEBUG — yeh lines temporarily add karo
    console.log('=== AUTH DEBUG ===')
    console.log('JWT user:', request.user)
    console.log('JWT tokenVersion:', request.user.tokenVersion)

    const dbUser = await prisma.user.findUnique({
      where:  { id: request.user.id },
      select: { tokenVersion: true, isActive: true }
    })

    console.log('DB user:', dbUser)
    console.log('DB tokenVersion:', dbUser?.tokenVersion)
    console.log('Match:', dbUser?.tokenVersion === (request.user.tokenVersion ?? 0))
    console.log('==================')

    if (!dbUser || !dbUser.isActive) {
      return reply.status(401).send({
        success:   false,
        message:   'Account not found or deactivated.',
        timestamp: new Date().toISOString()
      })
    }

    const jwtVersion = request.user.tokenVersion ?? 0

    if (dbUser.tokenVersion !== jwtVersion) {
      return reply.status(401).send({
        success:   false,
        message:   'Session expired. Please login again.',
        timestamp: new Date().toISOString()
      })
    }

  } catch (err) {
    logger.warn('Unauthorized', { url: request.url, error: err.message })
    return reply.status(401).send({
      success:   false,
      message:   'Unauthorized — invalid or expired token',
      timestamp: new Date().toISOString()
    })
  }
}

export async function authorizeAdmin(request, reply) {
  await authenticate(request, reply)
  if (request.user?.role !== 'ADMIN') {
    return reply.status(403).send({
      success:   false,
      message:   'Forbidden — admin access only',
      timestamp: new Date().toISOString()
    })
  }
}