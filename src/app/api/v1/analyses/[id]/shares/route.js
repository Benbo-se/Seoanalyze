// Next.js App Router API route for listing analysis shares
// Migrated from Live-Server/src/api/v1/share.routes.js

const shareService = require('../../../../../../../src/core/share.service');

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    // Ensure share service is initialized
    await shareService.ensureInitialized();
    
    if (!shareService.isEnabled) {
      return Response.json({
        error: 'Share service not available'
      }, { status: 503 });
    }

    const shares = await shareService.listShares(id);
    
    const response = shares.map(share => ({
      shareId: share.shareId,
      shareUrl: shareService.generateShareUrl(share.shareId),
      views: share.views,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
      isEnabled: share.isEnabled
    }));

    return Response.json(response);

  } catch (error) {
    console.error('Share listing error:', error);
    return Response.json({
      error: 'Failed to list shares',
      message: error.message
    }, { status: 500 });
  }
}