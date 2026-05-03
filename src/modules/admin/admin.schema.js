export const getDashboardSchema = {
  tags:     ['Admin'],
  summary:  'Admin dashboard stats',
  security: [{ BearerAuth: [] }],
}

export const getHeatmapSchema = {
  tags:     ['Admin'],
  summary:  'City risk heatmap data',
  security: [{ BearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      time: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'night', 'all'] },
    }
  }
}

export const getPendingIncidentsSchema = {
  tags:     ['Admin'],
  summary:  'Get pending incidents for moderation',
  security: [{ BearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page:  { type: 'number' },
      limit: { type: 'number' },
      type:  { type: 'string' },
    }
  }
}

export const moderateIncidentSchema = {
  tags:     ['Admin'],
  summary:  'Approve or reject incident report',
  security: [{ BearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['APPROVE', 'REJECT']
      },
      reason: { type: 'string' }
    }
  }
}

export const getAnalyticsSchema = {
  tags:     ['Admin'],
  summary:  'Incident analytics and trends',
  security: [{ BearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      city: { type: 'string' },
      days: { type: 'number' },
    }
  }
}

export const getAllUsersSchema = {
  tags:     ['Admin'],
  summary:  'Get all users',
  security: [{ BearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page:   { type: 'number' },
      limit:  { type: 'number' },
      search: { type: 'string' },
    }
  }
}

export const banUserSchema = {
  tags:     ['Admin'],
  summary:  'Ban or unban a user',
  security: [{ BearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  },
  body: {
    type: 'object',
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['BAN', 'UNBAN']
      }
    }
  }
}