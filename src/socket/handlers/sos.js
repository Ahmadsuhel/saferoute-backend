import { onlineUsers } from '../socket.server.js'
import { logger }      from '../../utils/logger.js'

export default function sosHandlers(io, socket) {

  // SOS trigger
  socket.on('sos-trigger', ({ latitude, longitude, trustedContacts }) => {

    const sosData = {
      userId:    socket.userId,
      userName:  socket.userName,
      latitude,
      longitude,
      message:   `🚨 EMERGENCY: ${socket.userName} needs help!`,
      timestamp: new Date().toISOString()
    }

    logger.warn('SOS TRIGGERED', {
      userId:    socket.userId,
      userName:  socket.userName,
      latitude,
      longitude
    })

    // Saare trusted contacts ko broadcast karo
    let notified = 0
    for (const contactId of trustedContacts) {
      const contactSocketId = onlineUsers.get(contactId)
      if (contactSocketId) {
        io.to(contactSocketId).emit('sos-received', sosData)
        notified++
      }
    }

    // User ko confirm karo
    socket.emit('sos-sent', {
      message:        `SOS sent to ${notified} online contacts`,
      totalContacts:  trustedContacts.length,
      onlineContacts: notified,
      timestamp:      new Date().toISOString()
    })
  })

  // SOS acknowledge — contact ne dekha
  socket.on('sos-acknowledged', ({ sosUserId }) => {
    const sosSocketId = onlineUsers.get(sosUserId)
    if (sosSocketId) {
      io.to(sosSocketId).emit('sos-help-coming', {
        helperId:   socket.userId,
        helperName: socket.userName,
        message:    `${socket.userName} is on their way to help!`
      })
    }
  })

  // SOS resolve — user safe hai
  socket.on('sos-resolved', ({ trustedContacts }) => {
    for (const contactId of trustedContacts) {
      const contactSocketId = onlineUsers.get(contactId)
      if (contactSocketId) {
        io.to(contactSocketId).emit('sos-resolved', {
          userId:  socket.userId,
          message: `${socket.userName} is safe now ✅`
        })
      }
    }

    socket.emit('sos-resolution-confirmed', {
      message: 'SOS resolved. Contacts notified.'
    })

    logger.info('SOS resolved', { userId: socket.userId })
  })
}