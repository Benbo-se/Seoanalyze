const TextNormalizer = require('../src/utils/text-normalizer');

/**
 * Analyzes security headers from HTTP response
 * Provides scoring and recommendations for common security headers
 */
class SecurityAnalyzer {
  
  /**
   * Analyze security headers and return score + details
   * @param {Object} headers - HTTP response headers (lowercase keys)
   * @param {boolean} isHttps - Whether site uses HTTPS
   * @returns {Object} Security analysis with score and recommendations
   */
  static analyzeHeaders(headers, isHttps = false) {
    const analysis = {
      score: 0,
      maxScore: 100,
      grade: '',
      issues: [],
      recommendations: [],
      details: {}
    };

    // Define security header checks with weights
    const headerChecks = [
      {
        name: 'Strict-Transport-Security',
        header: 'strict-transport-security',
        weight: 25,
        requiresHttps: true,
        validator: this.validateHSTS.bind(this)
      },
      {
        name: 'Content-Security-Policy',
        header: 'content-security-policy',
        weight: 25,
        requiresHttps: false,
        validator: this.validateCSP.bind(this)
      },
      {
        name: 'X-Content-Type-Options',
        header: 'x-content-type-options',
        weight: 15,
        requiresHttps: false,
        validator: this.validateXContentType.bind(this)
      },
      {
        name: 'X-Frame-Options',
        header: 'x-frame-options',
        weight: 15,
        requiresHttps: false,
        validator: this.validateXFrame.bind(this)
      },
      {
        name: 'Referrer-Policy',
        header: 'referrer-policy',
        weight: 10,
        requiresHttps: false,
        validator: this.validateReferrer.bind(this)
      },
      {
        name: 'Permissions-Policy',
        header: 'permissions-policy',
        weight: 10,
        requiresHttps: false,
        validator: this.validatePermissions.bind(this)
      }
    ];

    let totalScore = 0;
    let applicableScore = 0;

    // Check each security header
    headerChecks.forEach(check => {
      const headerValue = headers[check.header];
      
      // Skip HSTS check if not HTTPS
      if (check.requiresHttps && !isHttps) {
        analysis.details[check.name] = {
          present: false,
          applicable: false,
          reason: 'Requires HTTPS',
          score: 0,
          weight: check.weight
        };
        return;
      }

      applicableScore += check.weight;
      const result = check.validator(headerValue, headers, isHttps);
      
      analysis.details[check.name] = {
        present: !!headerValue,
        value: headerValue,
        valid: result.valid,
        score: result.valid ? check.weight : 0,
        weight: check.weight,
        issues: result.issues,
        recommendations: result.recommendations
      };

      if (result.valid) {
        totalScore += check.weight;
      }

      // Collect issues and recommendations
      analysis.issues.push(...result.issues);
      analysis.recommendations.push(...result.recommendations);
    });

    // Calculate final score
    analysis.score = applicableScore > 0 ? Math.round((totalScore / applicableScore) * 100) : 0;
    analysis.maxScore = applicableScore;
    analysis.grade = this.getSecurityGrade(analysis.score);

    return analysis;
  }

  /**
   * Validate HSTS header
   */
  static validateHSTS(value, headers, isHttps) {
    const issues = [];
    const recommendations = [];

    if (!value) {
      issues.push('HSTS header missing - connections vulnerable to downgrade attacks');
      recommendations.push({
        issue: 'Missing HSTS',
        fix: 'Add Strict-Transport-Security header',
        code: 'Strict-Transport-Security: max-age=31536000; includeSubDomains'
      });
      return { valid: false, issues, recommendations };
    }

    // Check max-age
    const maxAgeMatch = value.match(/max-age=(\d+)/);
    if (!maxAgeMatch) {
      issues.push('HSTS missing max-age directive');
      return { valid: false, issues, recommendations };
    }

    const maxAge = parseInt(maxAgeMatch[1]);
    if (maxAge < 31536000) { // 1 year
      issues.push(`HSTS max-age too short (${maxAge}s, recommended: 31536000s)`);
    }

    // Check includeSubDomains
    if (!value.includes('includeSubDomains')) {
      recommendations.push({
        issue: 'HSTS could include subdomains',
        fix: 'Add includeSubDomains directive',
        code: 'Strict-Transport-Security: max-age=31536000; includeSubDomains'
      });
    }

    return { valid: issues.length === 0, issues, recommendations };
  }

  /**
   * Validate CSP header
   */
  static validateCSP(value, headers, isHttps) {
    const issues = [];
    const recommendations = [];

    if (!value) {
      issues.push('Content Security Policy missing - vulnerable to XSS attacks');
      recommendations.push({
        issue: 'Missing CSP',
        fix: 'Add Content-Security-Policy header',
        code: 'Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\''
      });
      return { valid: false, issues, recommendations };
    }

    // Check for dangerous directives
    if (value.includes('\'unsafe-eval\'')) {
      issues.push('CSP allows unsafe-eval - potential XSS risk');
    }

    if (value.includes('*') && !value.includes('data:')) {
      issues.push('CSP uses wildcards - consider more restrictive policy');
    }

    // Check for basic directives
    if (!value.includes('default-src') && !value.includes('script-src')) {
      issues.push('CSP missing script-src directive');
    }

    return { valid: issues.length === 0, issues, recommendations };
  }

  /**
   * Validate X-Content-Type-Options
   */
  static validateXContentType(value, headers, isHttps) {
    const issues = [];
    const recommendations = [];

    if (!value) {
      issues.push('X-Content-Type-Options missing - vulnerable to MIME sniffing');
      recommendations.push({
        issue: 'Missing X-Content-Type-Options',
        fix: 'Add X-Content-Type-Options header',
        code: 'X-Content-Type-Options: nosniff'
      });
      return { valid: false, issues, recommendations };
    }

    if (value.toLowerCase() !== 'nosniff') {
      issues.push(`Invalid X-Content-Type-Options value: ${value} (should be "nosniff")`);
      return { valid: false, issues, recommendations };
    }

    return { valid: true, issues, recommendations };
  }

  /**
   * Validate X-Frame-Options
   */
  static validateXFrame(value, headers, isHttps) {
    const issues = [];
    const recommendations = [];

    if (!value) {
      issues.push('X-Frame-Options missing - vulnerable to clickjacking');
      recommendations.push({
        issue: 'Missing X-Frame-Options',
        fix: 'Add X-Frame-Options header',
        code: 'X-Frame-Options: SAMEORIGIN'
      });
      return { valid: false, issues, recommendations };
    }

    const validValues = ['DENY', 'SAMEORIGIN'];
    if (!validValues.includes(value.toUpperCase()) && !value.toLowerCase().startsWith('allow-from')) {
      issues.push(`Invalid X-Frame-Options value: ${value}`);
      return { valid: false, issues, recommendations };
    }

    return { valid: true, issues, recommendations };
  }

  /**
   * Validate Referrer-Policy
   */
  static validateReferrer(value, headers, isHttps) {
    const issues = [];
    const recommendations = [];

    if (!value) {
      issues.push('Referrer-Policy missing - potential privacy leak');
      recommendations.push({
        issue: 'Missing Referrer-Policy',
        fix: 'Add Referrer-Policy header',
        code: 'Referrer-Policy: strict-origin-when-cross-origin'
      });
      return { valid: false, issues, recommendations };
    }

    const validPolicies = [
      'no-referrer', 'no-referrer-when-downgrade', 'origin',
      'origin-when-cross-origin', 'same-origin', 'strict-origin',
      'strict-origin-when-cross-origin', 'unsafe-url'
    ];

    if (!validPolicies.includes(value.toLowerCase())) {
      issues.push(`Invalid Referrer-Policy value: ${value}`);
      return { valid: false, issues, recommendations };
    }

    return { valid: true, issues, recommendations };
  }

  /**
   * Validate Permissions-Policy
   */
  static validatePermissions(value, headers, isHttps) {
    const issues = [];
    const recommendations = [];

    if (!value) {
      issues.push('Permissions-Policy missing - browser features not restricted');
      recommendations.push({
        issue: 'Missing Permissions-Policy',
        fix: 'Add Permissions-Policy header',
        code: 'Permissions-Policy: geolocation=(), microphone=(), camera=()'
      });
      return { valid: false, issues, recommendations };
    }

    // Basic validation - just check it exists and has some directives
    if (!value.includes('=')) {
      issues.push('Permissions-Policy has invalid format');
      return { valid: false, issues, recommendations };
    }

    return { valid: true, issues, recommendations };
  }

  /**
   * Get security grade based on score
   */
  static getSecurityGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate security recommendations for Fix This panel
   */
  static generateSecurityIssues(securityAnalysis, targetUrl) {
    const issues = [];

    // Check if details exist before processing
    if (!securityAnalysis?.details) {
      return issues;
    }

    Object.entries(securityAnalysis.details).forEach(([headerName, detail]) => {
      if (!detail.valid && detail.applicable !== false) {
        const recommendations = detail.recommendations || [];
        
        issues.push({
          id: `security-${headerName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          title: `Security: ${headerName}`,
          severity: this.getIssueSeverity(headerName),
          description: detail.issues?.[0] || `${headerName} header missing or invalid`,
          foundOn: [new URL(targetUrl).pathname],
          howTo: [
            `Lägg till eller korrigera ${headerName} header på din server`,
            'Detta förbättrar säkerheten mot XSS, clickjacking och andra attacker',
            'Testa implementationen med verktyg som securityheaders.com'
          ],
          links: [
            {
              label: 'MDN: HTTP Security Headers',
              url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers#security'
            },
            {
              label: 'OWASP: Security Headers',
              url: 'https://owasp.org/www-project-secure-headers/'
            }
          ],
          quickFixes: recommendations.map(rec => ({
            label: rec.fix,
            snippet: rec.code || `${headerName}: [value]`
          })),
          status: 'open'
        });
      }
    });

    return issues;
  }

  /**
   * Get issue severity based on header importance
   */
  static getIssueSeverity(headerName) {
    const criticalHeaders = ['Content-Security-Policy', 'Strict-Transport-Security'];
    const importantHeaders = ['X-Frame-Options', 'X-Content-Type-Options'];
    
    if (criticalHeaders.includes(headerName)) return 'critical';
    if (importantHeaders.includes(headerName)) return 'important';
    return 'optional';
  }
}

module.exports = SecurityAnalyzer;