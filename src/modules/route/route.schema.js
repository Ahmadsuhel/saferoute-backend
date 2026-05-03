export const calculateRouteSchema = {
  tags:        ['Routes'],
  summary:     'Calculate safe route',
  description: 'Source aur destination se safest route calculate karo with AI safety score',
  security:    [{ BearerAuth: [] }],
  body: {
    type: 'object',
    required: ['sourceLat', 'sourceLng', 'destLat', 'destLng'],
    properties: {
      sourceLat:  { type: 'number' },
      sourceLng:  { type: 'number' },
      sourceAddr: { type: 'string' },
      destLat:    { type: 'number' },
      destLng:    { type: 'number' },
      destAddr:   { type: 'string' },
      city:       { type: 'string' },
    }
  }
}

export const getRouteHistorySchema = {
  tags:     ['Routes'],
  summary:  'Get route history',
  security: [{ BearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page:  { type: 'number' },
      limit: { type: 'number' },
    }
  }
}

export const getRouteByIdSchema = {
  tags:    ['Routes'],
  summary: 'Get route by ID',
  security: [{ BearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
}