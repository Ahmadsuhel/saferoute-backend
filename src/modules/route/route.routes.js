import { authenticate }  from '../../middleware/authenticate.js'
import * as controller   from './route.controller.js'
import {
  calculateRouteSchema,
  getRouteHistorySchema,
  getRouteByIdSchema
} from './route.schema.js'

export default async function routeRoutes(fastify) {

  fastify.post('/calculate', {
    schema:     calculateRouteSchema,
    preHandler: [authenticate]
  }, controller.calculateRoute)

  fastify.get('/history', {
    schema:     getRouteHistorySchema,
    preHandler: [authenticate]
  }, controller.getRouteHistory)

  fastify.get('/:id', {
    schema:     getRouteByIdSchema,
    preHandler: [authenticate]
  }, controller.getRouteById)
}