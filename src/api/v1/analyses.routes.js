const express = require('express');
const analysisRepo = require('../../core/analysis.repo');
const artifactStore = require('../../core/artifact.store');

const router = express.Router();

// Get analysis by ID
router.get('/analyses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!analysisRepo.isEnabled) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Analysis retrieval requires database to be enabled'
      });
    }
    
    const analysis = await analysisRepo.getById(id);
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        message: `No analysis found with ID: ${id}`
      });
    }

    // Get full results if available
    let fullResults = null;
    if (analysis.status === 'completed') {
      try {
        const resultsKey = artifactStore.generateKeyWithDate(id, `${analysis.type}-results`, analysis.createdAt, 'json');
        const resultsJson = await artifactStore.get(resultsKey);
        if (resultsJson) {
          fullResults = JSON.parse(resultsJson);
        }
      } catch (error) {
        console.warn(`Could not load full results for analysis ${id}:`, error.message);
      }
    }

    // Transform crawl results to include expected technical data format
    let transformedResults = fullResults;
    if (analysis.type === 'crawl' && fullResults && fullResults.summary) {
      // Map crawl summary fields to expected frontend format
      const summary = fullResults.summary;

      transformedResults = {
        ...fullResults,
        technical: {
          sitemap: {
            present: Boolean(summary.sitemapFound)
          },
          robotsTxt: {
            present: Boolean(summary.robotsFound)
          }
        },
        sitemap: {
          present: Boolean(summary.sitemapFound)
        },
        robotsTxt: {
          present: Boolean(summary.robotsFound)
        }
      };
    }

    const response = {
      id: analysis.id,
      targetUrl: analysis.targetUrl,
      type: analysis.type,
      status: analysis.status,
      summary: analysis.summary,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
      results: transformedResults,
      shares: analysis.shares?.map(share => ({
        shareId: share.shareId,
        views: share.views,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        isEnabled: share.isEnabled
      })) || []
    };

    res.json(response);

  } catch (error) {
    console.error('Analysis retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: error.message
    });
  }
});

// Get recent analyses
router.get('/analyses', async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    
    if (!analysisRepo.isEnabled) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'Analysis listing requires database to be enabled'
      });
    }

    const analyses = await analysisRepo.getRecent(type || null, parseInt(limit));
    
    res.json(analyses);

  } catch (error) {
    console.error('Analysis listing error:', error);
    res.status(500).json({
      error: 'Failed to list analyses',
      message: error.message
    });
  }
});

// Get analysis history for a URL
router.get('/analyses/history/:encodedUrl', async (req, res) => {
  try {
    const { encodedUrl } = req.params;
    const { limit = 10 } = req.query;
    
    if (!analysisRepo.isEnabled) {
      return res.status(503).json({
        error: 'Database not available'
      });
    }

    const url = decodeURIComponent(encodedUrl);
    const history = await analysisRepo.listHistory(url, parseInt(limit));
    
    res.json(history);

  } catch (error) {
    console.error('Analysis history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis history',
      message: error.message
    });
  }
});

module.exports = router;