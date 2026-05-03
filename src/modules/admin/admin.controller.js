import { sendSuccess, sendError, sendPaginated } from '../../utils/response.js'
import * as AdminService from './admin.service.js'

export async function getDashboard(request, reply) {
  try {
    const data = await AdminService.getDashboard()
    return sendSuccess(reply, data, 'Dashboard stats fetched')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getHeatmap(request, reply) {
  try {
    const data = await AdminService.getHeatmap(request.query)
    return sendSuccess(reply, data, 'Heatmap data fetched')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getPendingIncidents(request, reply) {
  try {
    const { incidents, total, page, limit } = await AdminService.getPendingIncidents(request.query)
    return sendPaginated(reply, incidents, total, page, limit)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function moderateIncident(request, reply) {
  try {
    const { action, reason } = request.body
    const data = await AdminService.moderateIncident(
      request.user.id,
      request.params.id,
      action,
      reason
    )
    return sendSuccess(reply, data.incident, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getAnalytics(request, reply) {
  try {
    const data = await AdminService.getAnalytics(request.query)
    return sendSuccess(reply, data, 'Analytics fetched')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getAllUsers(request, reply) {
  try {
    const { users, total, page, limit } = await AdminService.getAllUsers(request.query)
    return sendPaginated(reply, users, total, page, limit)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function banUser(request, reply) {
  try {
    const data = await AdminService.banUser(
      request.user.id,
      request.params.id,
      request.body.action
    )
    return sendSuccess(reply, null, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}