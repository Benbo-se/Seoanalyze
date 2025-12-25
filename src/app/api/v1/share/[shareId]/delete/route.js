// Next.js App Router API route for deleting shares
// Migrated from Live-Server/src/api/v1/share.routes.js

const shareService = require('../../../../../../../src/core/share.service');

export async function DELETE(request, { params }) {
  try {
    const { shareId } = await params;
    
    // Ensure share service is initialized
    await shareService.ensureInitialized();
    
    if (!shareService.isEnabled) {
      return Response.json({
        error: 'Share service not available'
      }, { status: 503 });
    }

    await shareService.disableShare(shareId);
    
    return Response.json({
      message: 'Share disabled successfully',
      shareId
    });

  } catch (error) {
    if (error.message.includes('not found')) {
      return Response.json({
        error: 'Share not found',
        message: error.message
      }, { status: 404 });
    }

    console.error('Share deletion error:', error);
    return Response.json({
      error: 'Failed to disable share',
      message: error.message
    }, { status: 500 });
  }
}