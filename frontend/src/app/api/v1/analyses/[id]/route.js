// Next.js App Router API route for analyses by ID
// Migrated from Live-Server/src/api/v1/analyses.routes.js

const analysisRepo = require('../../../../../../src/core/analysis.repo');
const artifactStore = require('../../../../../../src/core/artifact.store');

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    
    if (!analysisRepo.isEnabled) {
      return Response.json({
        error: 'Database not available',
        message: 'Analysis retrieval requires database to be enabled'
      }, { status: 503 });
    }
    
    const analysis = await analysisRepo.getById(id);
    if (!analysis) {
      // SKEPTISK KONTROLL: Är detta ett giltigt ULID/job-ID som kan vara under skapelse?
      // Om det verkar vara ett valid ID-format men posten inte finns än -> returnera 202 med 'pending'
      // Detta stoppar race condition mellan POST-create och första SSR-fetch
      const isValidId = /^[0-9A-HJKMNP-TV-Z]{26}$/.test(id) || /^\d+$/.test(id);
      
      if (isValidId) {
        // Returnera 202 (Accepted) - jobbet kan vara under bearbetning även om DB-posten inte finns än
        return Response.json({
          id: id,
          targetUrl: null,
          type: 'unknown',
          status: 'pending',  // assumera pending tills vi vet mer
          summary: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          results: null,
          shares: []
        }, { 
          status: 202,
          headers: { 'Cache-Control': 'no-store' }
        }); // 202 = Accepted, pågående bearbetning
      }
      
      // Endast returnera 404 för uppenbart ogiltiga ID:n
      return Response.json({
        error: 'Analysis not found',
        message: `No analysis found with ID: ${id}`
      }, { 
        status: 404,
        headers: { 'Cache-Control': 'no-store' }
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

    // Strict mode: results måste komma från artifact
    const resultsData = fullResults;
    if (!resultsData) {
      if (analysis.status !== 'completed') {
        return Response.json({ 
          error: 'Analysis not ready',
          reason: 'not_completed',
          status: analysis.status 
        }, { status: 409 });
      }
      return Response.json({ 
        error: 'Results artifact missing', 
        reason: 'artifact_missing' 
      }, { status: 424 });
    }

    // Transform crawl results to include expected technical data format
    let transformedResults = resultsData;
    if (analysis.type === 'crawl' && resultsData && resultsData.summary) {
      // Map crawl summary fields to expected frontend format
      const summary = resultsData.summary;

      transformedResults = {
        ...resultsData,
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

    return Response.json(response, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Analysis retrieval error:', error);
    return Response.json({
      error: 'Failed to retrieve analysis',
      message: error.message
    }, { 
      status: 500,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}