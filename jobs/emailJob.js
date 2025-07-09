const emailQueue = require('../queues/emailQueue');

/**
 * Creates and adds an email job to the queue
 * 
 * @param {string} to - Email recipient
 * @param {number} delay - Delay in milliseconds before processing (default: 0)
 * @param {object} repeat - Repeat configuration for recurring jobs
 * 
 * Job Options Explained:
 * - delay: How long to wait before processing (useful for scheduling)
 * - attempts: How many times to retry if the job fails
 * - backoff: Strategy for waiting between retries
 * - priority: Higher numbers get processed first
 * - repeat: For recurring jobs (cron syntax)
 */
const addEmailJob = async (to, delay = 0, repeat = null) => {
  const jobOptions = {
    // Wait before processing (milliseconds)
    delay, 
    
    // Retry failed jobs up to 3 times
    attempts: 3,
    
    // Exponential backoff: 2s, 4s, 8s between retries
    backoff: { 
      type: 'exponential', 
      delay: 2000 
    },
    
    // Job priority (higher = more important)
    priority: 1,
    
    // For recurring jobs: { cron: '*/5 * * * *' }
    repeat,
    
    // Optional: Remove completed jobs after 10 successful completions
    removeOnComplete: 10,
    
    // Optional: Keep only 5 failed jobs for debugging
    removeOnFail: 5
  };

  // Add the job to the queue
  const job = await emailQueue.add('sendEmail', { to }, jobOptions);
  
  console.log(`📨 Email job added: ${job.id} for ${to}`);
  if (delay > 0) {
    console.log(`⏰ Job will be processed in ${delay/1000} seconds`);
  }
  if (repeat) {
    console.log(`🔄 Recurring job scheduled with cron: ${repeat.cron}`);
  }
  
  return job;
};

/**
 * Add a high-priority urgent email job
 */
const addUrgentEmailJob = async (to) => {
  return await emailQueue.add('sendEmail', { to, urgent: true }, {
    priority: 10, // High priority
    attempts: 5,  // More retry attempts for important emails
    delay: 0      // Process immediately
  });
};

/**
 * Schedule an email for a specific time
 */
const scheduleEmailAt = async (to, scheduleTime) => {
  const delay = new Date(scheduleTime) - new Date();
  
  if (delay <= 0) {
    throw new Error('Schedule time must be in the future');
  }
  
  return await addEmailJob(to, delay);
};

module.exports = { 
  addEmailJob, 
  addUrgentEmailJob, 
  scheduleEmailAt 
};
