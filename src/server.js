import { buildApp }   from './app.js'
import { ENV }        from './config/env.js'
import { logger }     from './utils/logger.js'
import { initSocket } from './socket/socket.server.js'

async function start() {
  try {
    const app = await buildApp()

    // Socket.IO — Fastify ke same server par
    initSocket(app.server)

    await app.listen({ port: ENV.PORT, host: '0.0.0.0' })

    logger.info('Server started', {
      port:   ENV.PORT,
      docs:   `http://localhost:${ENV.PORT}/docs`,
      health: `http://localhost:${ENV.PORT}/health`,
      socket: `http://localhost:${ENV.PORT}`
    })

  } catch (err) {
    logger.error('Startup failed', { error: err.message })
    process.exit(1)
  }
}

process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT',  () => process.exit(0))

start()