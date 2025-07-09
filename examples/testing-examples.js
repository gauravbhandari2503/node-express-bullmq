/**
 * Testing Examples for BullMQ
 * 
 * This file shows how to test your job processors and queue operations.
 * Run with: node examples/testing-examples.js
 */

const { addEmailJob, addUrgentEmailJob, scheduleEmailAt } = require('../jobs/emailJob');
const emailQueue = require('../queues/emailQueue');

async function testBasicEmailJob() {
  console.log('\n🧪 Test 1: Basic Email Job');
  try {
    const job = await addEmailJob('test@example.com');
    console.log(`✅ Job created with ID: ${job.id}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testDelayedEmailJob() {
  console.log('\n🧪 Test 2: Delayed Email Job');
  try {
    const job = await addEmailJob('delayed@example.com', 5000); // 5 second delay
    console.log(`✅ Delayed job created with ID: ${job.id}`);
    console.log(`⏰ Will process in 5 seconds`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testUrgentEmailJob() {
  console.log('\n🧪 Test 3: Urgent Email Job');
  try {
    const job = await addUrgentEmailJob('urgent@example.com');
    console.log(`✅ Urgent job created with ID: ${job.id}`);
    console.log(`🚨 Priority: ${job.opts.priority}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testScheduledEmailJob() {
  console.log('\n🧪 Test 4: Scheduled Email Job');
  try {
    const futureTime = new Date(Date.now() + 10000); // 10 seconds from now
    const job = await scheduleEmailAt('scheduled@example.com', futureTime);
    console.log(`✅ Scheduled job created with ID: ${job.id}`);
    console.log(`📅 Scheduled for: ${futureTime.toISOString()}`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testRecurringEmailJob() {
  console.log('\n🧪 Test 5: Recurring Email Job');
  try {
    const job = await addEmailJob('recurring@example.com', 0, { 
      cron: '*/30 * * * * *' // Every 30 seconds
    });
    console.log(`✅ Recurring job created with ID: ${job.id}`);
    console.log(`🔄 Will repeat every 30 seconds`);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testQueueStatistics() {
  console.log('\n🧪 Test 6: Queue Statistics');
  try {
    const waiting = await emailQueue.getWaiting();
    const active = await emailQueue.getActive();
    const completed = await emailQueue.getCompleted();
    const failed = await emailQueue.getFailed();
    
    console.log('📊 Queue Statistics:');
    console.log(`  Waiting: ${waiting.length}`);
    console.log(`  Active: ${active.length}`);
    console.log(`  Completed: ${completed.length}`);
    console.log(`  Failed: ${failed.length}`);
    
    // Get job counts
    const counts = await emailQueue.getJobCounts();
    console.log('📈 Job Counts:', counts);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testJobRetrieval() {
  console.log('\n🧪 Test 7: Job Retrieval');
  try {
    // Get the last 5 jobs
    const jobs = await emailQueue.getJobs(['waiting', 'active', 'completed'], 0, 4);
    
    console.log(`📋 Last 5 jobs:`);
    jobs.forEach(job => {
      console.log(`  Job ${job.id}: ${job.name} - ${job.data.to} (${job.finishedOn ? 'completed' : 'pending'})`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting BullMQ Tests...');
  console.log('Make sure Redis is running and the worker is started!');
  
  await testBasicEmailJob();
  await testDelayedEmailJob();
  await testUrgentEmailJob();
  await testScheduledEmailJob();
  await testRecurringEmailJob();
  
  // Wait a bit for jobs to be processed
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testQueueStatistics();
  await testJobRetrieval();
  
  console.log('\n✅ All tests completed!');
  console.log('Check the worker logs and dashboard for results.');
  
  // Note: In a real test suite, you'd use a testing framework like Jest
  // and mock the actual email sending functionality
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('🎉 Test suite finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testBasicEmailJob,
  testDelayedEmailJob,
  testUrgentEmailJob,
  testScheduledEmailJob,
  testRecurringEmailJob,
  testQueueStatistics,
  testJobRetrieval
};
