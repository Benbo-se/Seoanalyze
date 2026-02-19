// RUM Service - Hantera Real User Metrics data
// Integrerar Field data med Lab data för komplett analys

const { prisma } = require('./prisma');

class RumService {
  
  // Hämta RUM statistik för en URL
  async getRumStats(url, days = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      
      const rumEvents = await prisma.rumEvent.findMany({
        where: {
          url: url,
          timestamp: {
            gte: since
          }
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 1000
      });
      
      if (rumEvents.length === 0) {
        return null;
      }
      
      // Beräkna percentiler för Core Web Vitals
      const lcpValues = rumEvents.filter(e => e.lcp).map(e => e.lcp).sort((a, b) => a - b);
      const clsValues = rumEvents.filter(e => e.cls).map(e => e.cls).sort((a, b) => a - b);
      const inpValues = rumEvents.filter(e => e.inp).map(e => e.inp).sort((a, b) => a - b);
      
      const percentile = (arr, p) => {
        if (arr.length === 0) return null;
        const index = Math.ceil(arr.length * p / 100) - 1;
        return arr[Math.max(0, index)];
      };
      
      return {
        url,
        period: `${days} days`,
        samples: rumEvents.length,
        lastUpdated: rumEvents[0]?.timestamp,
        coreWebVitals: {
          lcp: {
            samples: lcpValues.length,
            p50: percentile(lcpValues, 50),
            p75: percentile(lcpValues, 75),
            p95: percentile(lcpValues, 95)
          },
          cls: {
            samples: clsValues.length,
            p50: percentile(clsValues, 50),
            p75: percentile(clsValues, 75),
            p95: percentile(clsValues, 95)
          },
          inp: {
            samples: inpValues.length,
            p50: percentile(inpValues, 50),
            p75: percentile(inpValues, 75),
            p95: percentile(inpValues, 95)
          }
        }
      };
      
    } catch (error) {
      console.error('RUM stats error:', error);
      return null;
    }
  }
  
  // Jämför Lab vs Field data för Core Web Vitals
  compareLabVsField(labData, fieldData) {
    if (!fieldData) {
      return {
        hasFieldData: false,
        message: 'Ingen Field data tillgänglig än. RUM SDK kommer samla data över tid.'
      };
    }
    
    const comparison = {
      hasFieldData: true,
      samples: fieldData.samples,
      period: fieldData.period,
      metrics: {}
    };
    
    // LCP jämförelse (Lab vs Field P75)
    if (labData.lcp && fieldData.coreWebVitals.lcp.p75) {
      const labLcp = labData.lcp;
      const fieldLcp = fieldData.coreWebVitals.lcp.p75;
      const diff = fieldLcp - labLcp;
      const diffPercent = ((diff / labLcp) * 100).toFixed(1);
      
      comparison.metrics.lcp = {
        lab: labLcp,
        field: fieldLcp,
        difference: diff,
        differencePercent: diffPercent,
        insight: this.getLcpInsight(labLcp, fieldLcp, diff)
      };
    }
    
    // CLS jämförelse (Lab vs Field P75)
    if (labData.cls !== undefined && fieldData.coreWebVitals.cls.p75 !== null) {
      const labCls = labData.cls;
      const fieldCls = fieldData.coreWebVitals.cls.p75;
      const diff = fieldCls - labCls;
      
      comparison.metrics.cls = {
        lab: labCls,
        field: fieldCls,
        difference: diff,
        insight: this.getClsInsight(labCls, fieldCls, diff)
      };
    }
    
    // INP information (endast field data)
    if (fieldData.coreWebVitals.inp.p75) {
      comparison.metrics.inp = {
        field: fieldData.coreWebVitals.inp.p75,
        insight: this.getInpInsight(fieldData.coreWebVitals.inp.p75)
      };
    }
    
    return comparison;
  }
  
  getLcpInsight(lab, field, diff) {
    if (Math.abs(diff) < 200) {
      return 'Lab och Field data stämmer bra överens. Bra jobbat!';
    } else if (diff > 0) {
      return `Field data visar ${Math.round(diff)}ms långsammare LCP än Lab. Undersök verkliga nätverksförhållanden.`;
    } else {
      return `Field data visar ${Math.round(Math.abs(diff))}ms snabbare LCP än Lab. Möjliga orsaker: caching eller testmiljö skillnader.`;
    }
  }
  
  getClsInsight(lab, field, diff) {
    if (Math.abs(diff) < 0.05) {
      return 'Lab och Field CLS stämmer bra överens.';
    } else if (diff > 0) {
      return `Field data visar högre CLS (+${diff.toFixed(3)}). Undersök layout shifts på riktiga enheter.`;
    } else {
      return `Field data visar lägre CLS (${diff.toFixed(3)}). Lab miljön kan vara mer känslig.`;
    }
  }
  
  getInpInsight(inp) {
    if (inp < 200) {
      return 'Utmärkt responsivitet (INP < 200ms)';
    } else if (inp < 500) {
      return 'Acceptabel responsivitet (INP < 500ms)';
    } else {
      return `Långsam responsivitet (INP: ${Math.round(inp)}ms). Optimera JavaScript interaktioner.`;
    }
  }
  
  // Generera RUM insikter för SEO rapporten
  async generateRumInsights(url, labData) {
    const rumStats = await this.getRumStats(url);
    const comparison = this.compareLabVsField(labData, rumStats);
    
    return {
      rumStats,
      labVsField: comparison,
      recommendations: this.generateRecommendations(comparison)
    };
  }
  
  generateRecommendations(comparison) {
    const recommendations = [];
    
    if (!comparison.hasFieldData) {
      recommendations.push({
        priority: 'info',
        title: 'Aktivera Real User Metrics',
        description: 'RUM SDK är nu installerat och kommer samla verklig prestanda-data från användare.',
        action: 'Vänta 24-48 timmar för första Field data.'
      });
      return recommendations;
    }
    
    // LCP rekommendationer baserat på Lab vs Field
    if (comparison.metrics.lcp?.difference > 500) {
      recommendations.push({
        priority: 'high',
        title: 'Field LCP betydligt långsammare än Lab',
        description: `Verkliga användare upplever ${Math.round(comparison.metrics.lcp.difference)}ms långsammare LCP.`,
        action: 'Optimera för verkliga nätverksförhållanden: CDN, bildoptimering, server responstid.'
      });
    }
    
    // CLS rekommendationer
    if (comparison.metrics.cls?.difference > 0.1) {
      recommendations.push({
        priority: 'high',
        title: 'Field CLS sämre än Lab',
        description: `Verkliga användare upplever mer layout shift (+${comparison.metrics.cls.difference.toFixed(3)}).`,
        action: 'Testa på olika enheter och nätverkshastigheter. Sätt dimensioner på bilder och annonser.'
      });
    }
    
    // INP rekommendationer
    if (comparison.metrics.inp?.field > 500) {
      recommendations.push({
        priority: 'medium',
        title: 'Långsam interaktionsrespons',
        description: `INP är ${Math.round(comparison.metrics.inp.field)}ms (mål: <200ms).`,
        action: 'Optimera JavaScript execution time, använd debouncing, dela upp långa tasks.'
      });
    }
    
    return recommendations;
  }
}

module.exports = new RumService();