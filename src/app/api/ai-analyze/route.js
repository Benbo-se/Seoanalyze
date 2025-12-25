// AI-Analyze API endpoint
// Creates AI-driven analysis with competitor comparison

// Import queue system
const { addAiAnalysisJob } = require('../../../../lib/queue-manager');

// Import analytics tracker
const { trackVisitor } = require('../../../../lib/analytics-tracker');

// Import Prisma singleton
const { prisma } = require('../../../../lib/prisma');

export async function POST(request) {
  try {
    const { url, competitors } = await request.json();

    if (!url) {
      return Response.json({
        error: 'URL is required'
      }, { status: 400 });
    }

    // Validate URL format
    if (typeof url !== 'string' || url.length < 10 || url.length > 2000) {
      return Response.json({
        error: 'Invalid URL format',
        message: 'URL must be between 10-2000 characters'
      }, { status: 400 });
    }

    if (!url.match(/^https?:\/\/.+\..+/)) {
      return Response.json({
        error: 'Invalid URL format',
        message: 'URL must start with http:// or https:// and contain a domain'
      }, { status: 400 });
    }

    try {
      new URL(url);
    } catch (urlError) {
      return Response.json({
        error: 'Invalid URL format',
        message: 'URL is not properly formatted'
      }, { status: 400 });
    }

    console.log(`🤖 Starting AI analysis for ${url}`);

    // Create AI analysis record
    const aiAnalysis = await prisma.aiAnalysis.create({
      data: {
        targetUrl: url,
        status: 'pending',
        progress: 0
      }
    });

    console.log(`✅ Created AI analysis ${aiAnalysis.id} for ${url}`);

    // Validate competitors (optional, max 3 URLs)
    let validatedCompetitors = [];
    if (competitors && Array.isArray(competitors)) {
      validatedCompetitors = competitors
        .slice(0, 3) // Max 3 competitors
        .filter(comp => {
          if (typeof comp !== 'string') return false;
          try {
            new URL(comp);
            return true;
          } catch {
            return false;
          }
        });
    }

    // Add job to queue for background processing
    const job = await addAiAnalysisJob({
      url,
      aiAnalysisId: aiAnalysis.id,
      competitors: validatedCompetitors
    });

    // Track analytics
    trackVisitor(request, 'ai-analysis', { url });

    console.log(`🚀 Queued AI analysis job ${job.id} for ${url}`);

    return Response.json({
      jobId: aiAnalysis.id,
      queueJobId: job.id,
      message: 'AI analysis started',
      estimatedTime: '60-90 seconds'
    });

  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    return Response.json({
      error: 'Analysis failed',
      message: error.message
    }, { status: 500 });
  }
}
