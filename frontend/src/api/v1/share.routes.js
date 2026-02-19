const express = require('express');
const shareService = require('../../core/share.service');
const analysisRepo = require('../../core/analysis.repo');
const artifactStore = require('../../core/artifact.store');

const router = express.Router();

// Create share for an analysis
router.post('/analyses/:id/share', async (req, res) => {
  try {
    const { id } = req.params;
    const { expiresInDays = 90 } = req.body;
    
    if (!shareService.isEnabled) {
      return res.status(503).json({
        error: 'Share service not available',
        message: 'Share functionality requires database to be enabled'
      });
    }

    const share = await shareService.createShare(id, expiresInDays);
    const shareUrl = shareService.generateShareUrl(share.shareId);

    res.json({
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
      return res.status(404).json({
        error: 'Analysis not found',
        message: error.message
      });
    }
    
    if (error.message.includes('completed')) {
      return res.status(400).json({
        error: 'Analysis not ready',
        message: error.message
      });
    }

    console.error('Share creation error:', error);
    res.status(500).json({
      error: 'Share creation failed',
      message: error.message
    });
  }
});

// Get public share (without authentication)
router.get('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    if (!shareService.isEnabled) {
      return res.status(503).json({
        error: 'Share service not available'
      });
    }

    const share = await shareService.getShare(shareId);
    
    if (!share) {
      return res.status(404).json({
        error: 'Share not found',
        message: 'This share link may have expired or been disabled'
      });
    }

    // Get full results from artifacts
    const resultsKey = artifactStore.generateKey(
      share.analysis.id, 
      `${share.analysis.type}-results`, 
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

    // Include full results if available
    if (fullResults) {
      response.results = fullResults;
    }

    // Add PDF URL if available
    response.pdfUrl = `/api/v1/analyses/${share.analysis.id}/pdf`;
    
    res.json(response);

  } catch (error) {
    console.error('Share retrieval error:', error);
    res.status(500).json({
      error: 'Failed to load shared analysis',
      message: error.message
    });
  }
});

// List shares for an analysis (private endpoint)
router.get('/analyses/:id/shares', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!shareService.isEnabled) {
      return res.status(503).json({
        error: 'Share service not available'
      });
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

    res.json(response);

  } catch (error) {
    console.error('Share listing error:', error);
    res.status(500).json({
      error: 'Failed to list shares',
      message: error.message
    });
  }
});

// Disable a share
router.delete('/share/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    if (!shareService.isEnabled) {
      return res.status(503).json({
        error: 'Share service not available'
      });
    }

    await shareService.disableShare(shareId);
    
    res.json({
      message: 'Share disabled successfully',
      shareId
    });

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Share not found',
        message: error.message
      });
    }

    console.error('Share deletion error:', error);
    res.status(500).json({
      error: 'Failed to disable share',
      message: error.message
    });
  }
});

module.exports = router;