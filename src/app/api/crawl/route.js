import { v4 as uuidv4 } from 'uuid';
const { addCrawlJob, getQueueStats } = require('../../../../lib/queue-manager');
const { trackVisitor } = require('../../../../lib/analytics-tracker');
const analysisRepo = require('../../../../src/core/analysis.repo');

export async function POST(request) {
  try {
    const body = await request.json();
    const { url, maxPages = 100, includeExternal = false } = body;
    if (!url) return Response.json({ error: 'URL is required' }, { status: 400 });

    // icke-blockerande tracking
    trackVisitor(request, 'crawl', { url });

    // valfritt DB-record
    let analysis = null;
    if (process.env.ENABLE_DATABASE === 'true' && analysisRepo.isEnabled) {
      try {
        analysis = await analysisRepo.create({
          targetUrl: url,
          type: 'crawl',
          status: 'pending',
          summary: { maxPages, includeExternal, startTime: new Date() }
        });
      } catch {}
    }

    // lägg jobb i kö
    const job = await addCrawlJob({
      url, maxPages, includeExternal, analysisId: analysis?.id
    });

    return Response.json({
      jobId: job.id,
      analysisId: analysis?.id,
      status: 'queued',
      url,
      queuePosition: await getQueuePosition(),
      message: 'Crawl analysis started'
    });
  } catch (error) {
    console.error('Crawl API error:', error);
    return Response.json({ error: 'Crawl analysis failed', details: String(error) }, { status: 500 });
  }
}

async function getQueuePosition() {
  try { return (await getQueueStats()).crawl?.waiting || 0; } catch { return 0; }
}