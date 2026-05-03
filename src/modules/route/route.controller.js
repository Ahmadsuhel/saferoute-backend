import { sendSuccess, sendError, sendPaginated } from '../../utils/response.js'
import * as RouteService from './route.service.js'

export async function calculateRoute(request, reply) {
  try {
    const data = await RouteService.calculateRoute(
      request.user.id,
      request.body
    )
    return sendSuccess(reply, data, 'Route calculated successfully')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getRouteHistory(request, reply) {
  try {
    const { routes, total, page, limit } = await RouteService.getRouteHistory(
      request.user.id,
      request.query
    )
    return sendPaginated(reply, routes, total, page, limit)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getRouteById(request, reply) {
  try {
    const data = await RouteService.getRouteById(
      request.user.id,
      request.params.id
    )
    return sendSuccess(reply, data, 'Route fetched')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}