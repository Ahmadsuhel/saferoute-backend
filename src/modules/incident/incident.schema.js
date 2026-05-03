export const reportIncidentSchema = {
  tags:        ['Incidents'],
  summary:     'Report an incident',
  description: 'User koi bhi incident report kar sakta hai — anonymous bhi',
  security:    [{ BearerAuth: [] }],
  body: {
    type: 'object',
    required: ['type', 'latitude', 'longitude', 'city'],
    properties: {
      type: {
        type: 'string',
        enum: ['ROBBERY','HARASSMENT','VIOLENCE','STREET_FIGHT','PROTEST',
               'ACCIDENT','SUSPICIOUS','ROAD_BLOCKED','UNSAFE_LIGHTING','OTHER'],
      },
      description: { type: 'string' },
      latitude:    { type: 'number' },
      longitude:   { type: 'number' },
      address:     { type: 'string' },
      city:        { type: 'string' },
      isAnonymous: { type: 'boolean' },
    }
  }
}

export const nearbyIncidentsSchema = {
  tags:        ['Incidents'],
  summary:     'Get nearby incidents',
  description: 'Latitude, longitude aur radius se nearby incidents fetch karo',
  querystring: {
    type: 'object',
    required: ['lat', 'lng'],
    properties: {
      lat:    { type: 'number' },
      lng:    { type: 'number' },
      radius: { type: 'number' },
      type:   { type: 'string' },
      limit:  { type: 'number' },
    }
  }
}

export const voteIncidentSchema = {
  tags:     ['Incidents'],
  summary:  'Vote on incident — upvote, downvote or flag',
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
    required: ['voteType'],
    properties: {
      voteType: {
        type: 'string',
        enum: ['UPVOTE', 'DOWNVOTE', 'FLAG'],
      }
    }
  }
}

export const getMyIncidentsSchema = {
  tags:     ['Incidents'],
  summary:  'Get my reported incidents',
  security: [{ BearerAuth: [] }],
  querystring: {
    type: 'object',
    properties: {
      page:  { type: 'number' },
      limit: { type: 'number' },
    }
  }
}

export const getIncidentByIdSchema = {
  tags:    ['Incidents'],
  summary: 'Get incident by ID',
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
}

export const deleteIncidentSchema = {
  tags:     ['Incidents'],
  summary:  'Delete my incident report',
  security: [{ BearerAuth: [] }],
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' }
    }
  }
}