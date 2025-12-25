#!/usr/bin/env node

/**
 * SKEPTIC MODE Verification Script
 * 
 * Testar end-to-end att alla tre analysis typer (SEO, Crawl, Lighthouse) fungerar korrekt:
 * 1. POST skapar job med rätt type i DB
 * 2. Queue workers processerar korrekt typ
 * 3. GET returnerar rätt type (inte hardkodad lighthouse)
 * 4. Results innehåller type-specifik data
 */

const axios = require('axios');
const fs = require('fs').promises;

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const TEST_URL = 'https://www.27gradernord.se';
const WAIT_TIME = 15000; // 15 sekunder väntetid per analys

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function createAnalysis(type) {
  log(`\n🚀 Creating ${type.toUpperCase()} analysis...`, colors.blue);
  
  const response = await axios.post(`${API_BASE}/api/v1/analyses`, {
    url: TEST_URL,
    analysisType: type,
    maxPages: type === 'crawl' ? 5 : undefined
  });

  const { id, jobId, type: returnedType, status } = response.data;
  
  log(`✅ Created analysis ID: ${id}, Job: ${jobId}, Type: ${returnedType}, Status: ${status}`);
  
  // VERIFIERING: POST ska returnera rätt type
  if (returnedType !== type) {
    log(`❌ ERROR: POST returned type "${returnedType}", expected "${type}"`, colors.red);
    return null;
  }
  
  return { id, jobId, type: returnedType };
}

async function waitForCompletion(analysisId, expectedType) {
  log(`\n⏳ Waiting for completion of ${expectedType.toUpperCase()} analysis ${analysisId}...`, colors.yellow);
  
  let attempts = 0;
  const maxAttempts = 30; // 30 * 3s = 90s max wait
  
  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(`${API_BASE}/api/v1/analyses/${analysisId}`);
      const { status, type, results } = response.data;
      
      // VERIFIERING: GET ska returnera rätt type (inte hardkodad lighthouse)
      if (type !== expectedType && type !== 'unknown') {
        log(`❌ ERROR: GET returned type "${type}", expected "${expectedType}"`, colors.red);
        return false;
      }
      
      if (status === 'completed') {
        log(`✅ Analysis completed! Type: ${type}, Has results: ${!!results}`, colors.green);
        
        // VERIFIERING: Results ska innehålla type-specifik data
        if (results) {
          if (expectedType === 'seo' && !results.seoScore) {
            log(`❌ ERROR: SEO results missing seoScore field`, colors.red);
            return false;
          }
          if (expectedType === 'lighthouse' && !results.lhr) {
            log(`❌ ERROR: Lighthouse results missing lhr field`, colors.red);
            return false;
          }
          if (expectedType === 'crawl' && !results.pages) {
            log(`❌ ERROR: Crawl results missing pages field`, colors.red);
            return false;
          }
        }
        
        return true;
      } else if (status === 'failed') {
        log(`❌ Analysis failed!`, colors.red);
        return false;
      }
      
      log(`⏱️  Status: ${status}, waiting 3 more seconds...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 202) {
        log(`⏱️  Analysis not ready yet, waiting...`);
      } else {
        log(`❌ Error checking status: ${error.message}`, colors.red);
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;
    }
  }
  
  log(`❌ Timeout waiting for completion`, colors.red);
  return false;
}

async function verifyResultContent(analysisId, expectedType) {
  log(`\n🔍 Verifying result content for ${expectedType.toUpperCase()}...`, colors.blue);
  
  try {
    const response = await axios.get(`${API_BASE}/api/v1/analyses/${analysisId}`);
    const { results, type } = response.data;
    
    if (!results) {
      log(`❌ No results found`, colors.red);
      return false;
    }
    
    log(`✅ Type field: ${type}`, colors.green);
    
    // Type-specific verifications
    if (expectedType === 'seo') {
      const hasRequiredFields = results.seoScore !== undefined && 
                               results.meta && 
                               results.headings &&
                               results.readability;
      
      if (hasRequiredFields) {
        log(`✅ SEO results contain required fields: seoScore, meta, headings, readability`, colors.green);
        
        // Verify clean text extraction worked
        if (results.readability?.lix) {
          log(`✅ LIX score calculated: ${results.readability.lix}`, colors.green);
        }
      } else {
        log(`❌ SEO results missing required fields`, colors.red);
        return false;
      }
    }
    
    if (expectedType === 'lighthouse') {
      const hasLighthouseData = results.lhr || results.scores || results.performance;
      if (hasLighthouseData) {
        log(`✅ Lighthouse results contain performance data`, colors.green);
      } else {
        log(`❌ Lighthouse results missing performance data`, colors.red);
        return false;
      }
    }
    
    if (expectedType === 'crawl') {
      const hasCrawlData = results.pages && Array.isArray(results.pages);
      if (hasCrawlData) {
        log(`✅ Crawl results contain ${results.pages.length} pages`, colors.green);
      } else {
        log(`❌ Crawl results missing pages array`, colors.red);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    log(`❌ Error verifying results: ${error.message}`, colors.red);
    return false;
  }
}

async function main() {
  log(`${colors.bold}🧪 SKEPTIC MODE: End-to-End Analysis Type Verification${colors.reset}`);
  log(`Testing URL: ${TEST_URL}`);
  log(`API Base: ${API_BASE}`);
  
  const results = {
    seo: { success: false, id: null },
    lighthouse: { success: false, id: null },
    crawl: { success: false, id: null }
  };
  
  // Test alla tre typer parallellt
  const types = ['seo', 'lighthouse', 'crawl'];
  const analyses = [];
  
  for (const type of types) {
    try {
      const analysis = await createAnalysis(type);
      if (analysis) {
        analyses.push({ ...analysis, expectedType: type });
        results[type].id = analysis.id;
      }
    } catch (error) {
      log(`❌ Failed to create ${type} analysis: ${error.message}`, colors.red);
    }
    
    // Vänta lite mellan requests för att inte överbelasta systemet
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (analyses.length === 0) {
    log(`❌ No analyses could be created!`, colors.red);
    process.exit(1);
  }
  
  log(`\n📋 Created ${analyses.length} analyses, waiting for completion...`);
  
  // Vänta på completion för alla
  for (const analysis of analyses) {
    const success = await waitForCompletion(analysis.id, analysis.expectedType);
    results[analysis.expectedType].success = success;
    
    if (success) {
      // Verify result content
      const contentValid = await verifyResultContent(analysis.id, analysis.expectedType);
      results[analysis.expectedType].success = contentValid;
    }
  }
  
  // Sammanfattning
  log(`\n${colors.bold}📊 VERIFICATION RESULTS:${colors.reset}`);
  
  let allPassed = true;
  for (const [type, result] of Object.entries(results)) {
    const status = result.success ? 'PASS' : 'FAIL';
    const color = result.success ? colors.green : colors.red;
    log(`${color}${type.toUpperCase()}: ${status} (ID: ${result.id || 'N/A'})${colors.reset}`);
    
    if (!result.success) allPassed = false;
  }
  
  log(`\n${colors.bold}${allPassed ? colors.green + '✅ ALL VERIFICATIONS PASSED' : colors.red + '❌ SOME VERIFICATIONS FAILED'}${colors.reset}`);
  
  // Spara resultat till fil för senare analys
  const reportData = {
    timestamp: new Date().toISOString(),
    testUrl: TEST_URL,
    apiBase: API_BASE,
    results: results,
    allPassed: allPassed
  };
  
  await fs.writeFile('/tmp/analysis-verification-report.json', JSON.stringify(reportData, null, 2));
  log(`\n📁 Report saved to: /tmp/analysis-verification-report.json`);
  
  process.exit(allPassed ? 0 : 1);
}

// Error handling
process.on('unhandledRejection', (error) => {
  log(`❌ Unhandled rejection: ${error.message}`, colors.red);
  process.exit(1);
});

if (require.main === module) {
  main().catch(error => {
    log(`❌ Script failed: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { main };