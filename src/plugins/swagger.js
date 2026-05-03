import fp               from 'fastify-plugin'
import fastifySwagger   from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { swaggerConfig, swaggerUiConfig } from '../config/swagger.js'

async function swaggerPlugin(fastify) {
  await fastify.register(fastifySwagger,   swaggerConfig)
  await fastify.register(fastifySwaggerUi, swaggerUiConfig)
}

export default fp(swaggerPlugin)