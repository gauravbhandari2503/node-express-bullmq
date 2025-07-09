/**
 * Example: Multiple Queue Types
 * 
 * This file demonstrates how to create and manage multiple types of queues
 * for different purposes in your application.
 */

const { Queue } = require('bullmq');
const { connection } = require('../redis');

// Email queue for sending emails
const emailQueue = require('./emailQueue');

// Image processing queue for resizing, compression, etc.
const imageQueue = new Queue('imageQueue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  }
});

// Report generation queue for heavy processing
const reportQueue = new Queue('reportQueue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 5,
    removeOnFail: 5,
    attempts: 1, // Reports are expensive to generate, don't retry
    priority: 5, // Medium priority
  }
});

// Notification queue for push notifications, SMS, etc.
const notificationQueue = new Queue('notificationQueue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 5, // Notifications are important
    backoff: {
      type: 'fixed',
      delay: 5000,
    },
  }
});

module.exports = {
  emailQueue,
  imageQueue,
  reportQueue,
  notificationQueue
};
