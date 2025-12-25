#!/usr/bin/env node

const axios = require('axios');
const https = require('https');

const BASE_URL = 'http://localhost:5001';

// Allow self-signed certificates for testing
const agent = new https.Agent({  
  rejectUnauthorized: false
});

async function startAnalysis(url, type) {
  try {
    const response = await axios.post(`${BASE_URL}/api/analyze`, {
      url: url,
      type: type
    }, {
      timeout: 10000,
      httpsAgent: agent
    });
    
    return {
      success: true,
      jobId: response.data.jobId,
      url: url,
      type: type,
      startTime: Date.now()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      url: url,
      type: type,
      startTime: Date.now()
    };
  }
}

async function checkJobStatus(jobId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/job/${jobId}/status`, {
      timeout: 5000,
      httpsAgent: agent
    });
    return response.data;
  } catch (error) {
    return { error: error.message };
  }
}

async function runConcurrentTest() {
  console.log('🚀 Starting concurrent analysis test...\n');
  
  // Test URLs for different analysis types
  const testUrls = [
    'https://example.com',
    'https://httpbin.org',
    'https://httpbin.org/html',
    'https://httpbin.org/json', 
    'https://httpbin.org/status/200'
  ];
  
  const testCases = [
    // SEO tests (should be fastest)
    ...testUrls.map(url => ({ url, type: 'seo' })),
    // Lighthouse tests (slower)
    { url: 'https://httpbin.org', type: 'lighthouse' },
    { url: 'https://example.com', type: 'lighthouse' },
    // Crawl tests (slowest but limited pages)
    { url: 'https://httpbin.org', type: 'crawl' }
  ];
  
  console.log(`📊 Starting ${testCases.length} concurrent analyses...`);
  
  // Start all analyses concurrently
  const startTime = Date.now();
  const promises = testCases.map(test => startAnalysis(test.url, test.type));
  const results = await Promise.all(promises);
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successfully started: ${successful.length}/${testCases.length} analyses`);
  console.log(`❌ Failed to start: ${failed.length}/${testCases.length} analyses`);
  
  if (failed.length > 0) {
    console.log('\n🚨 Failed analyses:');
    failed.forEach(f => {
      console.log(`  - ${f.type.toUpperCase()} ${f.url}: ${f.error}`);
    });
  }
  
  if (successful.length === 0) {
    console.log('\n❌ No successful analyses to track');
    return;
  }
  
  console.log(`\n⏱️  Monitoring ${successful.length} jobs...`);
  
  // Track job completion
  const jobTracking = successful.map(job => ({
    ...job,
    completed: false,
    completionTime: null,
    finalStatus: null
  }));
  
  const maxWaitTime = 300000; // 5 minutes
  const checkInterval = 3000; // 3 seconds
  let elapsed = 0;
  
  while (elapsed < maxWaitTime) {
    const pendingJobs = jobTracking.filter(job => !job.completed);
    
    if (pendingJobs.length === 0) {
      console.log('\n🎉 All jobs completed!');
      break;
    }
    
    console.log(`⏳ Checking status... (${pendingJobs.length} pending, ${elapsed/1000}s elapsed)`);
    
    // Check status of all pending jobs
    const statusChecks = await Promise.all(
      pendingJobs.map(async (job) => {
        const status = await checkJobStatus(job.jobId);
        return { jobId: job.jobId, status };
      })
    );
    
    // Update job tracking
    statusChecks.forEach(({ jobId, status }) => {
      const job = jobTracking.find(j => j.jobId === jobId);
      if (job && (status.state === 'completed' || status.state === 'failed')) {
        job.completed = true;
        job.completionTime = Date.now();
        job.finalStatus = status.state;
        
        const duration = (job.completionTime - job.startTime) / 1000;
        console.log(`  ✅ ${job.type.toUpperCase()} ${job.url}: ${status.state} (${duration.toFixed(1)}s)`);
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    elapsed += checkInterval;
  }
  
  // Final summary
  const totalTime = (Date.now() - startTime) / 1000;
  const completed = jobTracking.filter(job => job.completed);
  const stillPending = jobTracking.filter(job => !job.completed);
  
  console.log(`\n📊 Final Results after ${totalTime.toFixed(1)}s:`);
  console.log(`✅ Completed: ${completed.length}`);
  console.log(`⏳ Still pending: ${stillPending.length}`);
  
  // Analysis by type
  const seoJobs = jobTracking.filter(j => j.type === 'seo');
  const lighthouseJobs = jobTracking.filter(j => j.type === 'lighthouse');
  const crawlJobs = jobTracking.filter(j => j.type === 'crawl');
  
  console.log('\n📈 Performance by type:');
  
  if (seoJobs.length > 0) {
    const seoCompleted = seoJobs.filter(j => j.completed);
    const avgSeoTime = seoCompleted.reduce((sum, j) => 
      sum + (j.completionTime - j.startTime), 0) / seoCompleted.length / 1000;
    console.log(`  SEO: ${seoCompleted.length}/${seoJobs.length} completed, avg ${avgSeoTime.toFixed(1)}s`);
  }
  
  if (lighthouseJobs.length > 0) {
    const lhCompleted = lighthouseJobs.filter(j => j.completed);
    const avgLhTime = lhCompleted.reduce((sum, j) => 
      sum + (j.completionTime - j.startTime), 0) / lhCompleted.length / 1000;
    console.log(`  Lighthouse: ${lhCompleted.length}/${lighthouseJobs.length} completed, avg ${avgLhTime.toFixed(1)}s`);
  }
  
  if (crawlJobs.length > 0) {
    const crawlCompleted = crawlJobs.filter(j => j.completed);
    const avgCrawlTime = crawlCompleted.reduce((sum, j) => 
      sum + (j.completionTime - j.startTime), 0) / crawlCompleted.length / 1000;
    console.log(`  Crawl: ${crawlCompleted.length}/${crawlJobs.length} completed, avg ${avgCrawlTime.toFixed(1)}s`);
  }
}

// Install axios if not available
async function ensureAxios() {
  try {
    require.resolve('axios');
    return true;
  } catch (e) {
    console.log('📦 Installing axios...');
    const { execSync } = require('child_process');
    execSync('npm install axios', { stdio: 'inherit' });
    delete require.cache[require.resolve('axios')];
    return true;
  }
}

async function main() {
  await ensureAxios();
  await runConcurrentTest();
}

if (require.main === module) {
  main().catch(console.error);
}