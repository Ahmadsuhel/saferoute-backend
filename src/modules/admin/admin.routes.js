import { authorizeAdmin } from '../../middleware/authenticate.js'
import * as controller    from './admin.controller.js'
import {
  getDashboardSchema,
  getHeatmapSchema,
  getPendingIncidentsSchema,
  moderateIncidentSchema,
  getAnalyticsSchema,
  getAllUsersSchema,
  banUserSchema
} from './admin.schema.js'

export default async function adminRoutes(fastify) {

  // Sab routes ADMIN only hain
  fastify.get('/dashboard', {
    schema:     getDashboardSchema,
    preHandler: [authorizeAdmin]
  }, controller.getDashboard)

  fastify.get('/heatmap', {
    schema:     getHeatmapSchema,
    preHandler: [authorizeAdmin]
  }, controller.getHeatmap)

  fastify.get('/incidents/pending', {
    schema:     getPendingIncidentsSchema,
    preHandler: [authorizeAdmin]
  }, controller.getPendingIncidents)

  fastify.patch('/incidents/:id', {
    schema:     moderateIncidentSchema,
    preHandler: [authorizeAdmin]
  }, controller.moderateIncident)

  fastify.get('/analytics', {
    schema:     getAnalyticsSchema,
    preHandler: [authorizeAdmin]
  }, controller.getAnalytics)

  fastify.get('/users', {
    schema:     getAllUsersSchema,
    preHandler: [authorizeAdmin]
  }, controller.getAllUsers)

  fastify.patch('/users/:id/ban', {
    schema:     banUserSchema,
    preHandler: [authorizeAdmin]
  }, controller.banUser)
}