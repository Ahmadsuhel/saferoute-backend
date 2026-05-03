import { PrismaClient } from '@prisma/client'
import { logger }       from '../../utils/logger.js'

const prisma = new PrismaClient()
let ioInstance = null;
export function setSocketIO(io) {
  ioInstance = io
}

// ── Report Incident ───────────────────────────
export async function reportIncident(userId, body) {
  const {
    type, description, latitude, longitude,
    address, city, isAnonymous = false
  } = body

  const incident = await prisma.incident.create({
    data: {
      type,
      description,
      latitude,
      longitude,
      address,
      city,
      isAnonymous,
      reportedBy: isAnonymous ? null : userId,
    }
  })

  logger.info('Incident reported', {
    incidentId: incident.id,
    type,
    city,
    userId: isAnonymous ? 'anonymous' : userId
  })

  // ← YAHAN BROADCAST ADD KARO
  if (ioInstance) {
    const latKey  = Math.round(latitude  * 10) / 10
    const lngKey  = Math.round(longitude * 10) / 10
    const areaKey = `${latKey},${lngKey}`

    const severity = ['VIOLENCE', 'ROBBERY'].includes(type) ? 'HIGH'
                   : ['HARASSMENT', 'STREET_FIGHT', 'PROTEST'].includes(type) ? 'MEDIUM'
                   : 'LOW'

    ioInstance.to(areaKey).emit('danger-alert', {
      id:          incident.id,
      type,
      description,
      latitude,
      longitude,
      city,
      severity,
      timestamp:   new Date().toISOString()
    })

    logger.info('Danger alert broadcast', { areaKey, type })
  }

  return incident
}

// ── Get Nearby Incidents ──────────────────────
export async function getNearbyIncidents(query) {
  const {
    lat, lng,
    radius = 2,   // default 2km
    type,
    limit  = 20
  } = query

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  const radiusNum = parseFloat(radius)

  // Haversine formula se distance calculate karte hain
  // 1 degree latitude ≈ 111 km
  const latDelta = radiusNum / 111
  const lngDelta = radiusNum / (111 * Math.cos(latNum * Math.PI / 180))

  const where = {
    status: { not: 'REJECTED' },
    latitude:  { gte: latNum - latDelta, lte: latNum + latDelta },
    longitude: { gte: lngNum - lngDelta, lte: lngNum + lngDelta },
  }

  if (type) where.type = type

  const incidents = await prisma.incident.findMany({
    where,
    take:    parseInt(limit),
    orderBy: { createdAt: 'desc' },
    select: {
      id:          true,
      type:        true,
      description: true,
      latitude:    true,
      longitude:   true,
      address:     true,
      city:        true,
      status:      true,
      upvotes:     true,
      downvotes:   true,
      isAnonymous: true,
      createdAt:   true,
      reporter: {
        select: { id: true, name: true, }
      }
    }
  })

  // Distance calculate karke add karo
  const withDistance = incidents.map(incident => {
    const dLat = (incident.latitude  - latNum) * Math.PI / 180
    const dLng = (incident.longitude - lngNum) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(latNum * Math.PI / 180) *
      Math.cos(incident.latitude * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = 6371 * c  // km mein

    return {
      ...incident,
      // Anonymous reporter hide karo
      reporter:    incident.isAnonymous ? null : incident.reporter,
      distanceKm:  Math.round(distance * 100) / 100
    }
  })

  // Distance se sort karo — nearest first
  withDistance.sort((a, b) => a.distanceKm - b.distanceKm)

  return withDistance
}

// ── Vote on Incident ──────────────────────────
export async function voteIncident(userId, incidentId, voteType) {
  // Incident exist karta hai?
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId }
  })

  if (!incident) {
    const err = new Error('Incident not found')
    err.statusCode = 404
    throw err
  }

  // Apni hi report vote nahi kar sakte
  if (incident.reportedBy === userId) {
    const err = new Error('You cannot vote on your own report')
    err.statusCode = 400
    throw err
  }

  // Pehle vote check karo
  const existingVote = await prisma.incidentVote.findUnique({
    where: {
      incidentId_userId: { incidentId, userId }
    }
  })

  if (existingVote) {
    if (existingVote.voteType === voteType) {
      // Same vote — remove karo (toggle)
      await prisma.incidentVote.delete({
        where: { incidentId_userId: { incidentId, userId } }
      })

      // Count update karo
      await updateVoteCounts(incidentId)
      return { message: 'Vote removed' }
    } else {
      // Different vote — update karo
      await prisma.incidentVote.update({
        where: { incidentId_userId: { incidentId, userId } },
        data:  { voteType }
      })
    }
  } else {
    // Naya vote
    await prisma.incidentVote.create({
      data: { incidentId, userId, voteType }
    })
  }

  // Vote counts update karo
  await updateVoteCounts(incidentId)

  return { message: `${voteType.toLowerCase()} recorded` }
}

// Helper — vote counts update karo
async function updateVoteCounts(incidentId) {
  const [upvotes, downvotes] = await Promise.all([
    prisma.incidentVote.count({
      where: { incidentId, voteType: 'UPVOTE' }
    }),
    prisma.incidentVote.count({
      where: { incidentId, voteType: 'DOWNVOTE' }
    })
  ])

  // Auto verify — 10+ upvotes aur downvotes se kam
  const status = upvotes >= 10 && upvotes > downvotes * 2
    ? 'VERIFIED'
    : 'PENDING'

  await prisma.incident.update({
    where: { id: incidentId },
    data:  { upvotes, downvotes, status }
  })
}

// ── Get My Incidents ──────────────────────────
export async function getMyIncidents(userId, query) {
  const page  = parseInt(query.page  || 1)
  const limit = parseInt(query.limit || 10)
  const skip  = (page - 1) * limit

  const [incidents, total] = await Promise.all([
    prisma.incident.findMany({
      where:   { reportedBy: userId },
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      include: {
        votes: {
          where: { userId },
          select: { voteType: true }
        }
      }
    }),
    prisma.incident.count({ where: { reportedBy: userId } })
  ])

  return { incidents, total, page, limit }
}

// ── Get Incident By ID ────────────────────────
export async function getIncidentById(incidentId) {
  const incident = await prisma.incident.findUnique({
    where:  { id: incidentId },
    include: {
      reporter: {
        select: { id: true, name: true,}
      },
      votes: {
        select: { voteType: true, userId: true }
      }
    }
  })

  if (!incident) {
    const err = new Error('Incident not found')
    err.statusCode = 404
    throw err
  }

  return {
    ...incident,
    reporter: incident.isAnonymous ? null : incident.reporter
  }
}

// ── Delete Incident ───────────────────────────
export async function deleteIncident(userId, incidentId) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId }
  })

  if (!incident) {
    const err = new Error('Incident not found')
    err.statusCode = 404
    throw err
  }

  // Sirf apni report delete kar sakte hain
  if (incident.reportedBy !== userId) {
    const err = new Error('You can only delete your own reports')
    err.statusCode = 403
    throw err
  }

  await prisma.incident.delete({ where: { id: incidentId } })

  logger.info('Incident deleted', { incidentId, userId })

  return { message: 'Incident deleted successfully' }
}