/**
 * Email Queue Definition
 * 
 * This file creates a BullMQ queue for handling email-related jobs.
 * The queue acts as a buffer between job producers (API endpoints)
 * and job consumers (workers).
 */

const { Queue } = require('bullmq');
const { connection } = require('../redis');

/**
 * Create the email queue
 * 
 * Queue Options:
 * - connection: Redis connection configuration
 * - defaultJobOptions: Default settings for all jobs in this queue
 */
const emailQueue = new Queue('emailQueue', { 
  connection,
  
  // Default options for all jobs added to this queue
  defaultJobOptions: {
    removeOnComplete: 50,  // Keep only 50 completed jobs in memory
    removeOnFail: 20,      // Keep only 20 failed jobs for debugging
    
    // Default retry configuration
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
});

// Event listeners for queue-level events
emailQueue.on('error', (error) => {
  console.error('❌ Queue error:', error);
});

emailQueue.on('waiting', (job) => {
  console.log(`⏳ Job ${job.id} is waiting in queue`);
});

console.log('📬 Email queue initialized');

module.exports = emailQueue;
