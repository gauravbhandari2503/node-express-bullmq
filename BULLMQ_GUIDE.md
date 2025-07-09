# BullMQ Complete Learning Guide

## 🎯 What is BullMQ?

BullMQ is a powerful **job queue** library for Node.js that uses Redis for persistence. It's perfect for handling background tasks, scheduling jobs, and processing work asynchronously.

### Why Use Job Queues?

- **Background Processing**: Handle time-consuming tasks without blocking web requests
- **Reliability**: Jobs are persisted in Redis and won't be lost if your app crashes
- **Scalability**: Distribute work across multiple worker processes
- **Scheduling**: Delay jobs or run them on a schedule
- **Retry Logic**: Automatically retry failed jobs with backoff strategies

---

## 🏗️ Project Architecture

Our project demonstrates all key BullMQ concepts:

```
📁 node-express-bullmq/
├── 📄 server.js          # Express API to add jobs
├── 📄 redis.js           # Redis connection configuration
├── 📄 dashboard.js       # Bull Board UI for monitoring
├── 📁 jobs/
│   └── 📄 emailJob.js    # Job creation functions
├── 📁 queues/
│   └── 📄 emailQueue.js  # Queue definitions
└── 📁 workers/
    └── 📄 emailWorker.js # Job processors
```

---

## 🔧 Core Components Explained

### 1. **Redis Connection** (`redis.js`)
```javascript
const connection = {
  host: '127.0.0.1',
  port: 6379,
};
```
- Redis stores job data and queue state
- All queues and workers share the same connection
- Redis must be running: `sudo systemctl start redis` or `docker run -d -p 6379:6379 redis`

### 2. **Queue Definition** (`queues/emailQueue.js`)
```javascript
const { Queue } = require('bullmq');
const emailQueue = new Queue('emailQueue', { connection });
```
- A **Queue** is where you add jobs
- Multiple queues can exist for different job types
- Queue name must match between producer and consumer

### 3. **Job Creation** (`jobs/emailJob.js`)
```javascript
await emailQueue.add('sendEmail', { to: 'user@example.com' }, {
  delay: 5000,        // Wait 5 seconds before processing
  attempts: 3,        // Retry up to 3 times if failed
  backoff: {          // Wait strategy between retries
    type: 'exponential',
    delay: 2000
  },
  priority: 1,        // Higher number = higher priority
  repeat: {           // Schedule recurring jobs
    cron: '*/5 * * * *' // Every 5 minutes
  }
});
```

### 4. **Worker (Job Processor)** (`workers/emailWorker.js`)
```javascript
const worker = new Worker('emailQueue', async (job) => {
  // Process the job here
  console.log(`Processing: ${job.name}`, job.data);
}, { connection, concurrency: 5 });
```
- **Workers** process jobs from the queue
- Can run multiple workers for parallel processing
- `concurrency: 5` means 5 jobs can be processed simultaneously

### 5. **Event Listeners**
```javascript
worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.log(`❌ Job ${job.id} failed:`, err.message);
});
```

---

## 🚀 How to Run This Demo

### Prerequisites
1. **Install Redis**:
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis
   
   # Or using Docker
   docker run -d -p 6379:6379 redis
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

### Start the Application
```bash
npm run dev
```

### Test the API Endpoints

1. **Add a Simple Email Job**:
   ```bash
   curl -X POST http://localhost:3000/send-email \
     -H "Content-Type: application/json" \
     -d '{"to": "user@example.com", "delay": 0}'
   ```

2. **Add a Delayed Email Job**:
   ```bash
   curl -X POST http://localhost:3000/send-email \
     -H "Content-Type: application/json" \
     -d '{"to": "delayed@example.com", "delay": 10000}'
   ```

3. **Add a Recurring Job**:
   ```bash
   curl -X POST http://localhost:3000/send-recurring
   ```

4. **Monitor Jobs**: Visit http://localhost:3000/admin/queues

---

## 📊 Job States & Lifecycle

Jobs in BullMQ go through several states:

1. **Waiting** 🕒 - Job is queued, waiting to be processed
2. **Active** ⚡ - Job is currently being processed by a worker
3. **Completed** ✅ - Job finished successfully
4. **Failed** ❌ - Job failed (will retry if attempts remaining)
5. **Delayed** ⏰ - Job is scheduled for future processing
6. **Stalled** 😵 - Job was active but worker didn't respond (will be retried)

---

## 🔄 Retry Strategies

### Exponential Backoff
```javascript
backoff: {
  type: 'exponential',
  delay: 2000  // 2s, 4s, 8s, 16s...
}
```

### Fixed Delay
```javascript
backoff: {
  type: 'fixed',
  delay: 5000  // Always wait 5s between retries
}
```

### Custom Backoff
```javascript
backoff: {
  type: 'custom'
},
// In worker options:
settings: {
  backoffStrategy: (attemptsMade) => Math.pow(2, attemptsMade) * 1000
}
```

---

## ⏰ Scheduling Jobs

### Delay Jobs
```javascript
// Process in 30 seconds
await emailQueue.add('sendEmail', data, { delay: 30000 });

// Process at specific time
await emailQueue.add('sendEmail', data, { 
  delay: new Date('2024-12-25 09:00:00') - new Date() 
});
```

### Cron Jobs
```javascript
await emailQueue.add('sendEmail', data, {
  repeat: {
    cron: '0 9 * * 1-5',  // 9 AM on weekdays
    tz: 'America/New_York'
  }
});
```

### Common Cron Patterns
- `'*/5 * * * *'` - Every 5 minutes
- `'0 */2 * * *'` - Every 2 hours
- `'0 9 * * 1-5'` - 9 AM on weekdays
- `'0 0 1 * *'` - First day of every month

---

## 🎛️ Bull Board Dashboard

The dashboard at http://localhost:3000/admin/queues shows:

- **Active Jobs**: Currently being processed
- **Waiting Jobs**: In queue, waiting for workers
- **Completed Jobs**: Successfully finished
- **Failed Jobs**: Jobs that failed after all retries
- **Delayed Jobs**: Scheduled for future processing

You can:
- View job details and data
- Retry failed jobs manually
- Clean up old completed jobs
- Monitor queue statistics

---

## 🔧 Advanced Features

### Job Priority
```javascript
// Higher numbers = higher priority
await queue.add('urgent', data, { priority: 10 });
await queue.add('normal', data, { priority: 1 });
```

### Job Removal
```javascript
// Remove specific job
await job.remove();

// Clean completed jobs older than 1 hour
await queue.clean(3600000, 'completed');
```

### Rate Limiting
```javascript
const queue = new Queue('emailQueue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,  // Keep only 10 completed jobs
    removeOnFail: 5,       // Keep only 5 failed jobs
  }
});
```

### Worker Concurrency
```javascript
const worker = new Worker('emailQueue', processor, {
  connection,
  concurrency: 10,  // Process 10 jobs simultaneously
  limiter: {
    max: 100,       // Max 100 jobs
    duration: 60000 // Per minute
  }
});
```

---

## 🐛 Common Issues & Solutions

### Redis Connection Issues
```javascript
// Check if Redis is running
redis-cli ping  // Should return "PONG"

// In code, handle connection errors:
const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
});
```

### Memory Management
```javascript
// Automatically clean old jobs
await queue.clean(24 * 60 * 60 * 1000, 'completed');  // 24 hours
await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 7 days
```

### Graceful Shutdown
```javascript
process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
```

---

## 🎯 Best Practices

1. **Separate Concerns**: Keep job creation, queue definitions, and workers in separate files
2. **Error Handling**: Always handle errors in job processors
3. **Monitoring**: Use Bull Board or custom metrics to monitor queue health
4. **Resource Management**: Set appropriate concurrency limits
5. **Data Size**: Keep job data small; store large data elsewhere and pass references
6. **Idempotency**: Make jobs idempotent (safe to run multiple times)
7. **Testing**: Test job processors independently of the queue system

---

## 📚 Next Steps

1. **Add More Job Types**: Create different queues for different purposes
2. **Error Notifications**: Send alerts when jobs fail repeatedly
3. **Metrics**: Add Prometheus metrics for production monitoring
4. **Horizontal Scaling**: Run workers on multiple machines
5. **Job Dependencies**: Use BullMQ Pro for job flows and dependencies

---

This project gives you a solid foundation for understanding and using BullMQ in your applications! 🚀
