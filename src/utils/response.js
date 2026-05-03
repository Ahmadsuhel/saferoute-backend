export const sendSuccess = (reply, data, message = 'Success', code = 200) =>
  reply.status(code).send({
    success: true, message, data,
    timestamp: new Date().toISOString()
  })

export const sendError = (reply, message, code = 500, errors = null) => {
  const body = { success: false, message, timestamp: new Date().toISOString() }
  if (errors) body.errors = errors
  return reply.status(code).send(body)
}

export const sendPaginated = (reply, data, total, page, limit) =>
  reply.status(200).send({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext:    page * limit < total,
      hasPrev:    page > 1
    },
    timestamp: new Date().toISOString()
  })