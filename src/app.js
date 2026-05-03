import Fastify           from 'fastify'
import helmet            from '@fastify/helmet'
import { ENV }           from './config/env.js'
import { errorHandler }  from './middleware/errorHandler.js'
import googleOAuthPlugin from './plugins/googleOAuth.js'
import swaggerPlugin     from './plugins/swagger.js'
import corsPlugin        from './plugins/cors.js'
import jwtPlugin         from './plugins/jwt.js'
import authRoutes        from './modules/auth/auth.routes.js'
import incidentRoutes    from './modules/incident/incident.routes.js'
import routeRoutes from './modules/route/route.routes.js'
import adminRoutes from './modules/admin/admin.routes.js'

export async function buildApp() {
  const fastify = Fastify({ logger: false, trustProxy: true })
  await fastify.register(helmet, { contentSecurityPolicy: false })
  await fastify.register(corsPlugin)
  await fastify.register(jwtPlugin)
  await fastify.register(googleOAuthPlugin)
  await fastify.register(swaggerPlugin)
  fastify.setErrorHandler(errorHandler)

  fastify.get('/health', {
    schema: {
      tags: ['Health'], summary: 'Health check',
      response: {
        200: {
          type: 'object',
          properties: {
            success:   { type: 'boolean' },
            message:   { type: 'string'  },
            version:   { type: 'string'  },
            timestamp: { type: 'string'  }
          }
        }
      }
    }
  }, async (req, reply) => reply.send({
    success:   true,
    message:   `${ENV.APP_NAME} is running`,
    version:   ENV.APP_VERSION,
    timestamp: new Date().toISOString()
  }))

  await fastify.register(authRoutes,     { prefix: `${ENV.API_PREFIX}/auth`      })
  await fastify.register(incidentRoutes, { prefix: `${ENV.API_PREFIX}/incidents` })
  await fastify.register(routeRoutes, { prefix: `${ENV.API_PREFIX}/routes` })
  await fastify.register(adminRoutes, { prefix: `${ENV.API_PREFIX}/admin` })

  fastify.setNotFoundHandler((req, reply) => {
    reply.status(404).send({
      success:   false,
      message:   `${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString()
    })
  })

  return fastify
}