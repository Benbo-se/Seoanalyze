const express = require('express');
const analysisRepo = require('../../core/analysis.repo');
const artifactStore = require('../../core/artifact.store');
const pdfRenderer = require('../../core/pdf.renderer');

const router = express.Router();

// Generate PDF for an analysis
router.get('/analyses/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!analysisRepo.isEnabled) {
      return res.status(503).json({
        error: 'Database not available',
        message: 'PDF generation requires database to be enabled'
      });
    }
    
    // Get analysis from database
    const analysis = await analysisRepo.getById(id);
    if (!analysis) {
      return res.status(404).json({
        error: 'Analysis not found',
        message: `No analysis found with ID: ${id}`
      });
    }
    
    if (analysis.status !== 'completed') {
      return res.status(400).json({
        error: 'Analysis not completed',
        message: 'PDF can only be generated for completed analyses'
      });
    }
    
    // Check if PDF already exists
    const existingPdfKey = artifactStore.generateKey(id, 'report', 'pdf');
    let pdfBuffer = null;
    
    try {
      const existingPdf = await artifactStore.get(existingPdfKey);
      if (existingPdf) {
        console.log(`📄 Serving cached PDF for analysis ${id}`);
        // If existingPdf is already a Buffer, use it directly
        // If it's a JSON array (wrong format), regenerate
        if (Buffer.isBuffer(existingPdf)) {
          pdfBuffer = existingPdf;
        } else if (typeof existingPdf === 'string') {
          // Try to parse as base64 or regenerate
          try {
            pdfBuffer = Buffer.from(existingPdf, 'base64');
          } catch {
            console.log(`🔄 Cached PDF in wrong format, regenerating for ${id}`);
          }
        } else {
          console.log(`🔄 Cached PDF in wrong format, regenerating for ${id}`);
        }
      }
    } catch (error) {
      // PDF doesn't exist, we'll generate it
      console.log(`🆕 No cached PDF found for analysis ${id}, generating new one`);
    }
    
    // Generate PDF if not cached
    if (!pdfBuffer) {
      // Get full results from artifacts
      const resultsKey = artifactStore.generateKey(id, `${analysis.type}-results`, 'json');
      const fullResultsJson = await artifactStore.get(resultsKey);
      
      if (!fullResultsJson) {
        return res.status(404).json({
          error: 'Results not found',
          message: 'Analysis results are not available for PDF generation'
        });
      }
      
      const fullResults = JSON.parse(fullResultsJson);
      
      // Generate PDF
      pdfBuffer = await pdfRenderer.renderAnalysisToPdf(analysis, fullResults);
      
      // Cache the PDF for future requests
      await artifactStore.put(existingPdfKey, pdfBuffer, 'application/pdf');
      
      console.log(`💾 Cached PDF for analysis ${id} (${pdfBuffer.length} bytes)`);
    }
    
    // Set response headers for PDF
    const filename = `seo-analysis-${analysis.targetUrl.replace(/[^a-zA-Z0-9]/g, '-')}-${id.slice(-8)}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send PDF
    res.send(pdfBuffer);
    
    console.log(`📤 Served PDF for analysis ${id} (${pdfBuffer.length} bytes)`);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: 'PDF generation failed',
      message: error.message
    });
  }
});

module.exports = router;