import { areaSubscriptions } from '../socket.server.js'
import { logger }            from '../../utils/logger.js'

export default function alertHandlers(io, socket) {

  // User kisi area mein join karta hai — alerts ke liye subscribe
  socket.on('join-area', ({ latitude, longitude, radius = 2 }) => {
    // Area key banao — grid based
    const latKey  = Math.round(latitude  * 10) / 10
    const lngKey  = Math.round(longitude * 10) / 10
    const areaKey = `${latKey},${lngKey}`

    // Room join karo
    socket.join(areaKey)
    socket.currentArea = areaKey

    // Track karo
    if (!areaSubscriptions.has(areaKey)) {
      areaSubscriptions.set(areaKey, new Set())
    }
    areaSubscriptions.get(areaKey).add(socket.id)

    socket.emit('area-joined', {
      areaKey,
      message: `Subscribed to alerts for area ${areaKey}`
    })

    logger.info('User joined area', {
      userId:  socket.userId,
      areaKey
    })
  })

  // Area se leave karo
  socket.on('leave-area', () => {
    if (socket.currentArea) {
      socket.leave(socket.currentArea)

      const subscribers = areaSubscriptions.get(socket.currentArea)
      if (subscribers) {
        subscribers.delete(socket.id)
      }

      socket.emit('area-left', {
        message: 'Unsubscribed from area alerts'
      })

      socket.currentArea = null
    }
  })
}

// External function — naya incident aane par call karo
export function broadcastIncidentAlert(io, incident) {
  const latKey  = Math.round(incident.latitude  * 10) / 10
  const lngKey  = Math.round(incident.longitude * 10) / 10
  const areaKey = `${latKey},${lngKey}`

  const alertData = {
    id:          incident.id,
    type:        incident.type,
    description: incident.description,
    latitude:    incident.latitude,
    longitude:   incident.longitude,
    city:        incident.city,
    severity:    getSeverity(incident.type),
    timestamp:   new Date().toISOString()
  }

  // Us area ke sab users ko alert
  io.to(areaKey).emit('danger-alert', alertData)

  logger.info('Danger alert broadcast', { areaKey, type: incident.type })
}

function getSeverity(type) {
  const high   = ['VIOLENCE', 'ROBBERY']
  const medium = ['HARASSMENT', 'STREET_FIGHT', 'PROTEST']
  if (high.includes(type))   return 'HIGH'
  if (medium.includes(type)) return 'MEDIUM'
  return 'LOW'
}