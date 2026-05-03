import { onlineUsers } from '../socket.server.js'
import { logger }      from '../../utils/logger.js'

// Active location shares track karo
// { userId: Set(trustedContactIds) }
const activeShares = new Map()

export default function locationHandlers(io, socket) {

  // Location sharing shuru karo
  socket.on('start-sharing', ({ trustedContacts }) => {
    if (!trustedContacts || trustedContacts.length === 0) {
      return socket.emit('share-error', { message: 'No trusted contacts provided' })
    }

    activeShares.set(socket.userId, new Set(trustedContacts))

    // Contacts ko notify karo
    for (const contactId of trustedContacts) {
      const contactSocketId = onlineUsers.get(contactId)
      if (contactSocketId) {
        io.to(contactSocketId).emit('sharing-started', {
          userId:   socket.userId,
          userName: socket.userName,
          message:  `${socket.userName} has started sharing their location`
        })
      }
    }

    socket.emit('sharing-confirmed', {
      message:  'Location sharing started',
      contacts: trustedContacts.length
    })

    logger.info('Location sharing started', {
      userId:   socket.userId,
      contacts: trustedContacts.length
    })
  })

  // Live location update bhejo
  socket.on('location-update', ({ latitude, longitude, accuracy }) => {
    const contacts = activeShares.get(socket.userId)
    if (!contacts) return

    const locationData = {
      userId:    socket.userId,
      userName:  socket.userName,
      latitude,
      longitude,
      accuracy,
      timestamp: new Date().toISOString()
    }

    // Har contact ko location bhejo
    for (const contactId of contacts) {
      const contactSocketId = onlineUsers.get(contactId)
      if (contactSocketId) {
        io.to(contactSocketId).emit('location-received', locationData)
      }
    }
  })

  // Location sharing band karo
  socket.on('stop-sharing', () => {
    const contacts = activeShares.get(socket.userId)

    if (contacts) {
      // Contacts ko notify karo
      for (const contactId of contacts) {
        const contactSocketId = onlineUsers.get(contactId)
        if (contactSocketId) {
          io.to(contactSocketId).emit('sharing-stopped', {
            userId:  socket.userId,
            message: `${socket.userName} has stopped sharing their location`
          })
        }
      }
      activeShares.delete(socket.userId)
    }

    socket.emit('sharing-ended', { message: 'Location sharing stopped' })

    logger.info('Location sharing stopped', { userId: socket.userId })
  })

  // Disconnect par sharing band karo
  socket.on('disconnect', () => {
    const contacts = activeShares.get(socket.userId)
    if (contacts) {
      for (const contactId of contacts) {
        const contactSocketId = onlineUsers.get(contactId)
        if (contactSocketId) {
          io.to(contactSocketId).emit('sharing-stopped', {
            userId:  socket.userId,
            message: `${socket.userName} went offline`
          })
        }
      }
      activeShares.delete(socket.userId)
    }
  })
}