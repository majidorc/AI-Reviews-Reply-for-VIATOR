/**
 * Shared Redis client using Upstash REST API.
 * Requires env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 * (Get these from https://console.upstash.com → your database → REST API)
 */
const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = { redis };
