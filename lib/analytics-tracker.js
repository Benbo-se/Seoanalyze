const fs = require('fs').promises;
const path = require('path');

// Skapa analytics directory om den inte finns
const analyticsDir = process.env.ANALYTICS_DIR || path.join(__dirname, '..', 'analytics');

// Analytics data structure
let analyticsData = {
  domains: {
    'seoanalyze.se': {
      visitors: [],
      analyses: { seo: 0, crawl: 0, lighthouse: 0 },
      totalRequests: 0
    },
    'learningwithreda.com': {
      visitors: [],
      analyses: { seo: 0, crawl: 0, lighthouse: 0 },
      totalRequests: 0
    }
  },
  hourly: {},
  daily: {},
  topUrls: {},
  uniqueIPs: new Set(),
  startTime: new Date().toISOString()
};

// Initiera analytics
async function initAnalytics() {
  try {
    await fs.mkdir(analyticsDir, { recursive: true });
    
    // Försök ladda existerande data
    const dataFile = path.join(analyticsDir, 'analytics.json');
    try {
      const data = await fs.readFile(dataFile, 'utf8');
      const savedData = JSON.parse(data);
      
      // Återställ Set från array
      if (savedData.uniqueIPs) {
        savedData.uniqueIPs = new Set(savedData.uniqueIPs);
      }
      
      // Återställ Set för daily uniqueIPs
      if (savedData.daily) {
        Object.keys(savedData.daily).forEach(dayKey => {
          if (savedData.daily[dayKey].uniqueIPs) {
            savedData.daily[dayKey].uniqueIPs = new Set(savedData.daily[dayKey].uniqueIPs);
          }
        });
      }
      
      // Återställ Set för hourly uniqueIPs
      if (savedData.hourly) {
        Object.keys(savedData.hourly).forEach(hourKey => {
          if (savedData.hourly[hourKey].uniqueIPs) {
            savedData.hourly[hourKey].uniqueIPs = new Set(savedData.hourly[hourKey].uniqueIPs);
          }
        });
      }
      
      analyticsData = { ...analyticsData, ...savedData };
    } catch (error) {
      // Ingen existerande data, använd default
      console.log('📊 Starting fresh analytics tracking');
    }
  } catch (error) {
    console.error('Failed to initialize analytics:', error);
  }
}

// Spara analytics data
async function saveAnalytics() {
  try {
    const dataFile = path.join(analyticsDir, 'analytics.json');
    
    // Konvertera Set till array för JSON
    const saveData = {
      ...analyticsData,
      uniqueIPs: Array.from(analyticsData.uniqueIPs),
      daily: {},
      hourly: {}
    };
    
    // Konvertera daily uniqueIPs Sets till arrays
    Object.keys(analyticsData.daily).forEach(dayKey => {
      saveData.daily[dayKey] = {
        ...analyticsData.daily[dayKey],
        uniqueIPs: Array.from(analyticsData.daily[dayKey].uniqueIPs)
      };
    });
    
    // Konvertera hourly uniqueIPs Sets till arrays
    Object.keys(analyticsData.hourly).forEach(hourKey => {
      saveData.hourly[hourKey] = {
        ...analyticsData.hourly[hourKey],
        uniqueIPs: Array.from(analyticsData.hourly[hourKey].uniqueIPs)
      };
    });
    
    await fs.writeFile(dataFile, JSON.stringify(saveData, null, 2));
  } catch (error) {
    console.error('Failed to save analytics:', error);
  }
}

// Adapter för Next.js Request objekt
function getHeaderValue(req, header) {
  // Om det är Next.js Request objekt
  if (req.headers && typeof req.headers.get === 'function') {
    return req.headers.get(header);
  }
  // Om det är Express req objekt
  if (typeof req.get === 'function') {
    return req.get(header);
  }
  // Fallback för vanliga headers
  return req.headers?.[header] || null;
}

// Tracka besökare
function trackVisitor(req, analysisType, requestData = {}) {
  try {
    // Hantera både Express och Next.js Request
    const ip = getHeaderValue(req, 'x-real-ip') || 
               getHeaderValue(req, 'x-forwarded-for')?.split(',')[0] || 
               req.ip || 'unknown';
    const host = getHeaderValue(req, 'host') || 'unknown';
    const domain = host.split(':')[0]; // Ta bort port
    // För Next.js skickas data separat, för Express från req.body
    const url = requestData.url || req.body?.url || 'unknown';
    const userAgent = getHeaderValue(req, 'user-agent') || 'unknown';
    const timestamp = new Date();
    
    // Lägg till unik IP
    analyticsData.uniqueIPs.add(ip);
    
    // Domän-specifik tracking
    const domainKey = domain.includes('seoanalyze') ? 'seoanalyze.se' : 'learningwithreda.com';
    if (analyticsData.domains[domainKey]) {
      // Lägg till besökare
      analyticsData.domains[domainKey].visitors.push({
        ip,
        timestamp: timestamp.toISOString(),
        analysisType,
        url,
        userAgent: userAgent.substring(0, 100) // Begränsa längd
      });
      
      // Öka räknare
      analyticsData.domains[domainKey].analyses[analysisType]++;
      analyticsData.domains[domainKey].totalRequests++;
    }
    
    // Hourly stats
    const hourKey = timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
    if (!analyticsData.hourly[hourKey]) {
      analyticsData.hourly[hourKey] = {
        seo: 0, crawl: 0, lighthouse: 0, total: 0, uniqueIPs: new Set()
      };
    }
    analyticsData.hourly[hourKey][analysisType]++;
    analyticsData.hourly[hourKey].total++;
    analyticsData.hourly[hourKey].uniqueIPs.add(ip);
    
    // Daily stats
    const dayKey = timestamp.toISOString().substring(0, 10); // YYYY-MM-DD
    if (!analyticsData.daily[dayKey]) {
      analyticsData.daily[dayKey] = {
        seo: 0, crawl: 0, lighthouse: 0, total: 0, uniqueIPs: new Set()
      };
    }
    analyticsData.daily[dayKey][analysisType]++;
    analyticsData.daily[dayKey].total++;
    analyticsData.daily[dayKey].uniqueIPs.add(ip);
    
    // Top URLs
    if (!analyticsData.topUrls[url]) {
      analyticsData.topUrls[url] = 0;
    }
    analyticsData.topUrls[url]++;
    
    // Spara var 10:e request
    if (analyticsData.domains[domainKey].totalRequests % 10 === 0) {
      saveAnalytics();
    }
    
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

// Hämta statistik
function getAnalytics(timeRange = 'all') {
  try {
    const now = new Date();
    const stats = {
      summary: {
        totalUniqueVisitors: analyticsData.uniqueIPs.size,
        uptime: now - new Date(analyticsData.startTime),
        domains: {}
      },
      hourly: {},
      daily: {},
      topUrls: [],
      recentVisitors: []
    };
    
    // Domän-sammanfattning
    for (const [domain, data] of Object.entries(analyticsData.domains)) {
      stats.summary.domains[domain] = {
        totalRequests: data.totalRequests,
        analyses: data.analyses,
        uniqueVisitors: new Set(data.visitors.map(v => v.ip)).size,
        percentageOfTotal: Math.round((data.totalRequests / 
          (analyticsData.domains['seoanalyze.se'].totalRequests + 
           analyticsData.domains['learningwithreda.com'].totalRequests) || 1) * 100)
      };
    }
    
    // Konvertera hourly stats (senaste 48 timmar)
    const hours48Ago = new Date(now - 48 * 60 * 60 * 1000);
    for (const [hour, data] of Object.entries(analyticsData.hourly)) {
      if (new Date(hour) > hours48Ago) {
        stats.hourly[hour] = {
          ...data,
          uniqueIPs: data.uniqueIPs.size
        };
      }
    }
    
    // Konvertera daily stats (senaste 30 dagar)
    const days30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000);
    for (const [day, data] of Object.entries(analyticsData.daily)) {
      if (new Date(day) > days30Ago) {
        stats.daily[day] = {
          ...data,
          uniqueIPs: data.uniqueIPs.size
        };
      }
    }
    
    // Top 10 URLs
    stats.topUrls = Object.entries(analyticsData.topUrls)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([url, count]) => ({ url, count }));
    
    // Senaste 20 besökare (från båda domäner)
    const allVisitors = [
      ...analyticsData.domains['seoanalyze.se'].visitors.map(v => ({...v, domain: 'seoanalyze.se'})),
      ...analyticsData.domains['learningwithreda.com'].visitors.map(v => ({...v, domain: 'learningwithreda.com'}))
    ];
    stats.recentVisitors = allVisitors
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 20);
    
    return stats;
  } catch (error) {
    console.error('Get analytics error:', error);
    return null;
  }
}

// Auto-save varje 5 minuter
setInterval(saveAnalytics, 5 * 60 * 1000);

// Initiera vid start
initAnalytics();

module.exports = {
  trackVisitor,
  getAnalytics,
  saveAnalytics
};