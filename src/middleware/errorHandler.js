import { logger } from '../utils/logger.js'

export function errorHandler(error, request, reply) {
  logger.error('Request failed', {
    method: request.method,
    url:    request.url,
    error:  error.message
  })

  if (error.validation) {
    return reply.status(400).send({
      success: false, message: 'Validation failed',
      errors: error.validation, timestamp: new Date().toISOString()
    })
  }

  const code = error.statusCode || 500
  const msg  = code === 500 ? 'Internal server error' : error.message

  return reply.status(code).send({
    success: false, message: msg, timestamp: new Date().toISOString()
  })
}