import fp          from 'fastify-plugin'
import oauthPlugin from '@fastify/oauth2'
import { ENV }     from '../config/env.js'

async function googleOAuthPlugin(fastify) {
  await fastify.register(oauthPlugin, {
    name:        'googleOAuth2',
    scope:       ['profile', 'email'],
    credentials: {
      client: {
        id:     ENV.GOOGLE_CLIENT_ID,
        secret: ENV.GOOGLE_CLIENT_SECRET,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    // startRedirectPath hata diya — routes file mein manually handle karenge
    callbackUri: ENV.GOOGLE_CALLBACK_URL,
  })
}

export default fp(googleOAuthPlugin)