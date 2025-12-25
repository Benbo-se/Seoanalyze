// Next.js App Router API route for viewing shared analyses
// Migrated from Live-Server/src/api/v1/share.routes.js

const shareService = require('../../../../../../src/core/share.service');
const artifactStore = require('../../../../../../src/core/artifact.store');

export async function GET(request, { params }) {
  try {
    const { shareId } = await params;
    
    // Ensure share service is initialized
    await shareService.ensureInitialized();
    
    if (!shareService.isEnabled) {
      return Response.json({
        error: 'Share service not available'
      }, { status: 503 });
    }

    const share = await shareService.getShare(shareId);
    
    if (!share) {
      return Response.json({
        error: 'Share not found',
        message: 'This share link may have expired or been disabled'
      }, { status: 404 });
    }

    // Get full results from artifacts
    const resultsKey = artifactStore.generateKeyWithDate(
      share.analysis.id,
      `${share.analysis.type}-results`,
      share.analysis.createdAt,
      'json'
    );
    
    let fullResults = null;
    try {
      const resultsJson = await artifactStore.get(resultsKey);
      if (resultsJson) {
        fullResults = JSON.parse(resultsJson);
      }
    } catch (error) {
      console.warn(`Could not load full results for share ${shareId}:`, error.message);
    }

    // Return public view of the analysis
    const response = {
      shareId: share.shareId,
      views: share.views,
      analysis: {
        id: share.analysis.id,
        targetUrl: share.analysis.targetUrl,
        type: share.analysis.type,
        status: share.analysis.status,
        summary: share.analysis.summary,
        createdAt: share.analysis.createdAt
      }
    };

    // Include aiReport for AI analyses
    if (share.analysis.type === 'ai-analysis' && share.analysis.aiReport) {
      response.analysis.aiReport = share.analysis.aiReport;
    }

    // Include full results if available
    if (fullResults) {
      response.results = fullResults;
    }

    // Add PDF URL if available
    response.pdfUrl = `/api/v1/analyses/${share.analysis.id}/pdf`;
    
    return Response.json(response);

  } catch (error) {
    console.error('Share retrieval error:', error);
    return Response.json({
      error: 'Failed to load shared analysis',
      message: error.message
    }, { status: 500 });
  }
}