import { Redis } from '@upstash/redis'

// Check for required environment variables
if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined')
}

if (!process.env.REDIS_TOKEN) {
  throw new Error('REDIS_TOKEN is not defined')
}

// Create Redis client
export const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
}) 