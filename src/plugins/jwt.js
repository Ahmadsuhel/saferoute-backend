import fp  from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { ENV } from '../config/env.js'

async function jwtPlugin(fastify) {
  await fastify.register(jwt, {
    secret: ENV.JWT_SECRET
  })
}

export default fp(jwtPlugin)