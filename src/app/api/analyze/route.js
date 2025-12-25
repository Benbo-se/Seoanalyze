// Next.js App Router API route for analyze endpoint
// Migrated from Live-Server/server-hybrid-sse.js

import { v4 as uuidv4 } from 'uuid';

/**
 * SSRF Protection - Blocks requests to internal/private networks
 * Prevents attackers from using the analyzer to probe internal infrastructure
 */
function isSSRFAttempt(urlString) {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Block localhost variants
    const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'];
    if (localhostPatterns.some(pattern => hostname === pattern || hostname.startsWith(pattern + ':'))) {
      return { blocked: true, reason: 'localhost access blocked' };
    }

    // Block cloud metadata endpoints
    const metadataIPs = ['169.254.169.254', '169.254.170.2', 'metadata.google.internal'];
    if (metadataIPs.some(ip => hostname === ip || hostname.includes(ip))) {
      return { blocked: true, reason: 'cloud metadata endpoint blocked' };
    }

    // Block private IP ranges (IPv4)
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b, c, d] = ipv4Match.map(Number);

      // 10.0.0.0/8
      if (a === 10) {
        return { blocked: true, reason: 'private IP range 10.x.x.x blocked' };
      }
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) {
        return { blocked: true, reason: 'private IP range 172.16-31.x.x blocked' };
      }
      // 192.168.0.0/16
      if (a === 192 && b === 168) {
        return { blocked: true, reason: 'private IP range 192.168.x.x blocked' };
      }
      // 127.0.0.0/8 (loopback)
      if (a === 127) {
        return { blocked: true, reason: 'loopback IP blocked' };
      }
      // 0.0.0.0/8
      if (a === 0) {
        return { blocked: true, reason: 'invalid IP range 0.x.x.x blocked' };
      }
    }

    // Block internal hostnames
    const internalPatterns = ['internal', 'intranet', 'private', 'corp', 'local'];
    if (internalPatterns.some(pattern => hostname.includes(pattern))) {
      return { blocked: true, reason: 'internal hostname pattern blocked' };
    }

    // Block common internal ports in URL
    const dangerousPorts = ['6379', '5432', '3306', '27017', '11211', '9200', '9300'];
    if (dangerousPorts.includes(url.port)) {
      return { blocked: true, reason: `dangerous port ${url.port} blocked` };
    }

    return { blocked: false, reason: null };
  } catch (e) {
    return { blocked: true, reason: 'URL parsing failed' };
  }
}

// Import queue system
const { 
  addLighthouseJob, 
  addCrawlJob, 
  addSeoJob,
  getQueueStats 
} = require('../../../../lib/queue-manager');

// Import analytics tracker
const { trackVisitor } = require('../../../../lib/analytics-tracker');

// Import Fas 3 core modules
const analysisRepo = require('../../../../src/core/analysis.repo');

export async function POST(request) {
  try {
    const { url, type = 'seo', maxPages = 100 } = await request.json();
    
    if (!url) {
      return Response.json({ 
        error: 'URL is required' 
      }, { status: 400 });
    }
    
    // Validate analysis type
    if (!['seo', 'crawl', 'lighthouse'].includes(type)) {
      return Response.json({
        error: 'Invalid analysis type',
        message: 'Type must be one of: seo, crawl, lighthouse'
      }, { status: 400 });
    }
    
    // Robust URL validation
    if (typeof url !== 'string' || url.length < 10 || url.length > 2000) {
      console.error(`Invalid ${type.toUpperCase()} URL length: ${url} (length: ${url?.length})`);
      return Response.json({ 
        error: 'Invalid URL format',
        message: 'URL must be between 10-2000 characters'
      }, { status: 400 });
    }
    
    if (!url.match(/^https?:\/\/.+\..+/)) {
      console.error(`Invalid ${type.toUpperCase()} URL format: ${url}`);
      return Response.json({ 
        error: 'Invalid URL format',
        message: 'URL must start with http:// or https:// and contain a domain'
      }, { status: 400 });
    }
    
    try {
      new URL(url);
    } catch (urlError) {
      console.error(`${type.toUpperCase()} URL parsing failed for: ${url} - Error: ${urlError.message}`);
      return Response.json({
        error: 'Invalid URL format',
        message: 'URL is not properly formatted'
      }, { status: 400 });
    }

    // SSRF Protection - Block private/internal IPs and metadata endpoints
    const ssrfCheck = isSSRFAttempt(url);
    if (ssrfCheck.blocked) {
      console.error(`🚨 SSRF attempt blocked: ${url} - Reason: ${ssrfCheck.reason}`);
      return Response.json({
        error: 'Invalid URL',
        message: 'This URL cannot be analyzed for security reasons'
      }, { status: 403 });
    }

    const clientId = uuidv4();
    console.log(`🔍 Starting ${type.toUpperCase()} analysis for ${url} (client: ${clientId})`);
    
    // Route to appropriate analysis handler
    if (type === 'seo') {
      // SEO Analysis
      let analysisId = null;
      if (analysisRepo.isEnabled) {
        const analysis = await analysisRepo.create({
          targetUrl: url,
          type: 'seo',
          status: 'processing'
        });
        analysisId = analysis?.id;
      }
      
      const job = await addSeoJob({ url, clientId, analysisId });
      trackVisitor(request, 'seo', { url });
      
      return Response.json({
        jobId: job.id,
        clientId,
        analysisId,
        message: 'SEO analysis started. Connect to SSE for real-time updates.',
        sseEndpoint: `/api/sse/job/${job.id}/analysis/${clientId}`,
        estimatedTime: '30-60 seconds'
      });
      
    } else if (type === 'crawl') {
      // Crawl Analysis
      let analysisId = null;
      if (process.env.ENABLE_DATABASE === 'true' && analysisRepo.isEnabled) {
        try {
          const analysis = await analysisRepo.create({
            targetUrl: url,
            type: 'crawl',
            status: 'pending',
            summary: {
              maxPages: maxPages,
              startTime: new Date()
            }
          });
          analysisId = analysis.id;
          console.log(`📝 Created Crawl analysis record: ${analysisId}`);
        } catch (dbError) {
          console.error('Failed to create Crawl analysis record:', dbError);
        }
      }
      
      const job = await addCrawlJob({ url, maxPages, clientId, analysisId });
      trackVisitor(request, 'crawl', { url });
      
      return Response.json({
        jobId: job.id,
        clientId,
        analysisId,
        message: 'Crawl started. Connect to SSE for real-time updates.',
        sseEndpoint: `/api/sse/job/${job.id}/crawl/${clientId}`,
        estimatedTime: '2-5 minutes'
      });
      
    } else if (type === 'lighthouse') {
      // Lighthouse Analysis
      const queueStats = await getQueueStats();
      const totalWaiting = queueStats.lighthouse.waiting + queueStats.lighthouse.active;
      
      if (totalWaiting >= 100) {
        return Response.json({
          error: 'Systemet är överbelastat just nu',
          message: 'Det finns redan för många analyser i kö. Försök igen om några minuter.',
          queueLength: totalWaiting,
          estimatedWaitMinutes: Math.ceil(totalWaiting * 2)
        }, { status: 429 });
      }
      
      let analysisId = null;
      if (process.env.ENABLE_DATABASE === 'true' && analysisRepo.isEnabled) {
        try {
          const analysis = await analysisRepo.create({
            targetUrl: url,
            type: 'lighthouse',
            status: 'pending',
            summary: {
              startTime: new Date()
            }
          });
          analysisId = analysis.id;
          console.log(`📝 Created Lighthouse analysis record: ${analysisId}`);
        } catch (dbError) {
          console.error('Failed to create Lighthouse analysis record:', dbError);
        }
      }
      
      const job = await addLighthouseJob({ url, clientId, analysisId });
      trackVisitor(request, 'lighthouse', { url });
      
      return Response.json({
        jobId: job.id,
        clientId,
        analysisId,
        message: 'Lighthouse analysis started. Connect to SSE for real-time updates.',
        sseEndpoint: `/api/sse/job/${job.id}/lighthouse/${clientId}`,
        estimatedTime: '1-3 minutes'
      });
    }
    
  } catch (error) {
    console.error(`Analysis error:`, error);
    return Response.json({ 
      error: 'Analysis failed', 
      message: error.message 
    }, { status: 500 });
  }
}