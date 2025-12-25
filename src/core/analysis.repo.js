const { prisma, isDatabaseEnabled } = require('../../lib/prisma');
const { ulid } = require('ulid');

class AnalysisRepository {
  constructor() {
    this.prisma = prisma;
    this.isEnabled = isDatabaseEnabled;
    
    // Initiera direkt om databas är aktiverad
    if (this.isEnabled && this.prisma) {
      console.log('✅ Using Prisma singleton for database connection');
    } else if (!this.isEnabled) {
      console.log('📊 Database disabled (ENABLE_DATABASE not set)');
    }
  }

  async initialize() {
    // Initialization redan gjord i constructor via singleton
    if (this.isEnabled && this.prisma) {
      try {
        // Testa connection
        await this.prisma.$queryRaw`SELECT 1`;
        console.log('✅ Database connection verified');
      } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        this.isEnabled = false;
      }
    }
  }

  async create({ id, targetUrl, type, status = 'pending', summary = null }) {
    if (!this.isEnabled) return null;

    try {
      const analysis = await this.prisma.analysis.create({
        data: {
          id: id || ulid(),
          targetUrl,
          type,
          status,
          summary,
          schemaVersion: 1,
        },
      });
      
      console.log(`📝 Created analysis ${analysis.id} for ${targetUrl}`);
      return analysis;
    } catch (error) {
      console.error('Failed to create analysis:', error);
      return null;
    }
  }

  async updateStatus(id, status, summary = null) {
    if (!this.isEnabled) return null;

    try {
      const analysis = await this.prisma.analysis.update({
        where: { id },
        data: { 
          status,
          ...(summary && { summary }),
        },
      });
      
      console.log(`📝 Updated analysis ${id} status to ${status}`);
      return analysis;
    } catch (error) {
      console.error('Failed to update analysis:', error);
      return null;
    }
  }


  async getById(id) {
    if (!this.isEnabled) return null;

    try {
      const analysis = await this.prisma.analysis.findUnique({
        where: { id },
        include: {
          artifacts: true,
          shares: true,
        },
      });
      
      return analysis;
    } catch (error) {
      console.error('Failed to get analysis:', error);
      return null;
    }
  }

  async listHistory(targetUrl, limit = 10) {
    if (!this.isEnabled) return [];

    try {
      const analyses = await this.prisma.analysis.findMany({
        where: { targetUrl },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          artifacts: {
            select: {
              kind: true,
              sizeBytes: true,
            },
          },
        },
      });
      
      return analyses;
    } catch (error) {
      console.error('Failed to list history:', error);
      return [];
    }
  }

  async getRecent(type = null, limit = 20) {
    if (!this.isEnabled) return [];

    try {
      const where = type ? { type } : {};
      const analyses = await this.prisma.analysis.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          targetUrl: true,
          type: true,
          status: true,
          createdAt: true,
          summary: true,
        },
      });
      
      return analyses;
    } catch (error) {
      console.error('Failed to get recent analyses:', error);
      return [];
    }
  }

  // Spara/uppdatera results-json för en analys
  async setResults(analysisId, results) {
    // viktigt: results ska vara ett plain-objekt (utan BigInt/circular)
    return this.prisma.analysis.update({
      where: { id: analysisId },
      data: { summary: results }
    });
  }

  async cleanup() {
    if (this.prisma) {
      await this.prisma.$disconnect();
      console.log('📊 Disconnected from database');
    }
  }
}

module.exports = new AnalysisRepository();