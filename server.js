/**
 * BullMQ Demo Server
 * 
 * This Express server demonstrates how to:
 * 1. Add jobs to queues via HTTP endpoints
 * 2. Handle different types of jobs (immediate, delayed, recurring)
 * 3. Monitor jobs using Bull Board dashboard
 */

const express = require('express');
const { addEmailJob, addUrgentEmailJob, scheduleEmailAt } = require('./jobs/emailJob');
const { 
  addBatchEmailJob, 
  addProgressTrackingJob, 
  createEmailCampaign,
  cleanupOldJobs 
} = require('./examples/advanced-examples');
const emailQueue = require('./queues/emailQueue');

const app = express();
const PORT = 3000;

// Bull Board Dashboard for monitoring queues
const { serverAdapter } = require('./dashboard');
app.use('/admin/queues', serverAdapter.getRouter());

// Middleware
app.use(express.json());

// Routes

/**
 * GET / - Basic info about the API
 */
app.get('/', (req, res) => {
  res.json({
    message: 'BullMQ Demo API',
    endpoints: {
      'POST /send-email': 'Add an email job (with optional delay)',
      'POST /send-urgent': 'Add a high-priority email job',
      'POST /send-recurring': 'Add a recurring email job',
      'POST /schedule-email': 'Schedule an email for a specific time',
      'POST /send-batch': 'Send emails to multiple recipients in batches',
      'POST /send-with-progress': 'Send emails with progress tracking',
      'POST /create-campaign': 'Create an email campaign with multiple steps',
      'GET /admin/queues': 'View the BullMQ dashboard'
    },
    dashboard: `http://localhost:${PORT}/admin/queues`
  });
});

/**
 * POST /send-email
 * Add a regular email job with optional delay
 * 
 * Body: { "to": "user@example.com", "delay": 5000 }
 */
app.post('/send-email', async (req, res) => {
  try {
    const { to, delay } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email recipient "to" is required' });
    }
    
    const job = await addEmailJob(to, delay || 0);
    
    res.json({
      message: `Email job added for ${to}`,
      jobId: job.id,
      delay: delay || 0,
      willProcessAt: delay ? new Date(Date.now() + delay).toISOString() : 'immediately'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /send-urgent
 * Add a high-priority email job
 * 
 * Body: { "to": "important@example.com" }
 */
app.post('/send-urgent', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email recipient "to" is required' });
    }
    
    const job = await addUrgentEmailJob(to);
    
    res.json({
      message: `Urgent email job added for ${to}`,
      jobId: job.id,
      priority: job.opts.priority
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /send-recurring
 * Add a recurring email job
 * 
 * Body: { "cron": "asterisk/2 asterisk asterisk asterisk asterisk" } (optional, defaults to every minute)
 */
app.post('/send-recurring', async (req, res) => {
  try {
    const { cron } = req.body;
    const cronPattern = cron || '*/1 * * * *'; // Default: every minute
    
    const job = await addEmailJob('recurring@example.com', 0, { 
      cron: cronPattern 
    });
    
    res.json({
      message: 'Recurring job added',
      jobId: job.id,
      cron: cronPattern,
      nextRun: 'Check dashboard for next execution time'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /schedule-email
 * Schedule an email for a specific time
 * 
 * Body: { "to": "user@example.com", "scheduleTime": "2024-12-25T09:00:00.000Z" }
 */
app.post('/schedule-email', async (req, res) => {
  try {
    const { to, scheduleTime } = req.body;
    
    if (!to || !scheduleTime) {
      return res.status(400).json({ 
        error: 'Both "to" and "scheduleTime" are required' 
      });
    }
    
    const job = await scheduleEmailAt(to, scheduleTime);
    
    res.json({
      message: `Email scheduled for ${to}`,
      jobId: job.id,
      scheduledFor: scheduleTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /send-batch
 * Send emails to multiple recipients in batches
 * 
 * Body: { "recipients": ["user1@example.com", "user2@example.com"], "batchSize": 10 }
 */
app.post('/send-batch', async (req, res) => {
  try {
    const { recipients, batchSize } = req.body;
    
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }
    
    const jobs = await addBatchEmailJob(recipients, batchSize || 10);
    
    res.json({
      message: `Batch email jobs created for ${recipients.length} recipients`,
      totalJobs: jobs.length,
      batchSize: batchSize || 10,
      jobIds: jobs.map(job => job.id)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /send-with-progress
 * Send emails with progress tracking
 * 
 * Body: { "recipients": ["user1@example.com", "user2@example.com"] }
 */
app.post('/send-with-progress', async (req, res) => {
  try {
    const { recipients } = req.body;
    
    if (!recipients || !Array.isArray(recipients)) {
      return res.status(400).json({ error: 'Recipients array is required' });
    }
    
    const job = await addProgressTrackingJob(recipients);
    
    res.json({
      message: `Progress tracking job created for ${recipients.length} recipients`,
      jobId: job.id,
      totalRecipients: recipients.length,
      trackProgress: `Check dashboard or GET /job/${job.id}/progress`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /create-campaign
 * Create an email campaign with multiple steps
 * 
 * Body: { 
 *   "name": "Weekly Newsletter", 
 *   "recipients": ["user1@example.com"], 
 *   "templateId": "newsletter_v1",
 *   "sendTime": "2025-07-08T14:00:00.000Z"
 * }
 */
app.post('/create-campaign', async (req, res) => {
  try {
    const { name, recipients, templateId, sendTime } = req.body;
    
    if (!name || !recipients || !templateId) {
      return res.status(400).json({ 
        error: 'Campaign name, recipients, and templateId are required' 
      });
    }
    
    const { prepJob, sendJob, reportJob } = await createEmailCampaign({
      name,
      recipients,
      templateId,
      sendTime
    });
    
    res.json({
      message: `Email campaign "${name}" created successfully`,
      campaign: {
        name,
        totalRecipients: recipients.length,
        templateId,
        sendTime: sendTime || 'immediate'
      },
      jobs: {
        preparation: prepJob.id,
        sending: sendJob.id,
        reporting: reportJob.id
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /job/:id
 * Get job details and status
 */
app.get('/job/:id', async (req, res) => {
  try {
    const job = await emailQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const state = await job.getState();
    
    res.json({
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress: job.progress,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts,
      createdAt: new Date(job.timestamp).toISOString(),
      processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
      finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
      failedReason: job.failedReason,
      returnValue: job.returnvalue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /job/:id/progress
 * Get job progress
 */
app.get('/job/:id/progress', async (req, res) => {
  try {
    const job = await emailQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const state = await job.getState();
    
    res.json({
      id: job.id,
      state,
      progress: job.progress || 0,
      progressData: job.progress ? `${job.progress}%` : 'Not started'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /queue/stats
 * Get queue statistics
 */
app.get('/queue/stats', async (req, res) => {
  try {
    const counts = await emailQueue.getJobCounts();
    const waiting = await emailQueue.getWaiting();
    const active = await emailQueue.getActive();
    const completed = await emailQueue.getCompleted(0, 4); // Last 5
    const failed = await emailQueue.getFailed(0, 4); // Last 5
    
    res.json({
      counts,
      recentJobs: {
        waiting: waiting.slice(0, 5).map(job => ({
          id: job.id,
          name: job.name,
          data: job.data
        })),
        active: active.slice(0, 5).map(job => ({
          id: job.id,
          name: job.name,
          progress: job.progress
        })),
        completed: completed.map(job => ({
          id: job.id,
          name: job.name,
          finishedOn: job.finishedOn
        })),
        failed: failed.map(job => ({
          id: job.id,
          name: job.name,
          failedReason: job.failedReason
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /queue/cleanup
 * Clean up old completed and failed jobs
 */
app.post('/queue/cleanup', async (req, res) => {
  try {
    await cleanupOldJobs();
    
    const newCounts = await emailQueue.getJobCounts();
    
    res.json({
      message: 'Queue cleanup completed',
      newCounts
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /job/:id/retry
 * Retry a failed job
 */
app.post('/job/:id/retry', async (req, res) => {
  try {
    const job = await emailQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    await job.retry();
    
    res.json({
      message: `Job ${job.id} queued for retry`,
      jobId: job.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 BullMQ Demo Server Started!');
  console.log(`📡 API Server: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/admin/queues`);
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /                 - API info');
  console.log('  POST /send-email       - Add email job');
  console.log('  POST /send-urgent      - Add urgent email job');
  console.log('  POST /send-recurring   - Add recurring job');
  console.log('  POST /schedule-email   - Schedule email');
  console.log('  POST /send-batch       - Send batch email');
  console.log('  POST /send-with-progress - Send email with progress tracking');
  console.log('  POST /create-campaign  - Create email campaign');
  console.log('\n💡 Try these curl commands:');
  console.log(`  curl -X POST http://localhost:${PORT}/send-email -H "Content-Type: application/json" -d '{"to":"test@example.com"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/send-email -H "Content-Type: application/json" -d '{"to":"delayed@example.com","delay":10000}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/send-urgent -H "Content-Type: application/json" -d '{"to":"urgent@example.com"}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/send-recurring`);
  console.log(`  curl -X POST http://localhost:${PORT}/send-batch -H "Content-Type: application/json" -d '{"recipients":["user1@example.com","user2@example.com"]}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/send-with-progress -H "Content-Type: application/json" -d '{"recipients":["user1@example.com","user2@example.com"]}'`);
  console.log(`  curl -X POST http://localhost:${PORT}/create-campaign -H "Content-Type: application/json" -d '{"name":"Test Campaign","recipients":["user1@example.com"],"templateId":"template1"}'`);
});

// Start the email worker
require('./workers/emailWorker'); // This starts the worker process
