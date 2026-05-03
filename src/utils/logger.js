import { ENV } from '../config/env.js'

function format(level, message, meta = {}) {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    level, message,
    service: 'saferoute-api',
    ...meta
  })
}

export const logger = {
  debug: (msg, meta) => { if (ENV.IS_DEV) console.debug(format('debug', msg, meta)) },
  info:  (msg, meta) => console.log(format('info',  msg, meta)),
  warn:  (msg, meta) => console.warn(format('warn',  msg, meta)),
  error: (msg, meta) => console.error(format('error', msg, meta)),
}