import { authenticate }  from '../../middleware/authenticate.js'
import * as controller   from './incident.controller.js'
import {
  reportIncidentSchema,
  nearbyIncidentsSchema,
  voteIncidentSchema,
  getMyIncidentsSchema,
  getIncidentByIdSchema,
  deleteIncidentSchema
} from './incident.schema.js'

export default async function incidentRoutes(fastify) {

  // ── Protected — login zaroori ─────────────────
  fastify.post('/report', {
    schema:     reportIncidentSchema,
    preHandler: [authenticate]
  }, controller.reportIncident)

  fastify.get('/my', {
    schema:     getMyIncidentsSchema,
    preHandler: [authenticate]
  }, controller.getMyIncidents)

  fastify.patch('/:id/vote', {
    schema:     voteIncidentSchema,
    preHandler: [authenticate]
  }, controller.voteIncident)

  fastify.delete('/:id', {
    schema:     deleteIncidentSchema,
    preHandler: [authenticate]
  }, controller.deleteIncident)

  // ── Public — login zaroori nahi ───────────────
  fastify.get('/nearby', {
    schema: nearbyIncidentsSchema
  }, controller.getNearbyIncidents)

  fastify.get('/:id', {
    schema: getIncidentByIdSchema
  }, controller.getIncidentById)
}