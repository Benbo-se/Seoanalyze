const dns = require('dns').promises;

/**
 * Analyzes DNS security records (SPF, DMARC, MX)
 * Checks email deliverability and anti-phishing protection
 */
class DNSAnalyzer {
  
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Analyze DNS security for a domain
   * @param {string} domain - Domain to analyze (without protocol)
   * @param {boolean} useCache - Whether to use cache (default: true)
   * @returns {Object} DNS analysis results
   */
  static async analyzeDNSSecurity(domain, useCache = true) {
    const analyzer = new DNSAnalyzer();
    return analyzer.checkDNSSecurity(domain, useCache);
  }

  /**
   * Check DNS security records with caching and timeout
   */
  async checkDNSSecurity(domain, useCache = true) {
    const cacheKey = `dns:${domain}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    const results = {
      domain,
      spf: { present: false, valid: false, record: null, issues: [] },
      dmarc: { present: false, valid: false, record: null, issues: [] },
      mx: { present: false, valid: false, records: [], issues: [] },
      score: 0,
      grade: '',
      issues: [],
      recommendations: []
    };

    try {
      // Check all DNS records with 5s timeout each
      const [spfResult, dmarcResult, mxResult] = await Promise.allSettled([
        this.checkSPF(domain),
        this.checkDMARC(domain),
        this.checkMX(domain)
      ]);

      // Process SPF results
      if (spfResult.status === 'fulfilled') {
        results.spf = spfResult.value;
      } else {
        results.spf.issues.push(`SPF lookup failed: ${spfResult.reason?.message || 'Unknown error'}`);
      }

      // Process DMARC results
      if (dmarcResult.status === 'fulfilled') {
        results.dmarc = dmarcResult.value;
      } else {
        results.dmarc.issues.push(`DMARC lookup failed: ${dmarcResult.reason?.message || 'Unknown error'}`);
      }

      // Process MX results
      if (mxResult.status === 'fulfilled') {
        results.mx = mxResult.value;
      } else {
        results.mx.issues.push(`MX lookup failed: ${mxResult.reason?.message || 'Unknown error'}`);
      }

      // Calculate score and grade
      results.score = this.calculateDNSScore(results);
      results.grade = this.getDNSGrade(results.score);
      
      // Generate issues and recommendations
      results.issues = this.getDNSIssues(results);
      results.recommendations = this.getDNSRecommendations(results, domain);

      // Cache results
      if (useCache) {
        this.cache.set(cacheKey, {
          data: results,
          timestamp: Date.now()
        });
        
        // Auto-cleanup cache after timeout
        setTimeout(() => {
          this.cache.delete(cacheKey);
        }, this.cacheTimeout);
      }

    } catch (error) {
      console.error('DNS analysis failed:', error);
      results.issues.push(`DNS analysis failed: ${error.message}`);
    }

    return results;
  }

  /**
   * Check SPF record
   */
  async checkSPF(domain) {
    const result = { present: false, valid: false, record: null, issues: [] };
    
    try {
      // Set 5s timeout for DNS query
      const txtRecords = await Promise.race([
        dns.resolveTxt(domain),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DNS timeout')), 5000)
        )
      ]);
      
      // Find SPF record
      const spfRecord = txtRecords
        .flat()
        .find(record => record.startsWith('v=spf1'));
      
      if (spfRecord) {
        result.present = true;
        result.record = spfRecord;
        result.valid = this.validateSPF(spfRecord);
        if (!result.valid) {
          result.issues.push('SPF record has validation issues');
        }
      } else {
        result.issues.push('No SPF record found');
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        result.issues.push('Domain not found');
      } else if (error.code === 'ENODATA') {
        result.issues.push('No TXT records found');
      } else {
        result.issues.push(`SPF lookup error: ${error.message}`);
      }
    }
    
    return result;
  }

  /**
   * Check DMARC record
   */
  async checkDMARC(domain) {
    const result = { present: false, valid: false, record: null, issues: [] };
    const dmarcDomain = `_dmarc.${domain}`;
    
    try {
      const txtRecords = await Promise.race([
        dns.resolveTxt(dmarcDomain),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DNS timeout')), 5000)
        )
      ]);
      
      // Find DMARC record
      const dmarcRecord = txtRecords
        .flat()
        .find(record => record.startsWith('v=DMARC1'));
      
      if (dmarcRecord) {
        result.present = true;
        result.record = dmarcRecord;
        result.valid = this.validateDMARC(dmarcRecord);
        if (!result.valid) {
          result.issues.push('DMARC record has validation issues');
        }
      } else {
        result.issues.push('No DMARC record found');
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        result.issues.push('DMARC subdomain not found');
      } else if (error.code === 'ENODATA') {
        result.issues.push('No DMARC TXT record found');
      } else {
        result.issues.push(`DMARC lookup error: ${error.message}`);
      }
    }
    
    return result;
  }

  /**
   * Check MX records
   */
  async checkMX(domain) {
    const result = { present: false, valid: false, records: [], issues: [] };
    
    try {
      const mxRecords = await Promise.race([
        dns.resolveMx(domain),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('DNS timeout')), 5000)
        )
      ]);
      
      if (mxRecords && mxRecords.length > 0) {
        result.present = true;
        result.records = mxRecords.map(mx => ({
          exchange: mx.exchange,
          priority: mx.priority
        }));
        result.valid = true; // MX records are valid if they exist and resolve
      } else {
        result.issues.push('No MX records found');
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        result.issues.push('Domain not found');
      } else if (error.code === 'ENODATA') {
        result.issues.push('No MX records configured');
      } else {
        result.issues.push(`MX lookup error: ${error.message}`);
      }
    }
    
    return result;
  }

  /**
   * Validate SPF record syntax and content
   */
  validateSPF(spfRecord) {
    // Basic SPF validation
    if (!spfRecord.startsWith('v=spf1')) return false;
    
    // Check for valid mechanisms
    const validMechanisms = ['all', 'include:', 'a', 'mx', 'ptr', 'exists:', 'ip4:', 'ip6:'];
    const mechanisms = spfRecord.split(' ').slice(1); // Skip v=spf1
    
    let hasValidMechanism = false;
    for (const mechanism of mechanisms) {
      const isValid = validMechanisms.some(valid => 
        mechanism === valid || mechanism.startsWith(valid)
      );
      if (isValid) {
        hasValidMechanism = true;
        break;
      }
    }
    
    return hasValidMechanism;
  }

  /**
   * Validate DMARC record syntax and content
   */
  validateDMARC(dmarcRecord) {
    // Basic DMARC validation
    if (!dmarcRecord.startsWith('v=DMARC1')) return false;
    
    // Check for required policy
    const hasPolicy = dmarcRecord.includes('p=none') || 
                     dmarcRecord.includes('p=quarantine') || 
                     dmarcRecord.includes('p=reject');
    
    return hasPolicy;
  }

  /**
   * Calculate DNS security score
   */
  calculateDNSScore(results) {
    let score = 0;
    
    // SPF (40 points)
    if (results.spf.present) {
      score += 20;
      if (results.spf.valid) score += 20;
    }
    
    // DMARC (40 points)
    if (results.dmarc.present) {
      score += 20;
      if (results.dmarc.valid) score += 20;
    }
    
    // MX (20 points)
    if (results.mx.present) {
      score += 10;
      if (results.mx.valid) score += 10;
    }
    
    return Math.min(score, 100);
  }

  /**
   * Get DNS security grade
   */
  getDNSGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate DNS issues list
   */
  getDNSIssues(results) {
    const issues = [];
    
    if (!results.spf.present) {
      issues.push('Missing SPF record - emails may be marked as spam');
    } else if (!results.spf.valid) {
      issues.push('SPF record has syntax errors');
    }
    
    if (!results.dmarc.present) {
      issues.push('Missing DMARC record - no email authentication policy');
    } else if (!results.dmarc.valid) {
      issues.push('DMARC record has syntax errors');
    }
    
    if (!results.mx.present) {
      issues.push('Missing MX records - cannot receive email');
    }
    
    return issues;
  }

  /**
   * Generate DNS recommendations
   */
  getDNSRecommendations(results, domain) {
    const recommendations = [];
    
    if (!results.spf.present) {
      recommendations.push({
        issue: 'Missing SPF record',
        fix: 'Add SPF record to prevent email spoofing',
        code: `TXT record for ${domain}:\nv=spf1 include:_spf.google.com ~all`
      });
    }
    
    if (!results.dmarc.present) {
      recommendations.push({
        issue: 'Missing DMARC record',
        fix: 'Add DMARC record for email authentication',
        code: `TXT record for _dmarc.${domain}:\nv=DMARC1; p=quarantine; rua=mailto:admin@${domain}`
      });
    }
    
    return recommendations;
  }

  /**
   * Generate DNS issues for Fix This panel
   */
  static generateDNSIssues(dnsAnalysis, targetUrl) {
    const issues = [];
    const domain = new URL(targetUrl).hostname;
    
    if (!dnsAnalysis.spf.present) {
      issues.push({
        id: `dns-spf-missing`,
        title: 'Saknar SPF record',
        severity: 'important',
        description: 'SPF record saknas - emails kan markeras som spam',
        foundOn: [domain],
        howTo: [
          'Lägg till SPF TXT record i DNS',
          'Inkludera alla legitima email-servrar',
          'Använd ~all för soft fail eller -all för hard fail',
          'Testa SPF record med online verktyg'
        ],
        links: [
          {
            label: 'SPF Record Syntax',
            url: 'https://dmarcian.com/spf-syntax-table/'
          },
          {
            label: 'SPF Record Test',
            url: 'https://www.kitterman.com/spf/validate.html'
          }
        ],
        quickFixes: [
          {
            label: 'Grundläggande SPF record',
            snippet: `TXT record för ${domain}:\nv=spf1 include:_spf.google.com ~all`
          }
        ],
        status: 'open'
      });
    }
    
    if (!dnsAnalysis.dmarc.present) {
      issues.push({
        id: `dns-dmarc-missing`,
        title: 'Saknar DMARC record',
        severity: 'important',
        description: 'DMARC record saknas - ingen email authentication policy',
        foundOn: [domain],
        howTo: [
          'Lägg till DMARC TXT record för _dmarc subdomain',
          'Starta med p=none för monitoring',
          'Konfigurera rapporter med rua parameter',
          'Eskalera gradvis till p=quarantine eller p=reject'
        ],
        links: [
          {
            label: 'DMARC Guide',
            url: 'https://dmarc.org/overview/'
          },
          {
            label: 'DMARC Record Generator',
            url: 'https://dmarcian.com/dmarc-record-wizard/'
          }
        ],
        quickFixes: [
          {
            label: 'Grundläggande DMARC record',
            snippet: `TXT record för _dmarc.${domain}:\nv=DMARC1; p=quarantine; rua=mailto:admin@${domain}`
          }
        ],
        status: 'open'
      });
    }
    
    return issues;
  }
}

module.exports = DNSAnalyzer;