// Next.js App Router API route for creating shares
// Migrated from Live-Server/src/api/v1/share.routes.js

const shareService = require('../../../../../../../src/core/share.service');

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { expiresInDays = 90 } = body;
    
    // Ensure share service is initialized
    await shareService.ensureInitialized();
    
    if (!shareService.isEnabled) {
      return Response.json({
        error: 'Share service not available',
        message: 'Share functionality requires database to be enabled'
      }, { status: 503 });
    }

    const share = await shareService.createShare(id, expiresInDays);
    const shareUrl = shareService.generateShareUrl(share.shareId);

    return Response.json({
      shareId: share.shareId,
      shareUrl,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
      analysis: {
        targetUrl: share.analysis.targetUrl,
        type: share.analysis.type,
        createdAt: share.analysis.createdAt
      }
    });

  } catch (error) {
    if (error.message.includes('not found')) {
      return Response.json({
        error: 'Analysis not found',
        message: error.message
      }, { status: 404 });
    }
    
    if (error.message.includes('completed')) {
      return Response.json({
        error: 'Analysis not ready',
        message: error.message
      }, { status: 400 });
    }

    console.error('Share creation error:', error);
    return Response.json({
      error: 'Share creation failed',
      message: error.message
    }, { status: 500 });
  }
}