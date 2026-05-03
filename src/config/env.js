import dotenv from 'dotenv'
dotenv.config()

function requireEnv(key) {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required env variable: ${key}`)
  return value
}

export const ENV = {
  PORT:       parseInt(process.env.PORT || '3000'),
  NODE_ENV:   process.env.NODE_ENV || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  IS_DEV:     process.env.NODE_ENV !== 'production',

  DATABASE_URL:           requireEnv('DATABASE_URL'),
  JWT_SECRET:             requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET:     requireEnv('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN:         process.env.JWT_EXPIRES_IN         || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  SALT_ROUNDS:            parseInt(process.env.SALT_ROUNDS   || '10'),


  GOOGLE_CLIENT_ID:     requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  GOOGLE_CALLBACK_URL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/v1/auth/google/callback',
  FRONTEND_URL:         process.env.FRONTEND_URL        || 'http://localhost:4200',

  APP_NAME:    process.env.APP_NAME    || 'SafeRoute API',
  APP_VERSION: process.env.APP_VERSION || '1.0.0',
}