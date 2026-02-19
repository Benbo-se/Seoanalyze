const TextNormalizer = require('../../frontend/src/utils/text-normalizer');

/**
 * Analyzes Schema.org structured data (JSON-LD)
 * Detects and validates common schema types for SEO enhancement
 */
class SchemaAnalyzer {
  
  /**
   * Analyze Schema.org structured data from HTML
   * @param {CheerioAPI} $ - Cheerio loaded HTML
   * @param {string} targetUrl - URL being analyzed
   * @returns {Object} Schema analysis results
   */
  static analyzeSchema($, targetUrl) {
    const analysis = {
      schemas: [],
      types: [],
      score: 0,
      grade: '',
      issues: [],
      recommendations: []
    };

    // Extract all JSON-LD scripts
    const jsonLdScripts = [];
    $('script[type="application/ld+json"]').each((i, el) => {
      const content = $(el).html();
      if (content && content.trim()) {
        jsonLdScripts.push(content.trim());
      }
    });

    // Parse each script
    jsonLdScripts.forEach((script, index) => {
      try {
        const parsed = JSON.parse(script);
        const schemas = this.extractSchemas(parsed);
        schemas.forEach(schema => {
          const validation = this.validateSchema(schema);
          analysis.schemas.push({
            type: schema['@type'],
            valid: validation.errors.length === 0,
            errors: validation.errors,
            warnings: validation.warnings,
            data: schema,
            scriptIndex: index
          });
        });
      } catch (error) {
        analysis.schemas.push({
          type: 'unknown',
          valid: false,
          errors: [`JSON parsing error: ${error.message}`],
          warnings: [],
          data: null,
          scriptIndex: index
        });
      }
    });

    // Extract unique types
    analysis.types = [...new Set(analysis.schemas.map(s => s.type).filter(t => t !== 'unknown'))];
    
    // Calculate score and grade
    analysis.score = this.calculateSchemaScore(analysis.schemas);
    analysis.grade = this.getSchemaGrade(analysis.score);
    
    // Generate issues and recommendations
    analysis.issues = this.getSchemaIssues(analysis.schemas, analysis.types);
    analysis.recommendations = this.getSchemaRecommendations(analysis.schemas, targetUrl);

    return analysis;
  }

  /**
   * Extract schemas from parsed JSON-LD
   * Handles both single objects and @graph arrays
   */
  static extractSchemas(parsed) {
    if (!parsed) return [];

    // Handle @graph structure
    if (parsed['@graph'] && Array.isArray(parsed['@graph'])) {
      const topLevelContext = parsed['@context'];
      // Propagate top-level @context to each schema in @graph if they don't have their own
      return parsed['@graph'].map(schema => {
        if (!schema['@context'] && topLevelContext) {
          return { '@context': topLevelContext, ...schema };
        }
        return schema;
      });
    }

    // Handle array of schemas
    if (Array.isArray(parsed)) {
      return parsed;
    }

    // Single schema object
    return [parsed];
  }

  /**
   * Validate individual schema object
   */
  static validateSchema(schema) {
    const errors = [];
    const warnings = [];
    
    // Required for all types
    if (!schema['@context']) {
      errors.push('Missing @context property');
    } else if (typeof schema['@context'] === 'string' && !schema['@context'].includes('schema.org')) {
      warnings.push('@context should reference schema.org');
    }
    
    if (!schema['@type']) {
      errors.push('Missing @type property');
    }

    const schemaType = schema['@type'];
    
    // Type-specific validations
    switch (schemaType) {
      case 'Organization':
        if (!schema.name) errors.push('Organization missing required "name" property');
        if (!schema.url) warnings.push('Organization should have "url" property');
        break;
        
      case 'Product':
        if (!schema.name) errors.push('Product missing required "name" property');
        if (!schema.offers && !schema.price) warnings.push('Product should have offers or price');
        if (!schema.description) warnings.push('Product should have description');
        break;
        
      case 'Article':
        if (!schema.headline && !schema.name) errors.push('Article missing headline or name');
        if (!schema.author) warnings.push('Article should have author');
        if (!schema.datePublished) warnings.push('Article should have datePublished');
        break;
        
      case 'LocalBusiness':
        if (!schema.name) errors.push('LocalBusiness missing required "name" property');
        if (!schema.address) warnings.push('LocalBusiness should have address');
        if (!schema.telephone) warnings.push('LocalBusiness should have telephone');
        break;
        
      case 'BreadcrumbList':
        if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
          errors.push('BreadcrumbList missing itemListElement array');
        } else if (schema.itemListElement.length === 0) {
          warnings.push('BreadcrumbList is empty');
        }
        break;
        
      case 'WebSite':
        if (!schema.name && !schema.alternateName) warnings.push('WebSite should have name');
        if (!schema.url) warnings.push('WebSite should have url');
        break;
        
      case 'WebPage':
        if (!schema.name && !schema.headline) warnings.push('WebPage should have name or headline');
        break;
    }

    return { errors, warnings };
  }

  /**
   * Calculate schema score based on detected schemas and their validity
   */
  static calculateSchemaScore(schemas) {
    if (schemas.length === 0) return 0;
    
    let totalScore = 0;
    const maxSchemaScore = 100;
    
    // Base score for having schemas
    totalScore += 30;
    
    // Points for valid schemas
    const validSchemas = schemas.filter(s => s.valid);
    totalScore += (validSchemas.length / schemas.length) * 40;
    
    // Bonus points for important schema types
    const types = schemas.map(s => s.type);
    if (types.includes('Organization')) totalScore += 10;
    if (types.includes('WebSite')) totalScore += 5;
    if (types.includes('BreadcrumbList')) totalScore += 5;
    if (types.includes('Product') || types.includes('LocalBusiness')) totalScore += 10;
    
    return Math.min(Math.round(totalScore), maxSchemaScore);
  }

  /**
   * Get schema grade based on score
   */
  static getSchemaGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate issues list for schemas
   */
  static getSchemaIssues(schemas, types) {
    const issues = [];
    
    if (schemas.length === 0) {
      issues.push('No structured data found - missing SEO opportunities');
      return issues;
    }
    
    // Count invalid schemas
    const invalidSchemas = schemas.filter(s => !s.valid);
    if (invalidSchemas.length > 0) {
      issues.push(`${invalidSchemas.length} invalid schema(s) with errors`);
    }
    
    // Check for common missing types
    if (!types.includes('Organization') && !types.includes('LocalBusiness')) {
      issues.push('Missing Organization or LocalBusiness schema for brand identity');
    }
    
    if (!types.includes('WebSite')) {
      issues.push('Missing WebSite schema for site-wide search features');
    }
    
    if (!types.includes('BreadcrumbList')) {
      issues.push('Missing BreadcrumbList schema for navigation');
    }
    
    // Check for warnings in valid schemas
    schemas.forEach(schema => {
      if (schema.valid && schema.warnings.length > 0) {
        issues.push(`${schema.type}: ${schema.warnings[0]}`);
      }
    });
    
    return issues;
  }

  /**
   * Generate recommendations for schema improvements
   */
  static getSchemaRecommendations(schemas, targetUrl) {
    const recommendations = [];
    const domain = new URL(targetUrl).hostname;
    const types = schemas.map(s => s.type);
    
    if (schemas.length === 0) {
      recommendations.push({
        issue: 'No structured data found',
        fix: 'Add basic Organization schema',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${domain}",
  "url": "${targetUrl}",
  "logo": "https://${domain}/logo.png"
}
</script>`
      });
      return recommendations;
    }
    
    if (!types.includes('Organization') && !types.includes('LocalBusiness')) {
      recommendations.push({
        issue: 'Missing Organization schema',
        fix: 'Add Organization schema for brand identity',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${domain}",
  "url": "${targetUrl}",
  "logo": "https://${domain}/logo.png",
  "sameAs": [
    "https://facebook.com/${domain}",
    "https://twitter.com/${domain}"
  ]
}
</script>`
      });
    }
    
    if (!types.includes('WebSite')) {
      recommendations.push({
        issue: 'Missing WebSite schema',
        fix: 'Add WebSite schema for search features',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "${domain}",
  "url": "${targetUrl}",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "${targetUrl}/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
</script>`
      });
    }
    
    return recommendations;
  }

  /**
   * Generate schema issues for Fix This panel
   */
  static generateSchemaIssues(schemaAnalysis, targetUrl) {
    const issues = [];
    const domain = new URL(targetUrl).hostname;
    
    if (schemaAnalysis.schemas.length === 0) {
      issues.push({
        id: `schema-missing`,
        title: 'Saknar Schema.org strukturerad data',
        severity: 'important',
        description: 'Ingen strukturerad data hittades - förlorar SEO-möjligheter',
        foundOn: [new URL(targetUrl).pathname],
        howTo: [
          'Lägg till JSON-LD script i <head> sektionen',
          'Börja med Organization schema för företagsidentitet',
          'Validera med Google Rich Results Test',
          'Lägg till fler relevanta schema-typer för ditt innehåll'
        ],
        links: [
          {
            label: 'Schema.org Documentation',
            url: 'https://schema.org/'
          },
          {
            label: 'Google Rich Results Test',
            url: 'https://search.google.com/test/rich-results'
          },
          {
            label: 'JSON-LD Generator',
            url: 'https://technicalseo.com/tools/schema-markup-generator/'
          }
        ],
        quickFixes: [
          {
            label: 'Grundläggande Organization Schema',
            snippet: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "${domain}",
  "url": "${targetUrl}",
  "logo": "https://${domain}/logo.png"
}
</script>`
          }
        ],
        status: 'open'
      });
    } else if (schemaAnalysis.score < 70) {
      const invalidCount = schemaAnalysis.schemas.filter(s => !s.valid).length;
      if (invalidCount > 0) {
        issues.push({
          id: `schema-invalid`,
          title: 'Felaktig Schema.org strukturerad data',
          severity: 'important',
          description: `${invalidCount} schema(s) innehåller fel som förhindrar rich snippets`,
          foundOn: [new URL(targetUrl).pathname],
          howTo: [
            'Validera all strukturerad data med Google Rich Results Test',
            'Fixa JSON syntax-fel och saknade required properties',
            'Se till att @context och @type finns i alla schemas',
            'Testa med Schema Markup Validator'
          ],
          links: [
            {
              label: 'Google Rich Results Test',
              url: 'https://search.google.com/test/rich-results'
            },
            {
              label: 'Schema Markup Validator',
              url: 'https://validator.schema.org/'
            }
          ],
          quickFixes: [],
          status: 'open'
        });
      }
    }
    
    return issues;
  }
}

module.exports = SchemaAnalyzer;