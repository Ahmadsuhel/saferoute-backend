import { PrismaClient } from '@prisma/client'
import { logger }       from '../../utils/logger.js'

const prisma = new PrismaClient()

// ── Dashboard Stats ───────────────────────────
export async function getDashboard() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalUsers,
    totalIncidents,
    todayIncidents,
    pendingIncidents,
    verifiedIncidents,
    totalRoutes,
    incidentsByType,
    recentIncidents
  ] = await Promise.all([
    prisma.user.count(),
    prisma.incident.count(),
    prisma.incident.count({
      where: { createdAt: { gte: today } }
    }),
    prisma.incident.count({
      where: { status: 'PENDING' }
    }),
    prisma.incident.count({
      where: { status: 'VERIFIED' }
    }),
    prisma.route.count(),
    prisma.incident.groupBy({
      by:     ['type'],
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    }),
    prisma.incident.findMany({
      take:    5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, city: true,
        status: true, createdAt: true
      }
    })
  ])

  return {
    stats: {
      totalUsers,
      totalIncidents,
      todayIncidents,
      pendingIncidents,
      verifiedIncidents,
      totalRoutes,
    },
    incidentsByType: incidentsByType.map(i => ({
      type:  i.type,
      count: i._count.type
    })),
    recentIncidents
  }
}

// ── City Risk Heatmap ─────────────────────────
export async function getHeatmap(query) {
  const { city = 'Delhi', time = 'all' } = query

  // Time filter
  let hourFilter = {}
  const now = new Date()

  if (time === 'morning')   { hourFilter = { gte: new Date(now.setHours(6,0,0,0)),  lte: new Date(now.setHours(12,0,0,0)) } }
  if (time === 'afternoon') { hourFilter = { gte: new Date(now.setHours(12,0,0,0)), lte: new Date(now.setHours(17,0,0,0)) } }
  if (time === 'evening')   { hourFilter = { gte: new Date(now.setHours(17,0,0,0)), lte: new Date(now.setHours(21,0,0,0)) } }
  if (time === 'night')     { hourFilter = { gte: new Date(now.setHours(21,0,0,0)), lte: new Date(now.setHours(23,59,59,0)) } }

  const where = {
    city,
    status: { not: 'REJECTED' },
    ...(time !== 'all' && { createdAt: hourFilter })
  }

  const incidents = await prisma.incident.findMany({
    where,
    select: {
      latitude:  true,
      longitude: true,
      type:      true,
      status:    true,
      createdAt: true,
    }
  })

  // Grid mein group karo — 0.01 degree ≈ 1km
  const grid = {}

  for (const incident of incidents) {
    const latKey = Math.round(incident.latitude  * 100) / 100
    const lngKey = Math.round(incident.longitude * 100) / 100
    const key    = `${latKey},${lngKey}`

    if (!grid[key]) {
      grid[key] = {
        latitude:       latKey,
        longitude:      lngKey,
        incidentCount:  0,
        types:          {},
        safetyScore:    100,
      }
    }

    grid[key].incidentCount++
    grid[key].types[incident.type] = (grid[key].types[incident.type] || 0) + 1
  }

  // Safety score calculate karo
  const WEIGHTS = {
    VIOLENCE: 20, ROBBERY: 20, HARASSMENT: 15,
    STREET_FIGHT: 12, PROTEST: 10, ACCIDENT: 8,
    SUSPICIOUS: 8, ROAD_BLOCKED: 6, UNSAFE_LIGHTING: 5, OTHER: 5
  }

  const heatmapData = Object.values(grid).map(cell => {
    let deduction = 0
    for (const [type, count] of Object.entries(cell.types)) {
      deduction += (WEIGHTS[type] || 5) * count
    }
    const score    = Math.max(0, 100 - deduction)
    const riskLevel = score >= 70 ? 'SAFE' : score >= 40 ? 'CAUTION' : 'DANGER'
    const color     = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red'

    return {
      ...cell,
      safetyScore: score,
      riskLevel,
      color,
    }
  })

  return {
    city,
    time,
    totalCells:    heatmapData.length,
    totalIncidents: incidents.length,
    heatmap:       heatmapData,
    summary: {
      safeCells:    heatmapData.filter(c => c.riskLevel === 'SAFE').length,
      cautionCells: heatmapData.filter(c => c.riskLevel === 'CAUTION').length,
      dangerCells:  heatmapData.filter(c => c.riskLevel === 'DANGER').length,
    }
  }
}

// ── Pending Incidents ─────────────────────────
export async function getPendingIncidents(query) {
  const page  = parseInt(query.page  || 1)
  const limit = parseInt(query.limit || 10)
  const skip  = (page - 1) * limit

  const where = {
    status: 'PENDING',
    ...(query.type && { type: query.type })
  }

  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true }
        },
        votes: {
          select: { voteType: true }
        }
      }
    }),
    prisma.incident.count({ where })
  ])

  const withStats = incidents.map(incident => ({
    ...incident,
    reporter:  incident.isAnonymous ? null : incident.reporter,
    upvotes:   incident.votes.filter(v => v.voteType === 'UPVOTE').length,
    downvotes: incident.votes.filter(v => v.voteType === 'DOWNVOTE').length,
    flags:     incident.votes.filter(v => v.voteType === 'FLAG').length,
    votes:     undefined
  }))

  return { incidents: withStats, total, page, limit }
}

// ── Moderate Incident ─────────────────────────
export async function moderateIncident(adminId, incidentId, action, reason) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId }
  })

  if (!incident) {
    const err = new Error('Incident not found')
    err.statusCode = 404
    throw err
  }

  const status = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data:  { status }
  })

  logger.info('Incident moderated', {
    adminId, incidentId, action, status
  })

  return {
    message:  `Incident ${action.toLowerCase()}d successfully`,
    incident: updated
  }
}

// ── Analytics ─────────────────────────────────
export async function getAnalytics(query) {
  const days = parseInt(query.days || 30)
  const city = query.city || null
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const where = {
    createdAt: { gte: from },
    ...(city && { city })
  }

  const [
    byType,
    byStatus,
    byCity,
    dailyTrend,
    topAreas
  ] = await Promise.all([
    // Incidents by type
    prisma.incident.groupBy({
      by:     ['type'],
      where,
      _count: { type: true },
      orderBy: { _count: { type: 'desc' } }
    }),

    // Incidents by status
    prisma.incident.groupBy({
      by:     ['status'],
      where,
      _count: { status: true }
    }),

    // Incidents by city
    prisma.incident.groupBy({
      by:     ['city'],
      where,
      _count: { city: true },
      orderBy: { _count: { city: 'desc' } },
      take:   10
    }),

    // Last 7 days daily count
    prisma.incident.findMany({
      where: {
        ...where,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    }),

    // Top danger areas
    prisma.incident.groupBy({
      by:     ['city', 'latitude', 'longitude'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take:   5
    })
  ])

  // Daily trend group by date
  const dailyMap = {}
  for (const incident of dailyTrend) {
    const date = incident.createdAt.toISOString().split('T')[0]
    dailyMap[date] = (dailyMap[date] || 0) + 1
  }

  return {
    period:   `Last ${days} days`,
    byType:   byType.map(i => ({ type: i.type, count: i._count.type })),
    byStatus: byStatus.map(i => ({ status: i.status, count: i._count.status })),
    byCity:   byCity.map(i => ({ city: i.city, count: i._count.city })),
    dailyTrend: Object.entries(dailyMap).map(([date, count]) => ({ date, count })),
    topAreas: topAreas.map(i => ({
      city:      i.city,
      latitude:  i.latitude,
      longitude: i.longitude,
      count:     i._count.id
    }))
  }
}

// ── Get All Users ─────────────────────────────
export async function getAllUsers(query) {
  const page   = parseInt(query.page  || 1)
  const limit  = parseInt(query.limit || 10)
  const skip   = (page - 1) * limit
  const search = query.search

  const where = search ? {
    OR: [
      { name:  { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  } : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:          true,
        name:        true,
        email:       true,
        phone:       true,
        city:        true,
        role:        true,
        isVerified:  true,
        isActive:    true,
        // authProvider: true,
        createdAt:   true,
        _count: {
          select: {
            incidents: true,
            routes:    true,
          }
        }
      }
    }),
    prisma.user.count({ where })
  ])

  return { users, total, page, limit }
}

// ── Ban / Unban User ──────────────────────────
export async function banUser(adminId, userId, action) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  if (user.role === 'ADMIN') {
    const err = new Error('Cannot ban an admin user')
    err.statusCode = 403
    throw err
  }

  const isActive = action === 'UNBAN'

  await prisma.user.update({
    where: { id: userId },
    data:  { isActive }
  })

  // Agar ban kiya — saare tokens delete karo
  if (action === 'BAN') {
    await prisma.refreshToken.deleteMany({ where: { userId } })
  }

  logger.info(`User ${action.toLowerCase()}ned`, { adminId, userId })

  return { message: `User ${action.toLowerCase()}ned successfully` }
}