import { sendSuccess, sendError } from '../../utils/response.js'
import * as AuthService           from './auth.service.js'
import { blacklistToken }         from '../../utils/tokenBlacklist.js'
import { logger }                 from '../../utils/logger.js'
import { ENV }                    from '../../config/env.js'

// Helper
function extractToken(request) {
  const authHeader = request.headers['authorization']
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return null
}

export async function register(request, reply) {
  try {
    const data = await AuthService.registerUser(request.server, request.body)
    return sendSuccess(reply, data, 'Registration successful', 201)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function login(request, reply) {
  try {
    const data = await AuthService.loginUser(request.server, request.body)
    return sendSuccess(reply, data, 'Login successful')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function forgotPassword(request, reply) {
  try {
    const data = await AuthService.forgotPassword(request.body.email)
    return sendSuccess(reply, null, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function resetPassword(request, reply) {
  try {
    const { email, otp, newPassword } = request.body
    const data = await AuthService.resetPassword(email, otp, newPassword)
    return sendSuccess(reply, null, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function changePassword(request, reply) {
  try {
    const { oldPassword, newPassword } = request.body
    const data = await AuthService.changePassword(
      request.user.id,
      oldPassword,
      newPassword
    )
    const token = extractToken(request)
    if (token) await blacklistToken(token)
    return sendSuccess(reply, null, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function refresh(request, reply) {
  try {
    const token = extractToken(request)
    if (token) await blacklistToken(token)
    const data = await AuthService.refreshAccessToken(
      request.server,
      request.body.refreshToken
    )
    return sendSuccess(reply, data, 'Token refreshed')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function logout(request, reply) {
  try {
    const token = extractToken(request)
    if (token) await blacklistToken(token)
    const data = await AuthService.logoutUser(request.body.refreshToken)
    return sendSuccess(reply, null, data.message)
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function getMe(request, reply) {
  try {
    const user = await AuthService.getMe(request.user.id)
    return sendSuccess(reply, user, 'Profile fetched')
  } catch (err) {
    return sendError(reply, err.message, err.statusCode || 500)
  }
}

export async function googleCallback(request, reply) {
  try {
    const tokenData = await request.server.googleOAuth2
      .getAccessTokenFromAuthorizationCodeFlow(request)

    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.token.access_token}` }
    })

    const googleUser = await response.json()
    const data = await AuthService.googleAuth(request.server, googleUser)

    const redirectUrl = `${ENV.FRONTEND_URL}/auth/google/callback?accessToken=${data.accessToken}&refreshToken=${data.refreshToken}`
    return reply.redirect(redirectUrl)

  } catch (err) {
    logger.error('Google OAuth error', { error: err.message })
    const redirectUrl = `${ENV.FRONTEND_URL}/auth/google/callback?error=${encodeURIComponent(err.message)}`
    return reply.redirect(redirectUrl)
  }
}