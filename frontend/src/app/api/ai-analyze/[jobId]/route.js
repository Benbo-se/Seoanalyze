// API endpoint to fetch AI analysis results by jobId

const { prisma } = require('../../../../../lib/prisma');

export async function GET(request, { params }) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return Response.json({
        error: 'Job ID is required'
      }, { status: 400 });
    }

    // Fetch AI analysis from database
    const aiAnalysis = await prisma.aiAnalysis.findUnique({
      where: { id: jobId }
    });

    if (!aiAnalysis) {
      return Response.json({
        error: 'Analysis not found',
        message: 'No analysis found with this ID'
      }, { status: 404 });
    }

    // Return full analysis data
    return Response.json({
      id: aiAnalysis.id,
      targetUrl: aiAnalysis.targetUrl,
      status: aiAnalysis.status,
      progress: aiAnalysis.progress,
      userAnalysisId: aiAnalysis.userAnalysisId,
      userLighthouseId: aiAnalysis.userLighthouseId,
      competitors: aiAnalysis.competitors,
      competitorData: aiAnalysis.competitorData,
      aiReport: aiAnalysis.aiReport,
      createdAt: aiAnalysis.createdAt,
      completedAt: aiAnalysis.completedAt,
      error: aiAnalysis.error
    });

  } catch (error) {
    console.error('Failed to fetch AI analysis:', error);
    return Response.json({
      error: 'Failed to fetch analysis',
      message: error.message
    }, { status: 500 });
  }
}
