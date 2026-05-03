import { ENV } from './env.js'

export const swaggerConfig = {
  swagger: {
    info: {
      title:       ENV.APP_NAME,
      description: 'AI-powered urban safety routing API',
      version:     ENV.APP_VERSION,
    },
    host:     `localhost:${ENV.PORT}`,
    basePath: ENV.API_PREFIX,
    schemes:  ['http', 'https'],
    consumes: ['application/json'],
    produces: ['application/json'],
    securityDefinitions: {
      BearerAuth: {
        type:        'apiKey',
        name:        'Authorization',
        in:          'header',
        description: 'Enter: Bearer <your_jwt_token>'
      }
    },
    tags: [
      { name: 'Health', description: 'Server health check' },
      { name: 'Auth',   description: 'Register, Login, Forgot Password' },
    ]
  }
}

export const swaggerUiConfig = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion:    'list',
    deepLinking:     true,
    tryItOutEnabled: true
  }
}