import { PrismaClient } from '@prisma/client'
import { logger }       from '../../utils/logger.js'
import { calculateSafetyScore, getRiskLevel, getRiskColor } from '../../utils/safetyScore.js'

const prisma = new PrismaClient()

// OSRM se route fetch karo — free, no API key
async function getOSRMRoute(sourceLat, sourceLng, destLat, destLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${sourceLng},${sourceLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=true`

    const response = await fetch(url)
    const data     = await response.json()

    if (data.code !== 'Ok') {
      throw new Error('Route not found')
    }

    // Multiple routes return karo (alternatives)
    return data.routes.map((route, index) => ({
      index,
      distance: Math.round(route.distance / 1000 * 100) / 100,  // km
      duration: Math.round(route.duration / 60),                  // minutes
      path:     route.geometry,                                    // GeoJSON
      legs:     route.legs
    }))

  } catch (err) {
    logger.error('OSRM route fetch failed', { error: err.message })
    // Fallback — straight line route return karo
    return [{
      index:    0,
      distance: calculateStraightDistance(sourceLat, sourceLng, destLat, destLng),
      duration: null,
      path:     null,
      legs:     []
    }]
  }
}

// Straight line distance (Haversine)
function calculateStraightDistance(lat1, lng1, lat2, lng2) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2)
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)) * 100) / 100
}

// Route ke aaspaas incidents fetch karo
async function getIncidentsAlongRoute(sourceLat, sourceLng, destLat, destLng) {
  // Bounding box — source aur destination ke beech ka area
  const minLat = Math.min(sourceLat, destLat) - 0.05  // ~5km buffer
  const maxLat = Math.max(sourceLat, destLat) + 0.05
  const minLng = Math.min(sourceLng, destLng) - 0.05
  const maxLng = Math.max(sourceLng, destLng) + 0.05

  const incidents = await prisma.incident.findMany({
    where: {
      status:    { not: 'REJECTED' },
      latitude:  { gte: minLat, lte: maxLat },
      longitude: { gte: minLng, lte: maxLng },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    },
    select: {
      id:        true,
      type:      true,
      status:    true,
      latitude:  true,
      longitude: true,
      createdAt: true,
    }
  })

  return incidents
}

// ── Calculate Route ───────────────────────────
export async function calculateRoute(userId, body) {
  const {
    sourceLat, sourceLng, sourceAddr,
    destLat,   destLng,   destAddr,
    city = 'Delhi'
  } = body

  // 1. OSRM se routes fetch karo
  const osrmRoutes = await getOSRMRoute(sourceLat, sourceLng, destLat, destLng)

  // 2. Incidents fetch karo
  const incidents = await getIncidentsAlongRoute(sourceLat, sourceLng, destLat, destLng)

  // 3. Har route ka safety score calculate karo
  const scoredRoutes = osrmRoutes.map((route, index) => {
    const score     = calculateSafetyScore(incidents)
    const riskLevel = getRiskLevel(score)
    const color     = getRiskColor(score)

    return {
      routeIndex:  index,
      distance:    route.distance,
      duration:    route.duration,
      safetyScore: score,
      riskLevel,
      color,
      path:        route.path,
      isSafest:    false,
      isFastest:   false,
    }
  })

  // 4. Best route identify karo
  const safestIdx  = scoredRoutes.reduce((best, r, i) =>
    r.safetyScore > scoredRoutes[best].safetyScore ? i : best, 0)
  const fastestIdx = scoredRoutes.reduce((best, r, i) =>
    (r.duration || 999) < (scoredRoutes[best].duration || 999) ? i : best, 0)

  scoredRoutes[safestIdx].isSafest   = true
  scoredRoutes[fastestIdx].isFastest = true

  // 5. Best route DB mein save karo
  const bestRoute = scoredRoutes[safestIdx]

  const savedRoute = await prisma.route.create({
    data: {
      userId,
      sourceLat,
      sourceLng,
      sourceAddr,
      destLat,
      destLng,
      destAddr,
      distance:    bestRoute.distance,
      duration:    bestRoute.duration,
      safetyScore: bestRoute.safetyScore,
      riskLevel:   bestRoute.riskLevel,
      pathData:    bestRoute.path,
      city,
    }
  })

  logger.info('Route calculated', {
    userId,
    routeId:     savedRoute.id,
    safetyScore: bestRoute.safetyScore,
    incidents:   incidents.length
  })

  return {
    routeId:    savedRoute.id,
    routes:     scoredRoutes,
    incidents:  incidents.length,
    summary: {
      safestRoute:  scoredRoutes[safestIdx],
      fastestRoute: scoredRoutes[fastestIdx],
      totalIncidentsNearby: incidents.length,
      incidentTypes: [...new Set(incidents.map(i => i.type))]
    }
  }
}

// ── Get Route History ─────────────────────────
export async function getRouteHistory(userId, query) {
  const page  = parseInt(query.page  || 1)
  const limit = parseInt(query.limit || 10)
  const skip  = (page - 1) * limit

  const [routes, total] = await Promise.all([
    prisma.route.findMany({
      where:   { userId },
      skip,
      take:    limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id:          true,
        sourceLat:   true,
        sourceLng:   true,
        sourceAddr:  true,
        destLat:     true,
        destLng:     true,
        destAddr:    true,
        distance:    true,
        duration:    true,
        safetyScore: true,
        riskLevel:   true,
        city:        true,
        createdAt:   true,
      }
    }),
    prisma.route.count({ where: { userId } })
  ])

  return { routes, total, page, limit }
}

// ── Get Route By ID ───────────────────────────
export async function getRouteById(userId, routeId) {
  const route = await prisma.route.findUnique({
    where: { id: routeId }
  })

  if (!route) {
    const err = new Error('Route not found')
    err.statusCode = 404
    throw err
  }

  if (route.userId !== userId) {
    const err = new Error('Unauthorized')
    err.statusCode = 403
    throw err
  }

  return route
}