/**
 * Redis Client Configuration.
 * Supports Upstash Redis REST API (@upstash/redis) and standard Redis TCP (ioredis).
 */

let client = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const { Redis: UpstashRedis } = require('@upstash/redis');
  
  const upstash = new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  console.log('⚡ Using Upstash Redis REST client');

  // Compatibility wrapper to provide a unified API matching standard Redis / ioredis calls
  client = {
    isUpstash: true,
    rawClient: upstash,

    get: async (key) => {
      try {
        return await upstash.get(key);
      } catch (err) {
        console.error('Upstash Redis GET error:', err.message);
        throw err;
      }
    },

    del: async (key) => {
      try {
        return await upstash.del(key);
      } catch (err) {
        console.error('Upstash Redis DEL error:', err.message);
        throw err;
      }
    },

    expire: async (key, seconds) => {
      try {
        return await upstash.expire(key, seconds);
      } catch (err) {
        console.error('Upstash Redis EXPIRE error:', err.message);
        throw err;
      }
    },

    set: async (key, value, ...args) => {
      try {
        let opts = {};
        if (args[0] === 'EX' && args[1]) {
          opts.ex = Number(args[1]);
        } else if (typeof args[0] === 'object' && args[0] !== null) {
          opts = args[0];
        }
        return await upstash.set(key, value, opts);
      } catch (err) {
        if (err.message && err.message.includes('NOPERM')) {
          console.error('\n⚠️  UPSTASH REDIS PERMISSION ERROR: The token provided is a Read-Only token.');
          console.error('   Please provide the Primary (Read-Write) Token from your Upstash console.\n');
        } else {
          console.error('Upstash Redis SET error:', err.message);
        }
        throw err;
      }
    },

    hset: async (key, field, value) => {
      try {
        if (typeof field === 'string' && value !== undefined) {
          return await upstash.hset(key, { [field]: value });
        }
        return await upstash.hset(key, field);
      } catch (err) {
        if (err.message && err.message.includes('NOPERM')) {
          console.error('\n⚠️  UPSTASH REDIS PERMISSION ERROR: The token provided is a Read-Only token.');
          console.error('   Please provide the Primary (Read-Write) Token from your Upstash console.\n');
        } else {
          console.error('Upstash Redis HSET error:', err.message);
        }
        throw err;
      }
    },

    hdel: async (key, field) => {
      try {
        return await upstash.hdel(key, field);
      } catch (err) {
        console.error('Upstash Redis HDEL error:', err.message);
        throw err;
      }
    },

    hgetall: async (key) => {
      try {
        return await upstash.hgetall(key);
      } catch (err) {
        console.error('Upstash Redis HGETALL error:', err.message);
        throw err;
      }
    },

    on: () => {}, // No-op for EventEmitter compatibility
  };
} else {
  const Redis = require('ioredis');
  client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  client.on('connect', () => console.log('Redis connected'));
  client.on('error', (err) => console.error('Redis error:', err.message));
}

module.exports = client;
