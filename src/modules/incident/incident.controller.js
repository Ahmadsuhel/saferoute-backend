import { sendSuccess, sendError, sendPaginated } from '../../utils/response.js'
import * as IncidentService from './incident.service.js'

export async function reportIncident(request, reply) {
  try {
    const data = await IncidentService.reportIncident(
      request.user.id,
      request.body
    )
    return sendSuccess(reply, data, 'Incident reported successfully', 201)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getNearbyIncidents(request, reply) {
  try {
    const data = await IncidentService.getNearbyIncidents(request.query)
    return sendSuccess(reply, data, 'Nearby incidents fetched')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function voteIncident(request, reply) {
  try {
    const data = await IncidentService.voteIncident(
      request.user.id,
      request.params.id,
      request.body.voteType
    )
    return sendSuccess(reply, null, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getMyIncidents(request, reply) {
  try {
    const { incidents, total, page, limit } = await IncidentService.getMyIncidents(
      request.user.id,
      request.query
    )
    return sendPaginated(reply, incidents, total, page, limit)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getIncidentById(request, reply) {
  try {
    const data = await IncidentService.getIncidentById(request.params.id)
    return sendSuccess(reply, data, 'Incident fetched')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function deleteIncident(request, reply) {
  try {
    const data = await IncidentService.deleteIncident(
      request.user.id,
      request.params.id
    )
    return sendSuccess(reply, null, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}