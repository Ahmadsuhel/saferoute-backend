import { Server }       from 'socket.io'
import { logger }       from '../utils/logger.js'
import { ENV }          from '../config/env.js'
import alertHandlers    from './handlers/alerts.js'
import locationHandlers from './handlers/location.js'
import sosHandlers      from './handlers/sos.js'
import { setSocketIO } from '../modules/incident/incident.service.js'

// Online users track karo
// { userId: socketId }
export const onlineUsers = new Map()

// Area subscriptions track karo
// { areaKey: Set(socketIds) }
export const areaSubscriptions = new Map()

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      ENV.IS_DEV ? '*' : ENV.FRONTEND_URL,
      methods:     ['GET', 'POST'],
      credentials: true
    }
  })

  // JWT authentication middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token ||
                    socket.handshake.headers?.authorization?.split(' ')[1]

      if (!token) {
        return next(new Error('Authentication required'))
      }

      // Token verify — manually decode karo
      const base64Payload = token.split('.')[1]
      const payload       = JSON.parse(Buffer.from(base64Payload, 'base64').toString())

      if (!payload.id) {
        return next(new Error('Invalid token'))
      }

      // User info socket par attach karo
      socket.userId = payload.id
      socket.userRole = payload.role
      socket.userName = payload.name

      next()
    } catch (err) {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    logger.info('Socket connected', {
      socketId: socket.id,
      userId:   socket.userId
    })

    // Online users mein add karo
    onlineUsers.set(socket.userId, socket.id)

    // Handlers register karo
    alertHandlers(io, socket)
    locationHandlers(io, socket)
    sosHandlers(io, socket)

    // Disconnect handle karo
    socket.on('disconnect', () => {
      onlineUsers.delete(socket.userId)

      // Area subscriptions se remove karo
      for (const [areaKey, subscribers] of areaSubscriptions.entries()) {
        subscribers.delete(socket.id)
        if (subscribers.size === 0) {
          areaSubscriptions.delete(areaKey)
        }
      }

      logger.info('Socket disconnected', {
        socketId: socket.id,
        userId:   socket.userId
      })
    })
  })

  logger.info('Socket.IO initialized')
    setSocketIO(io)
  return io
}

// Helper — specific user ko emit karo
export function emitToUser(io, userId, event, data) {
  const socketId = onlineUsers.get(userId)
  if (socketId) {
    io.to(socketId).emit(event, data)
    return true
  }
  return false  // User offline hai
}

// Helper — area ke sab users ko emit karo
export function emitToArea(io, areaKey, event, data) {
  const subscribers = areaSubscriptions.get(areaKey)
  if (subscribers && subscribers.size > 0) {
    for (const socketId of subscribers) {
      io.to(socketId).emit(event, data)
    }
  }
}