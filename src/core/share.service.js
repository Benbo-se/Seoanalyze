const { ulid } = require('ulid');
const analysisRepo = require('./analysis.repo');
const prisma = require('../../lib/prisma');

class ShareService {
  constructor() {
    this.prisma = null;
    this.isEnabled = false;
  }

  async initialize() {
    if (analysisRepo.isEnabled) {
      this.prisma = prisma.prisma;  // Get the actual Prisma client
      this.isEnabled = true;
      console.log('✅ Share service initialized');
    } else {
      console.log('📊 Share service disabled (database not available)');
    }
  }

  async ensureInitialized() {
    if (!this.isEnabled && analysisRepo.isEnabled) {
      await this.initialize();
    }
  }

  async createShare(analysisId, expiresInDays = 90) {
    await this.ensureInitialized();

    if (!this.isEnabled) {
      throw new Error('Share service not available - database required');
    }

    try {
      // Try AiAnalysis first
      let analysis = await this.prisma.aiAnalysis.findUnique({
        where: { id: analysisId }
      });

      let isAiAnalysis = false;

      if (analysis) {
        isAiAnalysis = true;
        if (analysis.status !== 'completed') {
          throw new Error('Can only share completed analyses');
        }
      } else {
        // Fallback to regular Analysis
        analysis = await this.prisma.analysis.findUnique({
          where: { id: analysisId }
        });

        if (!analysis) {
          throw new Error('Analysis not found');
        }

        if (analysis.status !== 'completed') {
          throw new Error('Can only share completed analyses');
        }
      }

      // Generate unique share ID
      const shareId = ulid().toLowerCase();

      // Calculate expiration date
      const expiresAt = expiresInDays
        ? new Date(Date.now() + (expiresInDays * 24 * 60 * 60 * 1000))
        : null;

      // Create share record
      let share;
      if (isAiAnalysis) {
        share = await this.prisma.share.create({
          data: {
            aiAnalysisId: analysisId,
            shareId,
            isEnabled: true,
            expiresAt,
            views: 0
          }
        });

        // Manually attach aiAnalysis data (since Prisma include doesn't work across optional relations)
        share.analysis = {
          targetUrl: analysis.targetUrl,
          type: 'ai-analysis',
          createdAt: analysis.createdAt,
          summary: { score: analysis.aiReport?.score || 0 }
        };
      } else {
        share = await this.prisma.share.create({
          data: {
            analysisId,
            shareId,
            isEnabled: true,
            expiresAt,
            views: 0
          },
          include: {
            analysis: {
              select: {
                targetUrl: true,
                type: true,
                createdAt: true,
                summary: true
              }
            }
          }
        });
      }

      console.log(`🔗 Created share ${shareId} for ${isAiAnalysis ? 'AI analysis' : 'analysis'} ${analysisId}`);
      return share;

    } catch (error) {
      console.error('Failed to create share:', error);
      throw error;
    }
  }

  async getShare(shareId) {
    await this.ensureInitialized();

    if (!this.isEnabled) {
      return null;
    }

    try {
      const share = await this.prisma.share.findUnique({
        where: { shareId },
        include: {
          analysis: {
            include: {
              artifacts: true
            }
          }
        }
      });

      if (!share) {
        return null;
      }

      // Check if share is valid
      if (!share.isEnabled) {
        return null;
      }

      if (share.expiresAt && new Date() > share.expiresAt) {
        return null;
      }

      // If aiAnalysisId exists, fetch AI analysis data
      if (share.aiAnalysisId) {
        const aiAnalysis = await this.prisma.aiAnalysis.findUnique({
          where: { id: share.aiAnalysisId }
        });

        if (aiAnalysis) {
          share.analysis = {
            id: aiAnalysis.id,
            targetUrl: aiAnalysis.targetUrl,
            type: 'ai-analysis',
            status: aiAnalysis.status,
            createdAt: aiAnalysis.createdAt,
            completedAt: aiAnalysis.completedAt,
            summary: { score: aiAnalysis.aiReport?.score || 0 },
            aiReport: aiAnalysis.aiReport
          };
        }
      }

      // Increment view counter
      await this.prisma.share.update({
        where: { id: share.id },
        data: { views: share.views + 1 }
      });

      console.log(`👁️ Share ${shareId} viewed (total: ${share.views + 1})`);
      return share;

    } catch (error) {
      console.error('Failed to get share:', error);
      return null;
    }
  }

  async listShares(analysisId, isAiAnalysis = false) {
    await this.ensureInitialized();

    if (!this.isEnabled) {
      return [];
    }

    try {
      const whereClause = isAiAnalysis
        ? { aiAnalysisId: analysisId, isEnabled: true }
        : { analysisId, isEnabled: true };

      const shares = await this.prisma.share.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      });

      return shares;
    } catch (error) {
      console.error('Failed to list shares:', error);
      return [];
    }
  }

  async disableShare(shareId) {
    await this.ensureInitialized();
    
    if (!this.isEnabled) {
      throw new Error('Share service not available');
    }

    try {
      const share = await this.prisma.share.update({
        where: { shareId },
        data: { isEnabled: false }
      });

      console.log(`🚫 Disabled share ${shareId}`);
      return share;
    } catch (error) {
      console.error('Failed to disable share:', error);
      throw error;
    }
  }

  generateShareUrl(shareId, baseUrl = 'https://seoanalyze.se') {
    return `${baseUrl}/share/${shareId}`;
  }
}

const shareService = new ShareService();
module.exports = shareService;