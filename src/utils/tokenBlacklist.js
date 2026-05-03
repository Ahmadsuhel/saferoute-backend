import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function blacklistToken(token, expiresInMinutes = 15) {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)
  try {
    await prisma.blacklistedToken.upsert({
      where:  { token },
      update: { expiresAt },
      create: { token, expiresAt }
    })
  } catch (err) {
    // already blacklisted — ignore
  }
}

export async function isTokenBlacklisted(token) {
  try {
    const record = await prisma.blacklistedToken.findUnique({
      where: { token }
    })
    if (!record) return false
    if (record.expiresAt < new Date()) {
      await prisma.blacklistedToken.delete({ where: { token } })
      return false
    }
    return true
  } catch (err) {
    return false
  }
}