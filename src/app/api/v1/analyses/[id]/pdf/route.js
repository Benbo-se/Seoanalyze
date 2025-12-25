// Next.js App Router API route for PDF generation
// Migrated from Live-Server/src/api/v1/pdf.routes.js

const analysisRepo = require('../../../../../../../src/core/analysis.repo');
const artifactStore = require('../../../../../../../src/core/artifact.store');
const pdfRenderer = require('../../../../../../../src/core/pdf.renderer');
const { prisma } = require('../../../../../../../lib/prisma');

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!analysisRepo.isEnabled) {
      return Response.json({
        error: 'Database not available',
        message: 'PDF generation requires database to be enabled'
      }, { status: 503 });
    }

    // Try AiAnalysis first, then fallback to Analysis
    let analysis = await prisma.aiAnalysis.findUnique({
      where: { id }
    });

    let isAiAnalysis = false;

    if (analysis) {
      isAiAnalysis = true;
      // AI Analysis - convert to Analysis-like format for PDF renderer
      if (analysis.status !== 'completed') {
        return Response.json({
          error: 'Analysis not ready',
          reason: 'not_completed',
          status: analysis.status
        }, { status: 409 });
      }
    } else {
      // Fallback to regular Analysis
      analysis = await analysisRepo.getById(id);
      if (!analysis) {
        return Response.json({
          error: 'Analysis not found',
          message: `No analysis found with ID: ${id}`
        }, { status: 404 });
      }
    }
    
    let pdfBuffer;
    let fullResults;

    if (isAiAnalysis) {
      // For AI Analysis, use aiReport directly
      fullResults = {
        score: analysis.aiReport?.score || 0,
        report: analysis.aiReport,
        targetUrl: analysis.targetUrl,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt
      };

      // Check if PDF already exists
      const existingPdfKey = artifactStore.generateKeyWithDate(id, 'ai-report', analysis.createdAt, 'pdf');
      pdfBuffer = await artifactStore.get(existingPdfKey);

      if (!pdfBuffer) {
        // Generate AI Analysis PDF
        const aiAnalysisForPdf = {
          id: analysis.id,
          targetUrl: analysis.targetUrl,
          type: 'ai-analysis',
          status: analysis.status,
          createdAt: analysis.createdAt,
          completedAt: analysis.completedAt
        };

        pdfBuffer = await pdfRenderer.renderAnalysisToPdf(aiAnalysisForPdf, fullResults);

        // Ensure pdfBuffer is a proper Buffer (fix JSON serialization issue)
        if (!Buffer.isBuffer(pdfBuffer)) {
          if (typeof pdfBuffer === 'object' && pdfBuffer !== null) {
            const bufferArray = Object.values(pdfBuffer);
            pdfBuffer = Buffer.from(bufferArray);
          }
        }

        console.log(`🖨️ Generated AI Analysis PDF for ${id} (${pdfBuffer.length} bytes)`);

        // Store PDF for future requests
        await artifactStore.put(existingPdfKey, pdfBuffer, 'application/pdf');
        console.log(`💾 Stored AI Analysis PDF for ${id}`);
      }
    } else {
      // Regular Analysis - existing logic
      const resultsKey = artifactStore.generateKeyWithDate(id, `${analysis.type}-results`, analysis.createdAt, 'json');
      const resultsJson = await artifactStore.get(resultsKey);

      if (!resultsJson) {
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

      // Check if PDF already exists
      const existingPdfKey = artifactStore.generateKeyWithDate(id, 'report', analysis.createdAt, 'pdf');
      pdfBuffer = await artifactStore.get(existingPdfKey);

      if (!pdfBuffer) {
        fullResults = JSON.parse(resultsJson);

        // Generate PDF
        pdfBuffer = await pdfRenderer.renderAnalysisToPdf(analysis, fullResults);
        console.log(`🖨️ Generated PDF for analysis ${id}, type: ${typeof pdfBuffer}, isBuffer: ${Buffer.isBuffer(pdfBuffer)}, length: ${pdfBuffer?.length}`);

        // Store PDF for future requests
        await artifactStore.put(existingPdfKey, pdfBuffer, 'application/pdf');
        console.log(`💾 Stored PDF for analysis ${id}`);
      }
    }
    
    // Ensure pdfBuffer is a proper Buffer
    if (!Buffer.isBuffer(pdfBuffer)) {
      // If it's JSON/serialized Buffer, try to reconstruct
      if (typeof pdfBuffer === 'object' && pdfBuffer !== null) {
        // Convert JSON Buffer back to Buffer
        const bufferArray = Object.values(pdfBuffer);
        pdfBuffer = Buffer.from(bufferArray);
      } else if (typeof pdfBuffer === 'string') {
        pdfBuffer = Buffer.from(pdfBuffer, 'base64');
      } else {
        throw new Error('Invalid PDF buffer format');
      }
    }
    
    // Return PDF as response
    const analysisType = isAiAnalysis ? 'ai-analysis' : analysis.type;
    const headers = new Headers({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="analys-${id}-${analysisType}.pdf"`,
      'Cache-Control': 'public, max-age=86400' // 24 hours
    });

    return new Response(pdfBuffer, { headers });
    
  } catch (error) {
    console.error(`PDF generation error for ${id}:`, error);
    return Response.json({ 
      error: 'PDF generation failed', 
      message: error.message 
    }, { status: 500 });
  }
}