/**
 * Advanced BullMQ Examples
 * 
 * This file demonstrates advanced BullMQ features like:
 * - Job dependencies and flows
 * - Custom job processors
 * - Queue events and monitoring
 * - Performance optimization
 */

const { addEmailJob } = require('../jobs/emailJob');
const emailQueue = require('../queues/emailQueue');

/**
 * Example 1: Batch Job Processing
 * Process multiple emails in a single job
 */
async function addBatchEmailJob(recipients, batchSize = 10) {
  console.log(`📦 Creating batch job for ${recipients.length} recipients`);
  
  // Split recipients into batches
  const batches = [];
  for (let i = 0; i < recipients.length; i += batchSize) {
    batches.push(recipients.slice(i, i + batchSize));
  }
  
  // Create a job for each batch
  const jobs = [];
  for (let i = 0; i < batches.length; i++) {
    const job = await emailQueue.add('batchEmail', {
      batch: batches[i],
      batchNumber: i + 1,
      totalBatches: batches.length
    }, {
      priority: 5,
      attempts: 2
    });
    jobs.push(job);
  }
  
  console.log(`✅ Created ${jobs.length} batch jobs`);
  return jobs;
}

/**
 * Example 2: Job with Progress Tracking
 * Demonstrate how to track job progress
 */
async function addProgressTrackingJob(recipients) {
  const job = await emailQueue.add('progressEmail', {
    recipients,
    totalCount: recipients.length
  }, {
    attempts: 1
  });
  
  console.log(`📊 Created progress tracking job: ${job.id}`);
  return job;
}

/**
 * Example 3: Job Chaining
 * Create dependent jobs that run in sequence
 */
async function createEmailCampaign(campaignData) {
  const { name, recipients, templateId, sendTime } = campaignData;
  
  console.log(`🎯 Creating email campaign: ${name}`);
  
  // Step 1: Prepare campaign
  const prepJob = await emailQueue.add('prepareCampaign', {
    campaignName: name,
    templateId,
    recipientCount: recipients.length
  }, {
    priority: 8
  });
  
  // Step 2: Send emails (depends on preparation)
  const sendJob = await emailQueue.add('sendCampaign', {
    campaignName: name,
    recipients,
    templateId,
    prepJobId: prepJob.id
  }, {
    delay: sendTime ? new Date(sendTime) - new Date() : 0,
    priority: 7
  });
  
  // Step 3: Generate report (depends on sending)
  const reportJob = await emailQueue.add('campaignReport', {
    campaignName: name,
    sendJobId: sendJob.id
  }, {
    delay: 3600000, // 1 hour after campaign
    priority: 3
  });
  
  console.log(`✅ Campaign jobs created: prep(${prepJob.id}), send(${sendJob.id}), report(${reportJob.id})`);
  return { prepJob, sendJob, reportJob };
}

/**
 * Example 4: Queue Monitoring and Alerts
 */
async function setupQueueMonitoring() {
  console.log('🔍 Setting up queue monitoring...');
  
  // Monitor queue health every 30 seconds
  const monitoringInterval = setInterval(async () => {
    try {
      const counts = await emailQueue.getJobCounts();
      const failedCount = counts.failed || 0;
      const stalledCount = counts.stalled || 0;
      
      // Alert if too many failed jobs
      if (failedCount > 10) {
        console.log(`🚨 ALERT: ${failedCount} failed jobs in queue!`);
        // In production, send notification to ops team
      }
      
      // Alert if jobs are stalling
      if (stalledCount > 5) {
        console.log(`⚠️  WARNING: ${stalledCount} stalled jobs detected!`);
        // In production, investigate worker health
      }
      
      // Log queue health
      console.log(`📈 Queue Health - Active: ${counts.active}, Waiting: ${counts.waiting}, Failed: ${failedCount}`);
      
    } catch (error) {
      console.error('❌ Queue monitoring error:', error.message);
    }
  }, 30000);
  
  return monitoringInterval;
}

/**
 * Example 5: Queue Cleanup
 * Clean up old jobs to manage memory usage
 */
async function cleanupOldJobs() {
  console.log('🧹 Cleaning up old jobs...');
  
  try {
    // Clean completed jobs older than 24 hours
    const completedCleaned = await emailQueue.clean(24 * 60 * 60 * 1000, 'completed');
    console.log(`🗑️  Cleaned ${completedCleaned.length} completed jobs`);
    
    // Clean failed jobs older than 7 days
    const failedCleaned = await emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed');
    console.log(`🗑️  Cleaned ${failedCleaned.length} failed jobs`);
    
    // Clean active jobs older than 1 hour (likely stalled)
    const activeCleaned = await emailQueue.clean(60 * 60 * 1000, 'active');
    console.log(`🗑️  Cleaned ${activeCleaned.length} stalled active jobs`);
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  }
}

/**
 * Example 6: Performance Testing
 * Load test the queue with many jobs
 */
async function performanceTest(jobCount = 1000) {
  console.log(`⚡ Starting performance test with ${jobCount} jobs...`);
  
  const startTime = Date.now();
  const jobs = [];
  
  // Add jobs in batches to avoid overwhelming Redis
  const batchSize = 100;
  for (let i = 0; i < jobCount; i += batchSize) {
    const batch = [];
    
    for (let j = i; j < Math.min(i + batchSize, jobCount); j++) {
      batch.push(addEmailJob(`test${j}@example.com`, 0));
    }
    
    const batchJobs = await Promise.all(batch);
    jobs.push(...batchJobs);
    
    console.log(`📦 Added batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(jobCount / batchSize)}`);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log(`✅ Performance test completed:`);
  console.log(`  📊 Jobs added: ${jobs.length}`);
  console.log(`  ⏱️  Duration: ${duration}ms`);
  console.log(`  🚀 Rate: ${Math.round(jobs.length / (duration / 1000))} jobs/second`);
  
  return { jobs, duration, rate: jobs.length / (duration / 1000) };
}

module.exports = {
  addBatchEmailJob,
  addProgressTrackingJob,
  createEmailCampaign,
  setupQueueMonitoring,
  cleanupOldJobs,
  performanceTest
};
