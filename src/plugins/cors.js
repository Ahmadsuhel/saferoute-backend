import fp   from 'fastify-plugin'
import cors from '@fastify/cors'
import { ENV } from '../config/env.js'

async function corsPlugin(fastify) {
  await fastify.register(cors, {
    origin:      ENV.IS_DEV ? true : ['https://saferoute.in'],
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true
  })
}

export default fp(corsPlugin)