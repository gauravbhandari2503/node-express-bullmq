# 🚀 BullMQ Complete Learning Project

A comprehensive Node.js project demonstrating **BullMQ** (Redis-based job queue) with Express.js API, worker processes, and monitoring dashboard.

## 📋 What This Project Teaches

This project is a complete learning resource for understanding and implementing job queues in Node.js applications. You'll learn:

- ✅ **Job Queue Fundamentals** - Background processing, async tasks
- ✅ **BullMQ Core Concepts** - Queues, workers, jobs, and Redis integration
- ✅ **Different Job Types** - Immediate, delayed, scheduled, and recurring jobs
- ✅ **Error Handling & Retries** - Exponential backoff, failure strategies
- ✅ **Performance Optimization** - Concurrency, rate limiting, batching
- ✅ **Monitoring & Management** - Bull Board dashboard, job tracking
- ✅ **Production Patterns** - Graceful shutdown, memory management, scaling

## 🏗️ Project Architecture

```
📁 node-express-bullmq/
├── 📄 server.js              # Express API server with job endpoints
├── 📄 redis.js               # Redis connection configuration
├── 📄 dashboard.js           # Bull Board monitoring dashboard
├── 📄 test-bullmq.sh         # Interactive testing script
├── 📁 jobs/
│   └── 📄 emailJob.js        # Job creation functions
├── 📁 queues/
│   ├── 📄 emailQueue.js      # Main email queue definition
│   └── 📄 allQueues.js       # Multiple queue examples
├── 📁 workers/
│   ├── 📄 emailWorker.js     # Basic job processor
│   └── 📄 enhancedEmailWorker.js # Advanced worker with features
└── 📁 examples/
    ├── 📄 testing-examples.js    # Testing patterns
    └── 📄 advanced-examples.js   # Advanced features demo
```

## 🔧 Technologies Used

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework for API endpoints
- **BullMQ** - Redis-based job queue library
- **Redis** - In-memory data store for job persistence
- **Bull Board** - Web UI for queue monitoring
- **IORedis** - Redis client for Node.js

## 🚀 Quick Start

### Prerequisites

1. **Install Redis**:
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   sudo systemctl start redis
   
   # macOS (using Homebrew)
   brew install redis
   brew services start redis
   
   # Or using Docker
   docker run -d -p 6379:6379 redis
   ```

2. **Verify Redis is running**:
   ```bash
   redis-cli ping  # Should return "PONG"
   ```

### Installation

1. **Clone or download this project**
2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   - API Server: http://localhost:3000
   - Monitoring Dashboard: http://localhost:3000/admin/queues

## 📊 Features Demo

### 1. **Basic Email Job**
```bash
curl -X POST http://localhost:3000/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com"}'
```

### 2. **Delayed Job (10 seconds)**
```bash
curl -X POST http://localhost:3000/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"delayed@example.com","delay":10000}'
```

### 3. **High Priority Job**
```bash
curl -X POST http://localhost:3000/send-urgent \
  -H "Content-Type: application/json" \
  -d '{"to":"urgent@example.com"}'
```

### 4. **Recurring Job**
```bash
curl -X POST http://localhost:3000/send-recurring
```

### 5. **Batch Processing**
```bash
curl -X POST http://localhost:3000/send-batch \
  -H "Content-Type: application/json" \
  -d '{"recipients":["user1@example.com","user2@example.com"],"batchSize":5}'
```

### 6. **Progress Tracking**
```bash
curl -X POST http://localhost:3000/send-with-progress \
  -H "Content-Type: application/json" \
  -d '{"recipients":["user1@example.com","user2@example.com"]}'
```

### 7. **Email Campaign**
```bash
curl -X POST http://localhost:3000/create-campaign \
  -H "Content-Type: application/json" \
  -d '{"name":"Newsletter","recipients":["user@example.com"],"templateId":"template1"}'
```

## 🧪 Interactive Testing

Use the included testing script for easy experimentation:

```bash
chmod +x test-bullmq.sh
./test-bullmq.sh
```

This script provides an interactive menu to test all features!

## 📈 Monitoring Dashboard

Visit http://localhost:3000/admin/queues to see:

- 📊 **Real-time queue statistics**
- 🔍 **Individual job details**
- ⚡ **Active/waiting/completed job counts**
- 🔄 **Manual job retry capabilities**
- 🧹 **Queue cleanup tools**

## 💡 Key Learning Concepts

### 1. **Job Lifecycle**
```
Waiting → Active → Completed ✅
   ↓         ↓
Delayed   Failed ❌ → Retry
```

### 2. **Queue Configuration**
```javascript
const emailQueue = new Queue('emailQueue', { 
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,  // Memory management
    removeOnFail: 20,      // Keep failed for debugging
    attempts: 3,           // Retry failed jobs
    backoff: {             // Wait between retries
      type: 'exponential',
      delay: 2000,
    },
  }
});
```

### 3. **Worker Setup**
```javascript
const worker = new Worker('emailQueue', processJob, {
  connection,
  concurrency: 5,    // Process 5 jobs simultaneously
  limiter: {         // Rate limiting
    max: 100,        // 100 jobs
    duration: 60000, // Per minute
  }
});
```

### 4. **Job Types Examples**

**Immediate Job:**
```javascript
await emailQueue.add('sendEmail', { to: 'user@example.com' });
```

**Delayed Job:**
```javascript
await emailQueue.add('sendEmail', data, { delay: 10000 }); // 10 seconds
```

**Scheduled Job:**
```javascript
await emailQueue.add('sendEmail', data, { 
  delay: new Date('2024-12-25 09:00:00') - new Date() 
});
```

**Recurring Job:**
```javascript
await emailQueue.add('sendEmail', data, {
  repeat: { cron: '0 9 * * 1-5' } // 9 AM on weekdays
});
```

## 🎯 Production Features

### Error Handling & Retries
- **Exponential backoff**: `2s → 4s → 8s → 16s`
- **Custom retry strategies**
- **Dead letter queue** for permanently failed jobs

### Performance Optimization
- **Worker concurrency**: Process multiple jobs simultaneously
- **Rate limiting**: Prevent overwhelming external services
- **Batch processing**: Handle multiple items efficiently
- **Memory management**: Automatic cleanup of old jobs

### Monitoring & Alerting
- **Real-time dashboard** with Bull Board
- **Queue health metrics**
- **Job progress tracking**
- **Custom event listeners** for logging/alerting

### Scalability
- **Horizontal scaling**: Run workers on multiple machines
- **Multiple queue types**: Different queues for different purposes
- **Job prioritization**: Critical jobs processed first
- **Resource isolation**: Separate queues prevent blocking

## 📚 File Structure Explained

### Core Files
- **[`server.js`](server.js)** - Express API with job creation endpoints
- **[`redis.js`](redis.js)** - Redis connection with monitoring
- **[`dashboard.js`](dashboard.js)** - Bull Board configuration

### Job Management
- **[`jobs/emailJob.js`](jobs/emailJob.js)** - Job creation functions
- **[`queues/emailQueue.js`](queues/emailQueue.js)** - Queue definition
- **[`workers/emailWorker.js`](workers/emailWorker.js)** - Basic job processor
- **[`workers/enhancedEmailWorker.js`](workers/enhancedEmailWorker.js)** - Advanced features

### Examples & Testing
- **[`examples/testing-examples.js`](examples/testing-examples.js)** - Testing patterns
- **[`examples/advanced-examples.js`](examples/advanced-examples.js)** - Advanced features
- **[`test-bullmq.sh`](test-bullmq.sh)** - Interactive testing script

## 🎓 Learning Path

### **Beginner** (Start here!)
1. Understand what job queues are and why they're useful
2. Run basic email jobs using the API endpoints
3. Explore the dashboard to see job states
4. Experiment with delayed and urgent jobs

### **Intermediate**
1. Study the worker code and job processing logic
2. Test retry mechanisms by introducing failures
3. Create recurring jobs with cron patterns
4. Explore batch processing and progress tracking

### **Advanced**
1. Study the enhanced worker with multiple job types
2. Implement custom job processors
3. Set up monitoring and alerting
4. Scale workers across multiple processes

## 🛠️ Customization Ideas

1. **Add More Job Types**:
   - Image processing queue
   - Report generation queue
   - Notification queue (SMS, push notifications)

2. **Integrate with Real Services**:
   - SendGrid for actual email sending
   - AWS S3 for file processing
   - Stripe for payment processing

3. **Add Persistence**:
   - MongoDB for job results
   - PostgreSQL for application data
   - File system for logs

4. **Production Enhancements**:
   - Docker containerization
   - Kubernetes deployment
   - Prometheus metrics
   - Error tracking (Sentry)

## 🐛 Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
sudo journalctl -u redis

# Restart Redis
sudo systemctl restart redis
```

### Job Processing Issues
1. Check worker logs for errors
2. Use the dashboard to inspect failed jobs
3. Verify Redis connection in both queue and worker
4. Check job data format and processing logic

### Performance Issues
1. Monitor Redis memory usage
2. Adjust worker concurrency settings
3. Implement job cleanup strategies
4. Use batch processing for high-volume operations

## 📖 Additional Resources

- **[BullMQ Documentation](https://docs.bullmq.io/)**
- **[Redis Documentation](https://redis.io/documentation)**
- **[Bull Board GitHub](https://github.com/felixmosh/bull-board)**
- **[Complete Guide](BULLMQ_GUIDE.md)** - Detailed learning guide included

## 🤝 Contributing

This is a learning project! Feel free to:
- Add new job types and examples
- Improve error handling
- Add more monitoring features
- Create additional testing scenarios
- Enhance documentation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Happy Learning! 🚀**

*This project demonstrates production-ready patterns for job queue management in Node.js applications. Use it as a foundation for your own queue-based systems!*