/**
 * Bull Board Dashboard Configuration
 * 
 * Bull Board provides a web UI to monitor and manage BullMQ queues.
 * It shows job statuses, allows manual retries, and provides queue statistics.
 */

const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');

// Import all queues you want to monitor
const emailQueue = require('./queues/emailQueue');
// Add more queues here as you create them:
// const imageQueue = require('./queues/imageQueue');
// const reportQueue = require('./queues/reportQueue');

// Create Express adapter for the dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

// Create the Bull Board with all your queues
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullMQAdapter(emailQueue),
    // Add more queue adapters here:
    // new BullMQAdapter(imageQueue),
    // new BullMQAdapter(reportQueue),
  ],
  serverAdapter: serverAdapter,
});

console.log('📊 Bull Board dashboard configured');
console.log('📈 Monitoring queues:');
console.log('  - emailQueue');

// Export the server adapter and utilities
module.exports = {
  serverAdapter,
  addQueue,
  removeQueue,
  setQueues,
  replaceQueues
};

/**
 * Dashboard Features:
 * 
 * 🎯 Queue Overview:
 *   - Active, waiting, completed, failed job counts
 *   - Real-time updates
 * 
 * 🔍 Job Details:
 *   - View job data and options
 *   - See job progress and logs
 *   - Check retry attempts and error messages
 * 
 * 🎛️ Management Actions:
 *   - Retry failed jobs
 *   - Delete jobs
 *   - Clean up old jobs
 *   - Pause/resume queues
 * 
 * 📊 Statistics:
 *   - Processing rates
 *   - Success/failure ratios
 *   - Queue health metrics
 * 
 * Access the dashboard at: http://localhost:3000/admin/queues
 */
