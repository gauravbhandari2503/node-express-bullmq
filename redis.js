/**
 * Redis Connection Configuration
 * 
 * BullMQ uses Redis to store job data and queue state.
 * This configuration is shared across all queues and workers.
 */

const { Redis } = require('ioredis');

// Basic connection configuration
const connection = {
  host: '127.0.0.1',
  port: 6379,
  db: 0,  // Redis database number (0-15)
  
  // Connection retry settings
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Alternative: Create a full Redis instance with more options
const redisInstance = new Redis({
  ...connection,
  
  // Retry strategy
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`🔄 Redis connection retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  
  // Connection event handlers
  lazyConnect: true,  // Don't connect until first command
});

// Redis event listeners for monitoring
redisInstance.on('connect', () => {
  console.log('📶 Connected to Redis');
});

redisInstance.on('ready', () => {
  console.log('✅ Redis is ready');
});

redisInstance.on('error', (error) => {
  console.error('❌ Redis connection error:', error.message);
});

redisInstance.on('close', () => {
  console.log('🔌 Redis connection closed');
});

// Export both the basic connection config and the Redis instance
module.exports = { 
  connection,
  redisInstance 
};

// Test Redis connection on startup
const testRedisConnection = async () => {
  try {
    await redisInstance.ping();
    console.log('🏓 Redis ping successful');
  } catch (error) {
    console.error('💥 Redis connection test failed:', error.message);
    console.log('💡 Make sure Redis is running:');
    console.log('   - Ubuntu/Debian: sudo systemctl start redis');
    console.log('   - Docker: docker run -d -p 6379:6379 redis');
    console.log('   - macOS: brew services start redis');
  }
};

// Run connection test
testRedisConnection();
