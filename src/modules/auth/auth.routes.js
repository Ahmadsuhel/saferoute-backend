import { authenticate }    from '../../middleware/authenticate.js'
import * as controller     from './auth.controller.js'
import {
  registerSchema, loginSchema, forgotPasswordSchema,
  changePasswordSchema,
   resetPasswordSchema, refreshSchema,
  logoutSchema, getMeSchema
} from './auth.schema.js'

export default async function authRoutes(fastify) {
  fastify.post('/register',       { schema: registerSchema       }, controller.register)
  fastify.post('/login',          { schema: loginSchema          }, controller.login)
  fastify.post('/forgot-password',{ schema: forgotPasswordSchema }, controller.forgotPassword)
  // fastify.post('/verify-otp',     { schema: verifyOtpSchema      }, controller.verifyOtp)
  fastify.post('/reset-password', { schema: resetPasswordSchema  }, controller.resetPassword)
  fastify.post('/refresh',        { schema: refreshSchema        }, controller.refresh)
   // ── Google OAuth ──────────────────────────────
  fastify.get('/google', {
    schema: {
      tags:    ['Auth'],
      summary: 'Login with Google',
    }
  }, async (request, reply) => {
    const uri = fastify.googleOAuth2.generateAuthorizationUri(request, reply)
    return reply.redirect(uri)
  })

  fastify.get('/google/callback', {
    schema: {
      tags:    ['Auth'],
      summary: 'Google OAuth callback',
    }
  }, controller.googleCallback)
  fastify.post('/logout',         { schema: logoutSchema, preHandler: [authenticate] }, controller.logout)
  fastify.get('/me',              { schema: getMeSchema,  preHandler: [authenticate] }, controller.getMe)
   fastify.post('/change-password', {
    schema:     changePasswordSchema,
    preHandler: [authenticate]
  }, controller.changePassword)

}