/**
 * Email Worker - Job Processor
 * 
 * This worker processes email jobs from the emailQueue.
 * Workers are separate processes that consume jobs and execute the actual work.
 */

const { Worker } = require('bullmq');
const { connection } = require('../redis');

/**
 * Job processor function
 * This function is called for each job that needs to be processed
 */
const processEmailJob = async (job) => {
  const { to, urgent } = job.data;
  
  console.log(`\n🔄 Processing job: ${job.id}`);
  console.log(`📧 Job type: ${job.name}`);
  console.log(`📨 Sending email to: ${to}`);
  console.log(`⚡ Urgent: ${urgent ? 'Yes' : '  No'}`);
  console.log(`🔢 Attempt: ${job.attemptsMade + 1}/${job.opts.attempts}`);
  
  // Simulate processing time
  const processingTime = urgent ? 500 : 1000;
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Simulate occasional failures for demonstration
  // In real world, this could be network errors, API failures, etc.
  if (Math.random() < 0.2) { // 20% failure rate
    throw new Error('Simulated email service failure');
  }
  
  // Simulate different email types
  switch (job.name) {
    case 'sendEmail':
      console.log(`✅ Email sent successfully to ${to}`);
      break;
    default:
      console.log(`✅ Unknown job type processed: ${job.name}`);
  }
  
  // Return some result data (optional)
  return { 
    sentAt: new Date().toISOString(),
    recipient: to,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
};

/**
 * Create the worker
 * 
 * Worker Options:
 * - connection: Redis connection (must match queue connection)
 * - concurrency: How many jobs to process simultaneously
 * - limiter: Rate limiting options
 */
const worker = new Worker('emailQueue', processEmailJob, {
  connection,
  
  // Process up to 5 jobs simultaneously
  concurrency: 5,
  
  // Rate limiting: max 100 jobs per minute
  limiter: {
    max: 100,
    duration: 60 * 1000, // 60 seconds
  },
  
  // Worker settings
  settings: {
    stalledInterval: 30 * 1000,    // Check for stalled jobs every 30s
    maxStalledCount: 3,            // Max times a job can be stalled
  }
});

/**
 * Event Listeners
 * These help you monitor and debug your job processing
 */

// Job completed successfully
worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed successfully`);
  console.log(`📋 Result:`, result);
});

// Job failed (after all retry attempts)
worker.on('failed', (job, err) => {
  console.log(`❌ Job ${job.id} failed permanently:`, err.message);
  console.log(`🔄 Total attempts made: ${job.attemptsMade}`);
});

// Job is being processed
worker.on('active', (job) => {
  console.log(`⚡ Job ${job.id} started processing`);
});

// Job is stalled (worker didn't respond in time)
worker.on('stalled', (jobId) => {
  console.log(`😵 Job ${jobId} stalled`);
});

// Worker error (not job-specific)
worker.on('error', (error) => {
  console.error('💥 Worker error:', error);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await worker.close();
  console.log('👋 Worker closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await worker.close();
  console.log('👋 Worker closed');
  process.exit(0);
});

console.log('👷 Email worker started and ready to process jobs');
console.log(`📊 Concurrency: ${worker.opts.concurrency}`);
console.log(`⚡ Rate limit: ${worker.opts.limiter.max} jobs per minute`);

module.exports = worker;
