/**
 * Enhanced Email Worker with Advanced Features
 * 
 * This worker demonstrates advanced job processing patterns:
 * - Progress tracking
 * - Batch processing
 * - Custom job types
 * - Error handling strategies
 */

const { Worker } = require('bullmq');
const { connection } = require('../redis');

/**
 * Process a single email job
 */
async function processSingleEmail(job) {
  const { to, urgent } = job.data;
  
  console.log(`📧 Sending email to: ${to}`);
  
  // Simulate email sending
  await new Promise(resolve => setTimeout(resolve, urgent ? 500 : 1000));
  
  // Simulate 10% failure rate for demo
  if (Math.random() < 0.1) {
    throw new Error(`Failed to send email to ${to}`);
  }
  
  return {
    sentAt: new Date().toISOString(),
    recipient: to,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
}

/**
 * Process batch email job
 */
async function processBatchEmail(job) {
  const { batch, batchNumber, totalBatches } = job.data;
  
  console.log(`📦 Processing batch ${batchNumber}/${totalBatches} with ${batch.length} emails`);
  
  const results = [];
  
  for (let i = 0; i < batch.length; i++) {
    try {
      // Update progress
      const progress = Math.round(((i + 1) / batch.length) * 100);
      await job.updateProgress(progress);
      
      // Process individual email
      const result = await processSingleEmail({ data: { to: batch[i] } });
      results.push({ email: batch[i], status: 'sent', result });
      
      console.log(`  ✅ ${i + 1}/${batch.length} emails sent in batch`);
      
    } catch (error) {
      console.log(`  ❌ Failed to send to ${batch[i]}: ${error.message}`);
      results.push({ email: batch[i], status: 'failed', error: error.message });
    }
  }
  
  const successful = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`📊 Batch ${batchNumber} completed: ${successful} sent, ${failed} failed`);
  
  return {
    batchNumber,
    totalEmails: batch.length,
    successful,
    failed,
    results
  };
}

/**
 * Process email with progress tracking
 */
async function processProgressEmail(job) {
  const { recipients, totalCount } = job.data;
  
  console.log(`📊 Processing ${totalCount} emails with progress tracking`);
  
  const results = [];
  
  for (let i = 0; i < recipients.length; i++) {
    try {
      // Update progress percentage
      const progress = Math.round(((i + 1) / totalCount) * 100);
      await job.updateProgress(progress);
      
      console.log(`📈 Progress: ${progress}% (${i + 1}/${totalCount})`);
      
      const result = await processSingleEmail({ data: { to: recipients[i] } });
      results.push({ email: recipients[i], status: 'sent', result });
      
      // Small delay to see progress updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.push({ email: recipients[i], status: 'failed', error: error.message });
    }
  }
  
  return {
    totalProcessed: totalCount,
    successful: results.filter(r => r.status === 'sent').length,
    failed: results.filter(r => r.status === 'failed').length,
    results
  };
}

/**
 * Process campaign preparation
 */
async function processPrepareCampaign(job) {
  const { campaignName, templateId, recipientCount } = job.data;
  
  console.log(`🎯 Preparing campaign: ${campaignName}`);
  
  // Simulate campaign preparation tasks
  await job.updateProgress(20);
  console.log('  📝 Loading email template...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  await job.updateProgress(50);
  console.log('  👥 Validating recipients...');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  await job.updateProgress(80);
  console.log('  ⚙️  Setting up tracking...');
  await new Promise(resolve => setTimeout(resolve, 300));
  
  await job.updateProgress(100);
  console.log('  ✅ Campaign preparation completed');
  
  return {
    campaignName,
    templateId,
    recipientCount,
    preparedAt: new Date().toISOString(),
    status: 'ready'
  };
}

/**
 * Process campaign sending
 */
async function processSendCampaign(job) {
  const { campaignName, recipients, templateId, prepJobId } = job.data;
  
  console.log(`🚀 Sending campaign: ${campaignName}`);
  console.log(`📧 Recipients: ${recipients.length}`);
  
  // Simulate sending to all recipients
  const results = [];
  for (let i = 0; i < recipients.length; i++) {
    const progress = Math.round(((i + 1) / recipients.length) * 100);
    await job.updateProgress(progress);
    
    try {
      const result = await processSingleEmail({ data: { to: recipients[i] } });
      results.push({ recipient: recipients[i], status: 'sent', result });
    } catch (error) {
      results.push({ recipient: recipients[i], status: 'failed', error: error.message });
    }
    
    // Throttle to avoid overwhelming email service
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const successful = results.filter(r => r.status === 'sent').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`📊 Campaign ${campaignName} completed: ${successful} sent, ${failed} failed`);
  
  return {
    campaignName,
    totalRecipients: recipients.length,
    successful,
    failed,
    sentAt: new Date().toISOString(),
    results
  };
}

/**
 * Generate campaign report
 */
async function processCampaignReport(job) {
  const { campaignName, sendJobId } = job.data;
  
  console.log(`📈 Generating report for campaign: ${campaignName}`);
  
  // Simulate report generation
  await job.updateProgress(25);
  console.log('  📊 Collecting statistics...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await job.updateProgress(50);
  console.log('  📈 Analyzing performance...');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  await job.updateProgress(75);
  console.log('  📄 Generating PDF report...');
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  await job.updateProgress(100);
  console.log('  ✅ Report generated successfully');
  
  return {
    campaignName,
    reportGeneratedAt: new Date().toISOString(),
    reportUrl: `/reports/campaign-${sendJobId}.pdf`,
    summary: {
      totalSent: Math.floor(Math.random() * 1000) + 500,
      deliveryRate: (Math.random() * 0.1 + 0.9).toFixed(3), // 90-100%
      openRate: (Math.random() * 0.3 + 0.2).toFixed(3),     // 20-50%
      clickRate: (Math.random() * 0.1 + 0.05).toFixed(3)    // 5-15%
    }
  };
}

/**
 * Main job processor function
 */
const processJob = async (job) => {
  console.log(`\n🔄 Processing job: ${job.id} (${job.name})`);
  console.log(`📊 Attempt: ${job.attemptsMade + 1}/${job.opts.attempts}`);
  
  const startTime = Date.now();
  
  try {
    let result;
    
    switch (job.name) {
      case 'sendEmail':
        result = await processSingleEmail(job);
        break;
        
      case 'batchEmail':
        result = await processBatchEmail(job);
        break;
        
      case 'progressEmail':
        result = await processProgressEmail(job);
        break;
        
      case 'prepareCampaign':
        result = await processPrepareCampaign(job);
        break;
        
      case 'sendCampaign':
        result = await processSendCampaign(job);
        break;
        
      case 'campaignReport':
        result = await processCampaignReport(job);
        break;
        
      default:
        throw new Error(`Unknown job type: ${job.name}`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Job ${job.id} completed in ${duration}ms`);
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ Job ${job.id} failed after ${duration}ms: ${error.message}`);
    throw error;
  }
};

/**
 * Create the enhanced worker
 */
const worker = new Worker('emailQueue', processJob, {
  connection,
  concurrency: 3, // Process 3 jobs simultaneously
  
  // Rate limiting
  limiter: {
    max: 50,           // Max 50 jobs
    duration: 60000,   // Per minute
  },
  
  // Worker settings
  settings: {
    stalledInterval: 30000,  // Check for stalled jobs every 30s
    maxStalledCount: 2,      // Max 2 stalls before giving up
  }
});

/**
 * Enhanced event listeners
 */

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} (${job.name}) completed successfully`);
  
  // Log different types of results
  if (result.successful !== undefined) {
    console.log(`   📊 Success rate: ${result.successful}/${result.successful + (result.failed || 0)}`);
  }
  
  if (result.messageId) {
    console.log(`   📨 Message ID: ${result.messageId}`);
  }
});

worker.on('failed', (job, err) => {
  console.log(`❌ Job ${job.id} (${job.name}) failed: ${err.message}`);
  console.log(`   🔄 Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
  
  // Log failure patterns for monitoring
  if (job.attemptsMade >= job.opts.attempts) {
    console.log(`   💀 Job permanently failed after ${job.attemptsMade} attempts`);
  }
});

worker.on('active', (job) => {
  console.log(`⚡ Job ${job.id} (${job.name}) started processing`);
});

worker.on('progress', (job, progress) => {
  console.log(`📈 Job ${job.id} progress: ${progress}%`);
});

worker.on('stalled', (jobId) => {
  console.log(`😵 Job ${jobId} stalled - will be retried`);
});

worker.on('error', (error) => {
  console.error('💥 Worker error:', error);
});

// Graceful shutdown
async function gracefulShutdown() {
  console.log('🛑 Shutting down worker gracefully...');
  
  try {
    await worker.close();
    console.log('👋 Worker closed successfully');
  } catch (error) {
    console.error('❌ Error closing worker:', error);
  }
  
  process.exit(0);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

console.log('👷 Enhanced email worker started!');
console.log(`📊 Concurrency: ${worker.opts.concurrency}`);
console.log(`⚡ Rate limit: ${worker.opts.limiter.max} jobs per minute`);
console.log('🎯 Supported job types:');
console.log('   - sendEmail: Single email');
console.log('   - batchEmail: Batch email processing');
console.log('   - progressEmail: Email with progress tracking');
console.log('   - prepareCampaign: Campaign preparation');
console.log('   - sendCampaign: Campaign execution');
console.log('   - campaignReport: Report generation');

module.exports = worker;
