const { withBrowser } = require('../../lib/browser-pool');
const TextNormalizer = require('../utils/text-normalizer');

class PDFRenderer {
  constructor() {
    this.enabled = true;
  }

  async renderAnalysisToPdf(analysis, fullResults) {
    if (!this.enabled) {
      throw new Error('PDF rendering is disabled');
    }

    console.log(`Generating PDF for analysis ${analysis.id} (${analysis.type})`);
    
    try {
      return await withBrowser(async (browser) => {
        const page = await browser.newPage();
        
        // Set page size and margins
        await page.setViewport({ width: 1200, height: 800 });
        
        // Generate HTML content for the report
        const htmlContent = await this.generateReportHTML(analysis, fullResults);
        
        // Configure timeouts via environment variables
        const contentTimeout = parseInt(process.env.PDF_CONTENT_TIMEOUT_MS) || 30000;
        const imageTimeout = parseInt(process.env.PDF_IMAGE_TIMEOUT_MS) || 30000;
        const waitCondition = process.env.PDF_WAIT_CONDITION || 'networkidle0';

        // Set the HTML content
        await page.setContent(htmlContent, {
          waitUntil: waitCondition,
          timeout: contentTimeout
        });

        // Wait for images to load with configurable timeout and fallback
        try {
          await page.waitForFunction(() => {
            const imgs = Array.from(document.images || []);
            return imgs.length === 0 || imgs.every(i => i.complete && i.naturalWidth > 0);
          }, { timeout: imageTimeout });
        } catch (timeoutError) {
          console.log(`⚠️ Image loading timeout for PDF ${analysis.id}, proceeding anyway`);
          // Wait a bit longer for partial loading
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Generate PDF with options
        const pdfBuffer = await page.pdf({
          format: 'A4',
          margin: {
            top: '20mm',
            right: '15mm',
            bottom: '20mm', 
            left: '15mm'
          },
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: `
            <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
              SEO Analyzer Report - ${analysis.targetUrl}
            </div>
          `,
          footerTemplate: `
            <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
              <span class="date"></span> - Page <span class="pageNumber"></span> of <span class="totalPages"></span>
            </div>
          `
        });
        
        await page.close();

        // Ensure pdfBuffer is a proper Buffer (fix JSON serialization in worker context)
        let finalBuffer = pdfBuffer;
        if (!Buffer.isBuffer(finalBuffer)) {
          if (typeof finalBuffer === 'object' && finalBuffer !== null) {
            const bufferArray = Object.values(finalBuffer);
            finalBuffer = Buffer.from(bufferArray);
          }
        }

        console.log(`✅ PDF generated for analysis ${analysis.id} (${finalBuffer.length} bytes)`);

        return finalBuffer;
      });
    } catch (error) {
      console.error(`❌ PDF generation failed for analysis ${analysis.id}:`, error);
      throw error;
    }
  }

  // Helper function to safely normalize and escape text for HTML
  safeText(text) {
    if (!text) return '';
    const normalized = TextNormalizer.normalizeText(text);
    // Basic HTML escaping to prevent issues in PDF
    return normalized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async generateReportHTML(analysis, results) {
    const { type, targetUrl, summary, createdAt } = analysis;
    
    // Generate CSS for styling
    const css = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .header p {
          font-size: 16px;
          opacity: 0.9;
        }
        
        .content {
          padding: 30px;
        }
        
        .meta {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .meta-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        
        .score-section {
          text-align: center;
          margin: 30px 0;
        }
        
        .score-circle {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: bold;
          color: white;
        }
        
        .score-good { background: #28a745; }
        .score-warning { background: #ffc107; color: #333; }
        .score-error { background: #dc3545; }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        
        .stat-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
        
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        
        .issues-section {
          margin-top: 40px;
        }
        
        .issues-section h2 {
          border-bottom: 2px solid #667eea;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .issue-item {
          background: #fff;
          border: 1px solid #e9ecef;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 15px;
        }
        
        .issue-title {
          font-weight: bold;
          color: #333;
        }
        
        .issue-description {
          color: #666;
          margin-top: 5px;
        }
        
        .issue-critical { border-left: 4px solid #dc3545; }
        .issue-warning { border-left: 4px solid #ffc107; }
        .issue-info { border-left: 4px solid #17a2b8; }
        
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #e9ecef;
          padding-top: 20px;
        }
      </style>
    `;
    
    // Generate content based on analysis type
    const content = await this.generateContentByType(type, results, summary, analysis);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>SEO Analysis Report - ${targetUrl}</title>
          ${css}
        </head>
        <body>
          <div class="header">
            <h1>${type.toUpperCase()} Analysis Report</h1>
            <p>${targetUrl}</p>
          </div>
          
          <div class="content">
            <div class="meta">
              <div class="meta-row">
                <strong>Analysis Type:</strong>
                <span>${type.toUpperCase()}</span>
              </div>
              <div class="meta-row">
                <strong>Analyzed URL:</strong>
                <span>${targetUrl}</span>
              </div>
              <div class="meta-row">
                <strong>Analysis Date:</strong>
                <span>${new Date(createdAt).toLocaleString()}</span>
              </div>
              <div class="meta-row">
                <strong>Report Generated:</strong>
                <span>${new Date().toLocaleString()}</span>
              </div>
            </div>
            
            ${content}
            
            <div class="footer">
              <p>Generated by SEO Analyzer | seoanalyze.se</p>
              <p>This report was automatically generated and contains analysis results at the time of scan.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
  
  async generateContentByType(type, results, summary, analysis) {
    if (type === 'seo') {
      return await this.generateSEOContent(results, summary, analysis);
    } else if (type === 'lighthouse') {
      return this.generateLighthouseContent(results, summary);
    } else if (type === 'crawl') {
      return this.generateCrawlContent(results, summary);
    } else if (type === 'ai-analysis') {
      return this.generateAIContent(results, summary);
    }

    return '<p>Unknown analysis type</p>';
  }
  
  async generateSEOContent(results, summary, analysis) {
    // Basdomän för PDF-bilder
    const origin =
      process.env.PDF_BASE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5001');

    // Datum-oberoende artifacts via by-id-endpoint
    const artifactBase = (analysis?.id && origin)
      ? `${origin}/api/artifacts/by-id/${analysis.id}`
      : null;

    // Hjälpare: hämta PNG och returnera data:URL (fallback -> http-url)
    const toDataUrl = async (url) => {
      try {
        const fetchTimeout = parseInt(process.env.PDF_FETCH_TIMEOUT_MS) || 10000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'SEO-Analyzer-PDF/1.0'
          }
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(String(res.status));
        const buf = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get('content-type') || 'image/png';
        return `data:${ct};base64,${buf.toString('base64')}`;
      } catch (error) {
        console.log(`⚠️ Failed to convert image to data URL: ${url}, using fallback`);
        return url; // fallback till http-url om något går fel
      }
    };
    if (!results) {
      return '<p>No results data available</p>';
    }

    const score = results.seoScore || summary?.score || 0;
    const scoreClass = score >= 80 ? 'score-good' : score >= 60 ? 'score-warning' : 'score-error';

    // Extract the same data as web version
    const title = results.title || results.meta?.title || '';
    const description = results.metaDescription || results.meta?.description || '';
    const titleLength = title.length;
    const descLength = description.length;
    const url = analysis.targetUrl || results.url || '';
    // Create favicon URL from target domain, don't use our own as fallback
    const favicon = results.favicon || (url ? `${new URL(url).origin}/favicon.ico` : null);

    // Get Quick Wins
    const quickWins = results.quickWins || [];

    // LIX data
    const lix = results.readability || results.lix || {};

    // Social media data - handle multiple possible structures
    const social = results.social || {};
    const openGraph = results.openGraph || social.openGraph || {};
    const twitter = results.twitter || social.twitter || {};

    // Security data
    const security = results.security || {};

    // DNS data
    const dns = results.dns || {};

    // Schema data - handle multiple possible structures
    const schema = results.schema || {};
    const hasSchema = schema.present || schema.types?.length > 0 || schema.jsonLd?.length > 0;
    
    return `
      <!-- Hero Screenshots Section -->
      ${(process.env.PDF_SECTIONS_ENABLED !== 'false' && results.screenshots) ? `
        <div class="issues-section">
          <h2>Förhandsvisning av webbplats</h2>
          <div style="display:flex;gap:20px;margin:20px 0;">
            ${results.screenshots.desktop ? `
              <div style="flex:2;">
                <h4 style="margin:0 0 10px 0;color:#666;font-size:14px;">Desktop (1366×768)</h4>
                <img src="${artifactBase ? await toDataUrl(`${artifactBase}/${results.screenshots.desktop}`) : ''}"
                     alt="Desktop preview"
                     style="width:100%;height:auto;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}
            ${results.screenshots.mobile ? `
              <div style="flex:1;max-width:200px;">
                <h4 style="margin:0 0 10px 0;color:#666;font-size:14px;">Mobil (375×812)</h4>
                <img src="${artifactBase ? await toDataUrl(`${artifactBase}/${results.screenshots.mobile}`) : ''}"
                     alt="Mobile preview"
                     style="width:100%;height:auto;border:1px solid #ddd;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" />
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <div class="score-section">
        <div class="score-circle ${scoreClass}">
          ${score}
        </div>
        <h2>SEO-poäng</h2>
        <p>${this.getScoreMessage(score)}</p>
      </div>

      <!-- Page Overview Stats -->
      <div class="issues-section">
        <h2>Översikt</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${score}</div>
            <div class="stat-label">SEO-poäng</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${(results.issues && results.issues.length) || 0}</div>
            <div class="stat-label">Problem funna</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${results.wordCount || 0}</div>
            <div class="stat-label">Ord analyserat</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${results.mobile?.isMobileFriendly ? 'Ja' : 'Nej'}</div>
            <div class="stat-label">Mobilvänlig</div>
          </div>
        </div>
      </div>

      <!-- Meta-taggar Analysis Section -->
      <div class="issues-section">
        <h2>Meta-taggar Analys</h2>

        <!-- Title Tag Analysis -->
        <div class="issue-item">
          <div class="issue-title">Title Tag</div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 8px 0;">
            <code style="font-family: monospace; font-size: 13px;">${this.safeText(title) || 'Ingen titel hittades'}</code>
          </div>
          <div class="issue-description">
            Längd: ${titleLength}/60 tecken
            ${titleLength === 0 ? '(Saknas - kritiskt fel)' :
              titleLength < 30 ? '(För kort - lägg till mer beskrivande text)' :
              titleLength > 60 ? '(För lång - kan bli avklippt i sökresultat)' :
              '(Optimal längd)'}
          </div>
        </div>

        <!-- Meta Description Analysis -->
        <div class="issue-item">
          <div class="issue-title">Meta Description</div>
          <div style="background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 8px 0;">
            <code style="font-family: monospace; font-size: 13px;">${this.safeText(description) || 'Ingen beskrivning hittades'}</code>
          </div>
          <div class="issue-description">
            Längd: ${descLength}/160 tecken
            ${descLength === 0 ? '(Saknas - Google genererar automatiskt beskrivning)' :
              descLength < 120 ? '(För kort - lägg till mer information)' :
              descLength > 160 ? '(För lång - kan bli avklippt i sökresultat)' :
              '(Optimal längd)'}
          </div>
        </div>

        <!-- Google Preview Simulation -->
        <div style="margin-top: 20px;">
          <h3 style="color: #333; margin-bottom: 15px;">🔍 Google Förhandsvisning</h3>
          <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; background: #fff;">
            <div style="margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              ${favicon ? `<img src="${favicon}" alt="" style="width: 16px; height: 16px; border-radius: 50%; display: inline-block;" />` : ''}
              <span style="color: #1a73e8; font-size: 14px;">${url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
            </div>
            <h3 style="color: #1a0dab; font-size: 18px; margin: 2px 0; font-weight: normal; line-height: 1.3;">
              ${title ? this.safeText(title.length > 65 ? title.substring(0, 62) + '...' : title) : 'Sidtitel saknas'}
            </h3>
            <div style="color: #4d5156; font-size: 14px; line-height: 1.4;">
              ${description ? this.safeText(description.length > 160 ? description.substring(0, 157) + '...' : description) : 'Meta description saknas. Google kommer automatiskt generera en beskrivning från sidans innehåll.'}
            </div>
          </div>
        </div>

        <!-- Optimization Recommendations -->
        <div style="margin-top: 20px;">
          <h4 style="color: #333; margin-bottom: 10px;">Optimeringsförslag</h4>
          <ul style="list-style: none; padding: 0;">
            ${titleLength < 30 ? '<li style="color: #f59e0b; margin: 5px 0;">• Förläng titeln till minst 30 tecken för bättre synlighet</li>' : ''}
            ${titleLength > 60 ? '<li style="color: #f59e0b; margin: 5px 0;">• Förkorta titeln till max 60 tecken för att undvika avklippning</li>' : ''}
            ${!title ? '<li style="color: #ef4444; margin: 5px 0;">• Lägg till en unik och beskrivande titel för sidan</li>' : ''}
            ${descLength < 120 ? '<li style="color: #f59e0b; margin: 5px 0;">• Förläng meta description till minst 120 tecken</li>' : ''}
            ${descLength > 160 ? '<li style="color: #f59e0b; margin: 5px 0;">• Förkorta meta description till max 160 tecken</li>' : ''}
            ${!description ? '<li style="color: #ef4444; margin: 5px 0;">• Lägg till en lockande meta description som sammanfattar sidans innehåll</li>' : ''}
            ${titleLength >= 30 && titleLength <= 60 && descLength >= 120 && descLength <= 160 ? '<li style="color: #10b981; margin: 5px 0;">• Title och meta description har optimal längd - bra jobbat!</li>' : ''}
          </ul>
        </div>
      </div>

      <!-- Quick Wins Section -->
      <div class="issues-section">
        <h2>Quick Wins - Snabba förbättringar</h2>
        ${quickWins.length > 0 ? `
          <p>Högst prioriterade åtgärder för ${url}</p>
          ${quickWins.map(win => `
            <div class="issue-item issue-${win.priority === 'high' ? 'critical' : 'warning'}">
              <div class="issue-title">${this.safeText(win.title)}</div>
              <div class="issue-description">${this.safeText(win.description)}</div>
            </div>
          `).join('')}
        ` : `
          <div class="issue-item" style="background: #f0f9ff; border-left: 4px solid #10b981;">
            <div class="issue-title">Inga uppenbara snabba vinster hittades - bra jobbat!</div>
          </div>
        `}
      </div>

      <!-- Score Breakdown -->
      ${results.scoreBreakdown ? `
        <div class="issues-section">
          <h2>Score Breakdown</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${results.scoreBreakdown.title + results.scoreBreakdown.metaDescription}/30</div>
              <div class="stat-label">Title & Meta</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${results.scoreBreakdown.headings}/15</div>
              <div class="stat-label">Headings</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${results.scoreBreakdown.content}/15</div>
              <div class="stat-label">Content</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${results.scoreBreakdown.images}/10</div>
              <div class="stat-label">Images</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${results.scoreBreakdown.technical}/10</div>
              <div class="stat-label">Technical</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${results.scoreBreakdown.social}/10</div>
              <div class="stat-label">Social</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Page Info -->
      <div class="issues-section">
        <h2>Page Information</h2>
        <div class="issue-item">
          <div class="issue-title">Title: ${this.safeText(results.title) || 'Missing'}</div>
          <div class="issue-description">Length: ${results.titleLength || 0} characters ${results.titleLength >= 30 && results.titleLength <= 60 ? '(Good)' : '(Needs improvement)'}</div>
        </div>
        <div class="issue-item">
          <div class="issue-title">Meta Description: ${this.safeText(results.metaDescription) || 'Missing'}</div>
          <div class="issue-description">Length: ${results.metaDescriptionLength || 0} characters ${results.metaDescriptionLength >= 120 && results.metaDescriptionLength <= 160 ? '(Good)' : '(Needs improvement)'}</div>
        </div>
        <div class="issue-item">
          <div class="issue-title">Focus Keyword: ${this.safeText(results.focusKeyword) || 'None detected'}</div>
          <div class="issue-description">In title: ${results.titleHasKeyword ? 'Yes' : 'No'} | In meta: ${results.metaHasKeyword ? 'Yes' : 'No'}</div>
        </div>
      </div>

      <!-- Content Analysis -->
      <div class="issues-section">
        <h2>Content Analysis</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${results.wordCount || 0}</div>
            <div class="stat-label">Words ${results.wordCount >= 300 ? '(Good)' : '(Low)'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${results.headings?.h1?.count || 0}</div>
            <div class="stat-label">H1 Tags ${results.headings?.h1?.count === 1 ? '(Good)' : '(Check)'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${results.headings?.h2?.count || 0}</div>
            <div class="stat-label">H2 Tags</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${results.images?.total || 0}</div>
            <div class="stat-label">Images</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${results.images?.withoutAlt || 0}</div>
            <div class="stat-label">Missing Alt Text</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${results.links?.internal || 0}</div>
            <div class="stat-label">Internal Links</div>
          </div>
        </div>
      </div>

      <!-- Technical SEO -->
      <div class="issues-section">
        <h2>Technical SEO</h2>
        <div class="issue-item">
          <div class="issue-title">HTTPS: ${results.technical?.https ? 'Enabled' : 'Disabled'}</div>
        </div>
        <div class="issue-item">
          <div class="issue-title">Mobile Viewport: ${results.mobile?.hasViewport ? 'Yes' : 'No'}</div>
        </div>
        <div class="issue-item">
          <div class="issue-title">Schema Markup: ${results.technical?.hasSchema ? 'Yes' : 'No'}</div>
        </div>
        <div class="issue-item">
          <div class="issue-title">Open Graph: ${results.openGraph?.title ? 'Yes' : 'Missing'}</div>
          ${results.openGraph?.title ? `<div class="issue-description">Title: ${this.safeText(results.openGraph.title)}</div>` : ''}
        </div>
        <div class="issue-item">
          <div class="issue-title">Twitter Cards: ${results.twitter?.card && results.twitter.card !== 'Missing' ? 'Yes' : 'Missing'}</div>
        </div>
      </div>

      <!-- Top Keywords -->
      ${results.keywordDensity && results.keywordDensity.length > 0 ? `
        <div class="issues-section">
          <h2>Top Keywords</h2>
          ${results.keywordDensity.slice(0, 10).map(keyword => `
            <div class="issue-item">
              <div class="issue-title">${this.safeText(keyword.word)}</div>
              <div class="issue-description">Used ${keyword.count} times (${keyword.density}% density)</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- C1: Security Section -->
      ${(process.env.PDF_SECTIONS_ENABLED !== 'false' && process.env.PDF_SHOW_SECURITY !== 'false' && results.security) ? `
        <div class="issues-section">
          <h2>Säkerhetsanalys ${results.security.grade ? `<span style="float:right;background:#eef;padding:2px 8px;border-radius:4px;font-size:14px;">Betyg: ${results.security.grade}</span>` : ''}</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>HSTS</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${results.security.hsts?.present ? '<span style="color:#15803d;">✓ Aktivt</span>' : '<span style="color:#b91c1c;">✗ Saknas</span>'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>CSP</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${results.security.csp?.present ? `<span style="color:#15803d;">✓ ${results.security.csp.directivesCount || 0} direktiv</span>` : '<span style="color:#b91c1c;">✗ Saknas</span>'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>X-Frame-Options</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${results.security.xFrameOptions?.present ? `<span style="color:#15803d;">✓ ${results.security.xFrameOptions.value}</span>` : '<span style="color:#b91c1c;">✗ Saknas</span>'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>Referrer-Policy</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${results.security.referrerPolicy?.present ? `<span style="color:#15803d;">✓ ${results.security.referrerPolicy.value}</span>` : '<span style="color:#b91c1c;">✗ Saknas</span>'}</td>
            </tr>
          </table>
        </div>
      ` : ''}

      <!-- C2: DNS Section -->
      ${(process.env.PDF_SECTIONS_ENABLED !== 'false' && process.env.PDF_SHOW_DNS !== 'false' && results.dns) ? `
        <div class="issues-section">
          <h2>DNS & E-postsäkerhet</h2>
          <p style="color:#666;font-size:14px;">${results.dns.checkedDomain || ''}${results.dns.apexDomain ? ` (apex: ${results.dns.apexDomain})` : ''}</p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>SPF</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${results.dns.spf?.status === 'pass' ? '<span style="color:#15803d;">✓ Konfigurerad</span>' : '<span style="color:#b91c1c;">✗ Saknas</span>'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>DMARC</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${results.dns.dmarc?.status === 'pass' ? `<span style="color:#15803d;">✓ ${results.dns.dmarc.policy || ''}</span>` : '<span style="color:#b91c1c;">✗ Saknas</span>'}</td>
            </tr>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>MX</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${results.dns.mx?.status === 'pass' ? `<span style="color:#15803d;">✓ ${results.dns.mx.recordsCount || 0} poster</span>` : '<span style="color:#b91c1c;">✗ Inga funna</span>'}</td>
            </tr>
          </table>
        </div>
      ` : ''}

      <!-- C3: Social Section with previews -->
      ${(process.env.PDF_SECTIONS_ENABLED !== 'false' && process.env.PDF_SHOW_SOCIAL !== 'false' && (results.social || results.openGraph || results.twitter || openGraph.title || twitter.title)) ? `
        <div class="issues-section">
          <h2>Sociala medier</h2>

          <!-- Social Media Status Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>Open Graph</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${
                (openGraph.title || openGraph.description || social.openGraph?.present) ?
                '<span style="color:#15803d;">✓ Konfigurerad</span>' :
                '<span style="color:#b91c1c;">✗ Saknas</span>'
              }</td>
            </tr>
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>Twitter Cards</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${
                (twitter.title || twitter.description || twitter.card || social.twitter?.present) ?
                '<span style="color:#15803d;">✓ Konfigurerad</span>' :
                '<span style="color:#b91c1c;">✗ Saknas</span>'
              }</td>
            </tr>
          </table>

          <!-- Facebook Preview -->
          ${(openGraph.title || openGraph.description || social.openGraph?.present) ? `
            <div style="margin-bottom: 20px;">
              <h4 style="color: #333; margin-bottom: 10px;">📘 Facebook Förhandsvisning</h4>
              <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; background: #fff; max-width: 500px;">
                <h3 style="color: #1877f2; font-size: 16px; margin: 0 0 5px 0; font-weight: 600;">
                  ${this.safeText(openGraph.title || title) || 'Titel saknas'}
                </h3>
                <div style="color: #65676b; font-size: 14px; line-height: 1.4; margin-bottom: 8px;">
                  ${this.safeText(openGraph.description || description) || 'Beskrivning saknas'}
                </div>
                <div style="color: #8a8d91; font-size: 13px; text-transform: uppercase;">
                  ${url.replace(/^https?:\/\//, '').split('/')[0]}
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Twitter Preview -->
          ${(twitter.title || twitter.description || twitter.card || social.twitter?.present) ? `
            <div style="margin-bottom: 20px;">
              <h4 style="color: #333; margin-bottom: 10px;">🐦 Twitter Förhandsvisning</h4>
              <div style="border: 1px solid #e9ecef; border-radius: 16px; padding: 15px; background: #fff; max-width: 500px;">
                <h3 style="color: #0f1419; font-size: 15px; margin: 0 0 8px 0; font-weight: 700; line-height: 1.3;">
                  ${this.safeText(twitter.title || openGraph.title || title) || 'Titel saknas'}
                </h3>
                <div style="color: #536471; font-size: 15px; line-height: 1.3; margin-bottom: 8px;">
                  ${this.safeText(twitter.description || openGraph.description || description) || 'Beskrivning saknas'}
                </div>
                <div style="color: #536471; font-size: 13px;">
                  🔗 ${url.replace(/^https?:\/\//, '').split('/')[0]}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- LIX Readability Analysis Section -->
      ${(process.env.PDF_SECTIONS_ENABLED !== 'false' && (results.readability || results.lix)) ? `
        <div class="issues-section">
          <h2>LIX Läsbarhetsanalys</h2>

          <div class="stats-grid" style="margin-bottom: 20px;">
            <div class="stat-card">
              <div class="stat-number">${results.readability.lix || results.readability.lixScore || 'N/A'}</div>
              <div class="stat-label">LIX-index</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${results.readability.level || results.readability.grade || 'Okänd'}</div>
              <div class="stat-label">Svårighetsgrad</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${results.readability.metrics?.totalSentences || results.readability.sentences || 0}</div>
              <div class="stat-label">Meningar</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${
                results.readability.metrics?.totalWords && results.readability.metrics?.totalSentences
                  ? Math.round(results.readability.metrics.totalWords / results.readability.metrics.totalSentences * 10) / 10
                  : results.readability.avgWordsPerSentence || 0
              }</div>
              <div class="stat-label">Ord per mening</div>
            </div>
          </div>

          <!-- LIX Level Explanation -->
          <div class="issue-item" style="background: #f8f9fa;">
            <div class="issue-title">Vad betyder LIX-index?</div>
            <div class="issue-description">
              <strong>Under 25:</strong> Mycket lätt (barnböcker)<br>
              <strong>25-35:</strong> Lätt (tidningar, populärlitteratur)<br>
              <strong>35-45:</strong> Måttlig (normal prosa, tidskrifter)<br>
              <strong>45-55:</strong> Svår (fackpress, officiella texter)<br>
              <strong>Över 55:</strong> Mycket svår (vetenskaplig litteratur)
            </div>
          </div>

          <!-- Readability Recommendations -->
          ${results.readability.recommendations?.length ? `
            <div style="margin-top: 15px;">
              <h4 style="color: #333; margin-bottom: 10px;">Rekommendationer för bättre läsbarhet</h4>
              <ul style="list-style: none; padding: 0;">
                ${results.readability.recommendations.map(rec => `
                  <li style="color: #f59e0b; margin: 5px 0;">• ${this.safeText(rec)}</li>
                `).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- C4: Schema Section with JSON examples -->
      ${(process.env.PDF_SECTIONS_ENABLED !== 'false' && process.env.PDF_SHOW_SCHEMA !== 'false' && (results.schema || hasSchema)) ? `
        <div class="issues-section">
          <h2>Strukturerad data (Schema.org)</h2>

          <!-- Schema Status Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr>
              <td style="border:1px solid #ddd;padding:8px;"><strong>Status</strong></td>
              <td style="border:1px solid #ddd;padding:8px;">${hasSchema ? '<span style="color:#15803d;">✓ Upptäckt</span>' : '<span style="color:#b91c1c;">✗ Hittades inte</span>'}</td>
            </tr>
            ${results.schema.types?.length ? `
              <tr>
                <td style="border:1px solid #ddd;padding:8px;"><strong>Typer</strong></td>
                <td style="border:1px solid #ddd;padding:8px;">${results.schema.types.join(', ')}</td>
              </tr>
            ` : ''}
            ${results.schema.errors?.length ? `
              <tr>
                <td style="border:1px solid #ddd;padding:8px;"><strong>Valideringsfel</strong></td>
                <td style="border:1px solid #ddd;padding:8px;color:#f59e0b;">${results.schema.errors.length} fel</td>
              </tr>
            ` : ''}
          </table>

          <!-- Schema JSON Examples -->
          ${hasSchema && results.schema.jsonLd?.length ? `
            <div style="margin-top: 20px;">
              <h4 style="color: #333; margin-bottom: 10px;">Upptäckt Schema JSON-LD</h4>
              ${results.schema.jsonLd.slice(0, 3).map((schema, index) => `
                <div style="margin-bottom: 15px;">
                  <div style="background: #f8f9fa; padding: 8px; border-radius: 4px 4px 0 0; border-bottom: 1px solid #e9ecef;">
                    <strong>Schema ${index + 1}:</strong> ${schema['@type'] || 'Unknown Type'}
                  </div>
                  <pre style="background: #f8f9fa; padding: 15px; border-radius: 0 0 4px 4px; margin: 0; overflow-x: auto; font-size: 12px; border: 1px solid #e9ecef; border-top: none;"><code>${this.safeText(JSON.stringify(schema, null, 2))}</code></pre>
                </div>
              `).join('')}
              ${results.schema.jsonLd.length > 3 ? `<p style="color: #666; font-style: italic;">...och ${results.schema.jsonLd.length - 3} till</p>` : ''}
            </div>
          ` : ''}

          <!-- Schema Recommendations -->
          ${!hasSchema ? `
            <div style="margin-top: 20px;">
              <h4 style="color: #333; margin-bottom: 10px;">Rekommenderad Schema för din webbplats</h4>
              <p style="color: #666; margin-bottom: 15px;">Lägg till strukturerad data för att hjälpa sökmotorer förstå ditt innehåll bättre:</p>

              <div style="margin-bottom: 15px;">
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px 4px 0 0; border-bottom: 1px solid #e9ecef;">
                  <strong>Organisation Schema</strong> - Grundläggande företagsinformation
                </div>
                <pre style="background: #f8f9fa; padding: 15px; border-radius: 0 0 4px 4px; margin: 0; overflow-x: auto; font-size: 12px; border: 1px solid #e9ecef; border-top: none;"><code>{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Ditt Företagsnamn",
  "url": "${url}",
  "logo": "${url}/logo.png",
  "description": "Beskrivning av ditt företag",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Din Adress",
    "addressLocality": "Din Stad",
    "postalCode": "12345",
    "addressCountry": "SE"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+46-XXX-XXX-XX",
    "contactType": "customer service"
  }
}</code></pre>
              </div>

              <div style="margin-bottom: 15px;">
                <div style="background: #f8f9fa; padding: 8px; border-radius: 4px 4px 0 0; border-bottom: 1px solid #e9ecef;">
                  <strong>WebSite Schema</strong> - Sökfunktionalitet
                </div>
                <pre style="background: #f8f9fa; padding: 15px; border-radius: 0 0 4px 4px; margin: 0; overflow-x: auto; font-size: 12px; border: 1px solid #e9ecef; border-top: none;"><code>{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Din Webbplats",
  "url": "${url}",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "${url}/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}</code></pre>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- C5: Actionables Section -->
      ${(process.env.PDF_SECTIONS_ENABLED !== 'false' && process.env.PDF_SHOW_ACTIONABLES !== 'false' && results.actionables?.length > 0) ? `
        <div class="issues-section">
          <h2>Rekommenderade åtgärder</h2>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="border:1px solid #ddd;padding:8px;text-align:left;">Åtgärd</th>
                <th style="border:1px solid #ddd;padding:8px;text-align:left;">Kategori</th>
                <th style="border:1px solid #ddd;padding:8px;text-align:left;">Underlag</th>
                <th style="border:1px solid #ddd;padding:8px;text-align:left;">Fix</th>
              </tr>
            </thead>
            <tbody>
              ${results.actionables.slice(0, 5).map(a => `
                <tr>
                  <td style="border:1px solid #ddd;padding:8px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${a.severity === 'high' ? '#ef4444' : a.severity === 'medium' ? '#f59e0b' : '#10b981'};margin-right:4px;"></span>${this.safeText(a.title) || ''}
                  </td>
                  <td style="border:1px solid #ddd;padding:8px;">${a.category || ''}</td>
                  <td style="border:1px solid #ddd;padding:8px;font-size:13px;color:#666;">${this.safeText(a.evidence) || ''}</td>
                  <td style="border:1px solid #ddd;padding:8px;font-size:13px;">${this.safeText(a.fix) || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${results.actionables.length > 5 ? `<p style="color:#666;font-style:italic;margin-top:8px;">…och ${results.actionables.length - 5} till</p>` : ''}
        </div>
      ` : ''}

      <!-- Recommendations -->
      ${results.recommendations && results.recommendations.length > 0 ? `
        <div class="issues-section">
          <h2>Recommendations</h2>
          ${results.recommendations.map(rec => `
            <div class="issue-item issue-${rec.impact === 'high' ? 'critical' : rec.impact === 'medium' ? 'warning' : 'info'}">
              <div class="issue-title">${this.safeText(rec.text || rec.title)}</div>
              <div class="issue-description">${rec.impact?.toUpperCase()} IMPACT</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }

  getScoreMessage(score) {
    if (score >= 80) return 'Utmärkt! Din webbplats är väloptimerad';
    if (score >= 50) return 'Bra, men det finns utrymme för förbättring';
    return 'Behöver förbättras - flera viktiga områden saknas';
  }
  
  generateLighthouseContent(results, summary) {
    // Use new Lighthouse format from lighthouse-analyzer.js
    const performance = results?.performanceScore || results?.performance || 0;
    const accessibility = results?.accessibilityScore || results?.accessibility || 0;
    const seo = results?.seoScore || results?.seo || 0;
    const bestPractices = results?.bestPracticesScore || results?.bestPractices || 0;

    const scoreClass = performance >= 80 ? 'score-good' : performance >= 60 ? 'score-warning' : 'score-error';

    // Core Web Vitals from new format
    const coreWebVitals = results?.coreWebVitals || {};
    const lcp = coreWebVitals.lcp?.displayValue || 'N/A';
    const inp = coreWebVitals.inp?.displayValue || 'Lab data';
    const cls = coreWebVitals.cls?.displayValue || 'N/A';
    const fcp = coreWebVitals.fcp?.displayValue || 'N/A';
    const ttfb = coreWebVitals.ttfb?.displayValue || 'N/A';
    const tti = coreWebVitals.tti?.displayValue || 'N/A';
    const speedIndex = coreWebVitals.speedIndex?.displayValue || 'N/A';
    const tbt = coreWebVitals.tbt?.displayValue || 'N/A';

    // Helper function to get score status
    const getScoreStatus = (score) => {
      if (score >= 90) return 'Utmärkt';
      if (score >= 50) return 'Behöver förbättring';
      return 'Dålig, kräver förbättring';
    };

    // Helper function to get CWV status
    const getCWVStatus = (metric, value) => {
      if (!value || value === 'N/A' || value === 'Lab data') return 'N/A';

      const numValue = parseFloat(value.replace(/[^0-9.]/g, ''));

      if (metric === 'lcp') {
        return numValue <= 2500 ? 'Bra' : numValue <= 4000 ? 'Behöver förbättring' : 'Dålig';
      } else if (metric === 'inp') {
        return numValue <= 200 ? 'Bra' : numValue <= 500 ? 'Behöver förbättring' : 'Dålig';
      } else if (metric === 'cls') {
        return numValue <= 0.1 ? 'Bra' : numValue <= 0.25 ? 'Behöver förbättring' : 'Dålig';
      }
      return 'N/A';
    };

    return `
      <div class="score-section">
        <div class="score-circle ${scoreClass}">
          ${performance}
        </div>
        <h2>Lighthouse Performance Score</h2>
        <p>${getScoreStatus(performance)}</p>
      </div>

      <!-- All Lighthouse Scores -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${performance}</div>
          <div class="stat-label">Performance<br><small style="color: #666;">${getScoreStatus(performance)}</small></div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${accessibility}</div>
          <div class="stat-label">Accessibility<br><small style="color: #666;">${getScoreStatus(accessibility)}</small></div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${seo}</div>
          <div class="stat-label">SEO<br><small style="color: #666;">${getScoreStatus(seo)}</small></div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${bestPractices}</div>
          <div class="stat-label">Best Practices<br><small style="color: #666;">${getScoreStatus(bestPractices)}</small></div>
        </div>
      </div>

      <!-- Core Web Vitals -->
      <div class="issues-section">
        <h2>Core Web Vitals (Lab Data)</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${lcp}</div>
            <div class="stat-label">Largest Contentful Paint<br><small style="color: #666;">${getCWVStatus('lcp', lcp)}</small></div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${inp}</div>
            <div class="stat-label">Interaction to Next Paint<br><small style="color: #666;">${getCWVStatus('inp', inp)}</small></div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${cls}</div>
            <div class="stat-label">Cumulative Layout Shift<br><small style="color: #666;">${getCWVStatus('cls', cls)}</small></div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${fcp}</div>
            <div class="stat-label">First Contentful Paint</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${ttfb}</div>
            <div class="stat-label">Time to First Byte</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${tti}</div>
            <div class="stat-label">Time to Interactive</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${speedIndex}</div>
            <div class="stat-label">Speed Index</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${tbt}</div>
            <div class="stat-label">Total Blocking Time</div>
          </div>
        </div>
      </div>

      <!-- Opportunities Section -->
      ${results?.opportunities && results.opportunities.length > 0 ? `
        <div class="issues-section">
          <h2>🚀 Förbättringsmöjligheter</h2>
          <p style="color: #666; margin-bottom: 20px;">Dessa optimeringar kan förbättra din webbplats prestanda:</p>
          ${results.opportunities.map(opp => `
            <div class="issue-item issue-warning" style="border-left: 4px solid #f59e0b; margin-bottom: 16px;">
              <div class="issue-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span>${this.safeText(opp.title)}</span>
                ${opp.displayValue ? `<span style="color: #f59e0b; font-weight: bold; font-size: 14px;">${this.safeText(opp.displayValue)}</span>` : ''}
              </div>

              <!-- Impact/Effort Classification -->
              ${(opp.impact || opp.effort || opp.timeEstimate) ? `
                <div style="display: flex; gap: 8px; margin-top: 8px; margin-bottom: 8px; flex-wrap: wrap;">
                  ${opp.impact ? `
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;
                                  background-color: ${opp.impact === 'Hög' ? '#fee2e2' : opp.impact === 'Medel' ? '#fef3c7' : '#ecfdf5'};
                                  color: ${opp.impact === 'Hög' ? '#dc2626' : opp.impact === 'Medel' ? '#d97706' : '#059669'};
                                  border: 1px solid ${opp.impact === 'Hög' ? '#fecaca' : opp.impact === 'Medel' ? '#fde68a' : '#bbf7d0'};">
                      Impact: ${opp.impact}
                    </span>
                  ` : ''}
                  ${opp.effort ? `
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;
                                  background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
                      Insats: ${opp.effort}
                    </span>
                  ` : ''}
                  ${opp.timeEstimate ? `
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;
                                  background-color: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe;">
                      Tid: ${opp.timeEstimate}
                    </span>
                  ` : ''}
                </div>
              ` : ''}

              <div class="issue-description" style="margin-top: 8px;">
                ${this.safeText(opp.description)}
              </div>
              ${opp.estimatedSavings ? `
                <div style="background: #fef3c7; padding: 8px; border-radius: 4px; margin-top: 8px; font-size: 13px;">
                  <strong>Uppskattad besparing:</strong> ${opp.estimatedSavings}s laddningstid
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Diagnostics Section -->
      ${results?.diagnostics && results.diagnostics.length > 0 ? `
        <div class="issues-section">
          <h2>🔍 Diagnostik & Analys</h2>
          <p style="color: #666; margin-bottom: 20px;">Teknisk analys av webbplatsens prestanda:</p>
          ${results.diagnostics.map(diag => `
            <div class="issue-item issue-info" style="border-left: 4px solid #17a2b8;">
              <div class="issue-title" style="display: flex; justify-content: space-between; align-items: center;">
                <span>${this.safeText(diag.title)}</span>
                ${diag.displayValue ? `<span style="color: #17a2b8; font-weight: bold; font-size: 14px;">${this.safeText(diag.displayValue)}</span>` : ''}
              </div>
              <div class="issue-description" style="margin-top: 8px;">
                ${this.safeText(diag.description)}
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Performance Summary -->
      <div class="issues-section">
        <h2>Prestandasammanfattning</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h4 style="margin: 0 0 15px 0; color: #333;">Vad betyder poängen?</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin: 8px 0; color: #15803d;"><strong>90-100:</strong> Utmärkt prestanda</li>
            <li style="margin: 8px 0; color: #f59e0b;"><strong>50-89:</strong> Behöver förbättring</li>
            <li style="margin: 8px 0; color: #ef4444;"><strong>0-49:</strong> Dålig prestanda</li>
          </ul>

          <h4 style="margin: 20px 0 15px 0; color: #333;">Core Web Vitals tröskelvärden:</h4>
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin: 8px 0;"><strong>LCP:</strong> ≤2.5s (bra), 2.5-4s (förbättring), >4s (dålig)</li>
            <li style="margin: 8px 0;"><strong>INP:</strong> ≤200ms (bra), 200-500ms (förbättring), >500ms (dålig)</li>
            <li style="margin: 8px 0;"><strong>CLS:</strong> ≤0.1 (bra), 0.1-0.25 (förbättring), >0.25 (dålig)</li>
          </ul>
        </div>
      </div>
    `;
  }
  
  generateCrawlContent(results, summary) {
    // Handle both old and new crawl data formats
    const pages = results?.pages || results?.crawledPages || [];
    const crawlSummary = results?.summary || summary || {};
    const issues = crawlSummary?.issues || {};
    
    const pagesCount = pages.length || summary?.performance?.pagesAnalyzed || 0;
    const brokenLinks = issues?.brokenLinks || results?.brokenLinks || [];
    const brokenImages = issues?.brokenImages || results?.brokenImages || [];
    const missingTitles = issues?.missingTitles || [];
    const missingH1 = issues?.missingH1 || [];
    const totalIssues = crawlSummary?.totalIssues || summary?.issues || 0;
    const score = summary?.score || crawlSummary?.score || 0;
    
    const scoreClass = score >= 80 ? 'score-good' : score >= 60 ? 'score-warning' : 'score-error';
    
    return `
      <div class="score-section">
        <div class="score-circle ${scoreClass}">
          ${score}
        </div>
        <h2>Crawl Analysis Score</h2>
        <p>Overall website health based on ${pagesCount} pages analyzed</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${pagesCount}</div>
          <div class="stat-label">Pages Crawled</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${totalIssues}</div>
          <div class="stat-label">Total Issues</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${brokenLinks.length}</div>
          <div class="stat-label">Broken Links</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${brokenImages.length}</div>
          <div class="stat-label">Broken Images</div>
        </div>
      </div>
      
      ${pagesCount > 0 ? `
        <div class="section">
          <h2>Page Analysis Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${missingTitles.length}</div>
              <div class="stat-label">Missing Titles</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${missingH1.length}</div>
              <div class="stat-label">Missing H1 Tags</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${crawlSummary?.sitemapFound ? 'Yes' : 'No'}</div>
              <div class="stat-label">Sitemap Found</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${crawlSummary?.robotsFound ? 'Yes' : 'No'}</div>
              <div class="stat-label">Robots.txt Found</div>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${brokenLinks.length > 0 ? `
        <div class="section">
          <h2>Broken Links Found (${brokenLinks.length})</h2>
          ${brokenLinks.slice(0, 10).map(link => `
            <div class="issue-item issue-critical">
              <span class="issue-icon">❌</span>
              <div class="issue-content">
                <strong>Broken Link</strong>
                <p>${link.targetUrl || link.url}</p>
                <small>Status: ${link.statusCode || link.status} - Found on: ${link.sourceUrl || link.foundOn}</small>
              </div>
            </div>
          `).join('')}
          ${brokenLinks.length > 10 ? `
            <p><em>... and ${brokenLinks.length - 10} more broken links</em></p>
          ` : ''}
        </div>
      ` : ''}
      
      ${brokenImages.length > 0 ? `
        <div class="section">
          <h2>Broken Images Found (${brokenImages.length})</h2>
          ${brokenImages.slice(0, 5).map(img => `
            <div class="issue-item issue-warning">
              <span class="issue-icon">⚠️</span>
              <div class="issue-content">
                <strong>Broken Image</strong>
                <p>${img.src}</p>
                <small>Found on: ${img.pageUrl}</small>
              </div>
            </div>
          `).join('')}
          ${brokenImages.length > 5 ? `
            <p><em>... and ${brokenImages.length - 5} more broken images</em></p>
          ` : ''}
        </div>
      ` : ''}
    `;
  }

  generateAIContent(results, summary) {
    // AI analysis results structure
    const report = results?.report || {};
    const score = results?.score || report?.score || 0;

    // Determine score class for styling
    const scoreClass = score >= 80 ? 'score-good' : score >= 60 ? 'score-warning' : 'score-error';

    // Helper to safely get array or empty array
    const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

    // Critical issues
    const criticalIssues = safeArray(report.criticalIssues);

    // Improvements
    const improvements = safeArray(report.improvements);

    // Comparison
    const comparison = report.comparison || {};
    const strengths = safeArray(comparison.strengths);
    const weaknesses = safeArray(comparison.weaknesses);
    const opportunities = safeArray(comparison.opportunities);

    // Impact projections
    const impact = report.impact || {};

    // Score breakdown (calculate from report data if available)
    const scoreBreakdown = report.scoreBreakdown || {
      performance: Math.round(score * 0.75), // Estimate based on total
      seo: Math.round(score * 0.95),
      crawlHealth: 100,
      accessibility: Math.round(score * 0.94)
    };

    return `
      <!-- AI Score Section -->
      <div class="score-section">
        <div class="score-circle ${scoreClass}">
          ${score}
        </div>
        <h2>AI-Genererad SEO-Rapport</h2>
        <p>Professionell analys baserad på flera datakällor</p>
      </div>

      <!-- Score Breakdown -->
      <div class="issues-section">
        <h2>Poängfördelning</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">${scoreBreakdown.performance || 0}</div>
            <div class="stat-label">Performance (40%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${scoreBreakdown.seo || 0}</div>
            <div class="stat-label">SEO (30%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${scoreBreakdown.crawlHealth || 0}</div>
            <div class="stat-label">Crawl Health (20%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${scoreBreakdown.accessibility || 0}</div>
            <div class="stat-label">Tillgänglighet (10%)</div>
          </div>
        </div>
      </div>

      <!-- Critical Issues -->
      ${criticalIssues.length > 0 ? `
        <div class="issues-section">
          <h2>Kritiska Problem att Fixa Nu</h2>
          ${criticalIssues.map((issue, index) => `
            <div class="issue-item issue-critical">
              <div style="display: flex; gap: 15px; align-items: start;">
                <div style="
                  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                  color: white;
                  width: 35px;
                  height: 35px;
                  border-radius: 8px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: bold;
                  font-size: 18px;
                  flex-shrink: 0;
                ">
                  ${index + 1}
                </div>
                <div style="flex: 1;">
                  <div class="issue-title">${this.safeText(issue.issue || issue.title || 'Problem')}</div>
                  <div class="issue-description">${this.safeText(issue.description || '')}</div>
                  ${issue.action ? `
                    <div style="
                      background: #fef3c7;
                      border-left: 4px solid #f59e0b;
                      padding: 12px;
                      margin-top: 10px;
                      border-radius: 4px;
                      font-size: 13px;
                    ">
                      <strong style="color: #92400e;">Åtgärd:</strong> ${this.safeText(issue.action)}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <!-- Improvements -->
      ${improvements.length > 0 ? `
        <div class="issues-section" style="page-break-before: auto;">
          <h2>Förbättringsmöjligheter</h2>
          ${improvements.map((improvement) => {
            const priority = improvement.priority || 'Medium';
            const priorityColor =
              priority.toLowerCase() === 'high' ? '#fee2e2' :
              priority.toLowerCase() === 'medium' ? '#fed7aa' : '#dbeafe';
            const priorityTextColor =
              priority.toLowerCase() === 'high' ? '#991b1b' :
              priority.toLowerCase() === 'medium' ? '#9a3412' : '#1e40af';

            return `
              <div class="issue-item" style="border-left: 4px solid #667eea; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; gap: 12px; margin-bottom: 8px;">
                  <div class="issue-title">${this.safeText(improvement.area || improvement.title || 'Förbättring')}</div>
                  <span style="
                    background: ${priorityColor};
                    color: ${priorityTextColor};
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    white-space: nowrap;
                  ">${priority}</span>
                </div>
                <div class="issue-description">${this.safeText(improvement.description || improvement.action || '')}</div>
                ${improvement.action && improvement.action !== improvement.description ? `
                  <div style="
                    background: #f7fafc;
                    border-left: 3px solid #667eea;
                    padding: 10px;
                    margin-top: 8px;
                    border-radius: 4px;
                    font-size: 13px;
                  ">
                    <strong style="color: #667eea;">Åtgärd:</strong> ${this.safeText(improvement.action)}
                  </div>
                ` : ''}
                <div style="
                  display: flex;
                  gap: 15px;
                  margin-top: 10px;
                  padding-top: 10px;
                  border-top: 1px solid #e2e8f0;
                  font-size: 12px;
                  color: #718096;
                ">
                  ${improvement.estimatedTime ? `
                    <span>⏱️ ${this.safeText(improvement.estimatedTime)}</span>
                  ` : ''}
                  ${improvement.expectedImpact ? `
                    <span>📈 ${this.safeText(improvement.expectedImpact)}</span>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      ` : ''}

      <!-- Competitor Comparison -->
      ${(strengths.length > 0 || weaknesses.length > 0 || opportunities.length > 0) ? `
        <div class="issues-section" style="page-break-before: auto;">
          <h2>Konkurrentjämförelse</h2>
          ${comparison.summary ? `
            <p style="
              font-size: 15px;
              color: #4a5568;
              line-height: 1.6;
              margin-bottom: 20px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e2e8f0;
            ">${this.safeText(comparison.summary)}</p>
          ` : ''}

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-top: 20px;">
            ${strengths.length > 0 ? `
              <div>
                <h3 style="
                  font-size: 16px;
                  font-weight: bold;
                  color: #2d3748;
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  <span style="color: #10b981; font-size: 18px;">✓</span> Styrkor
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${strengths.map(item => `
                    <li style="
                      padding: 10px 0;
                      border-bottom: 1px solid #e2e8f0;
                      color: #4a5568;
                      line-height: 1.5;
                      font-size: 13px;
                    ">${this.safeText(item)}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            ${weaknesses.length > 0 ? `
              <div>
                <h3 style="
                  font-size: 16px;
                  font-weight: bold;
                  color: #2d3748;
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  <span style="color: #ef4444; font-size: 18px;">✗</span> Svagheter
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${weaknesses.map(item => `
                    <li style="
                      padding: 10px 0;
                      border-bottom: 1px solid #e2e8f0;
                      color: #4a5568;
                      line-height: 1.5;
                      font-size: 13px;
                    ">${this.safeText(item)}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            ${opportunities.length > 0 ? `
              <div>
                <h3 style="
                  font-size: 16px;
                  font-weight: bold;
                  color: #2d3748;
                  margin-bottom: 12px;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                ">
                  <span style="color: #f59e0b; font-size: 18px;">💡</span> Möjligheter
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  ${opportunities.map(item => `
                    <li style="
                      padding: 10px 0;
                      border-bottom: 1px solid #e2e8f0;
                      color: #4a5568;
                      line-height: 1.5;
                      font-size: 13px;
                    ">${this.safeText(item)}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Expected Impact -->
      ${(impact.immediate || impact.short_term || impact.long_term) ? `
        <div class="issues-section" style="page-break-before: auto;">
          <h2>Förväntad Effekt</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            ${impact.immediate ? `
              <div style="
                background: white;
                border-top: 4px solid #667eea;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              ">
                <h3 style="
                  font-size: 15px;
                  font-weight: bold;
                  color: #667eea;
                  margin: 0 0 10px 0;
                ">Omedelbar (1-4 veckor)</h3>
                <p style="
                  font-size: 13px;
                  color: #4a5568;
                  line-height: 1.6;
                  margin: 0;
                ">${this.safeText(impact.immediate)}</p>
              </div>
            ` : ''}

            ${impact.short_term ? `
              <div style="
                background: white;
                border-top: 4px solid #667eea;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              ">
                <h3 style="
                  font-size: 15px;
                  font-weight: bold;
                  color: #667eea;
                  margin: 0 0 10px 0;
                ">Kort sikt (1-3 månader)</h3>
                <p style="
                  font-size: 13px;
                  color: #4a5568;
                  line-height: 1.6;
                  margin: 0;
                ">${this.safeText(impact.short_term)}</p>
              </div>
            ` : ''}

            ${impact.long_term ? `
              <div style="
                background: white;
                border-top: 4px solid #667eea;
                border-radius: 8px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              ">
                <h3 style="
                  font-size: 15px;
                  font-weight: bold;
                  color: #667eea;
                  margin: 0 0 10px 0;
                ">Lång sikt (3-12 månader)</h3>
                <p style="
                  font-size: 13px;
                  color: #4a5568;
                  line-height: 1.6;
                  margin: 0;
                ">${this.safeText(impact.long_term)}</p>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Summary if no specific data -->
      ${criticalIssues.length === 0 && improvements.length === 0 ? `
        <div class="issues-section">
          <h2>Sammanfattning</h2>
          <p>AI-analysen har genererats men detaljerad data är inte tillgänglig. Kontrollera att alla underliggande analyser (SEO, Lighthouse, Crawl) har körts korrekt.</p>
        </div>
      ` : ''}
    `;
  }
}

module.exports = new PDFRenderer();