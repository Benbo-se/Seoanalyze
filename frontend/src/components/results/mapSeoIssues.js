// Helper som normaliserar SEO-issues från result-data
// Återanvänder samma logik som MergedIssuesPanel och extractIssues

export default function mapSeoIssues(result) {
  const issues = [];

  if (!result) return issues;

  // Meta-issues
  const title = result?.meta?.title || result?.title || '';
  const titleLen = title ? title.length : null;
  if (titleLen !== null && (titleLen < 30 || titleLen > 60)) {
    issues.push({
      id: 'title-length',
      category: 'Meta',
      title: titleLen < 30 ? 'Title för kort' : 'Title för lång',
      description: `Titel är ${titleLen} tecken, rekommenderat 30-60 tecken`,
      severity: titleLen < 10 || titleLen > 80 ? 'critical' : 'high',
      impact: Math.abs(titleLen - 45), // deviation from optimal ~45
      affected: '1 sida',
      anchorId: '#meta'
    });
  }

  const description = result?.meta?.description || result?.metaDescription || '';
  const descLen = description ? description.length : null;
  if (!description || (descLen !== null && (descLen < 80 || descLen > 160))) {
    issues.push({
      id: 'meta-description',
      category: 'Meta',
      title: !description ? 'Meta description saknas' : 'Meta description fel längd',
      description: description ? `${descLen} tecken, rekommenderat 80-160` : 'Ingen meta description hittades',
      severity: !description ? 'critical' : 'high',
      impact: description ? Math.abs(descLen - 120) : 100,
      affected: '1 sida',
      anchorId: '#meta'
    });
  }

  // H1-issues
  const h1Count = result?.headings?.h1?.length ?? result?.h1Count ?? null;
  if (h1Count !== null && h1Count !== 1) {
    issues.push({
      id: 'h1-count',
      category: 'Innehåll',
      title: h1Count === 0 ? 'H1-rubrik saknas' : 'Flera H1-rubriker',
      description: `${h1Count} H1-rubriker hittades, rekommenderat exakt 1`,
      severity: h1Count === 0 ? 'critical' : 'medium',
      impact: Math.abs(h1Count - 1),
      affected: '1 sida',
      anchorId: '#content'
    });
  }

  // Image alt-text issues
  if (result?.images?.withoutAlt > 0) {
    issues.push({
      id: 'missing-alt-text',
      category: 'Innehåll',
      title: 'Bilder saknar alt-text',
      description: `${result.images.withoutAlt} bilder saknar beskrivande alt-attribut`,
      severity: result.images.withoutAlt > 5 ? 'high' : 'medium',
      impact: result.images.withoutAlt,
      affected: `${result.images.withoutAlt} bilder`,
      anchorId: '#images'
    });
  }

  // Technical issues
  if (!result?.technical?.https) {
    issues.push({
      id: 'no-https',
      category: 'Tekniskt',
      title: 'HTTPS saknas',
      description: 'Sidan använder osäker HTTP istället för HTTPS',
      severity: 'critical',
      impact: 100,
      affected: '1 sida',
      anchorId: '#technical'
    });
  }

  if (!result?.mobile?.hasViewport) {
    issues.push({
      id: 'no-viewport',
      category: 'Tekniskt',
      title: 'Viewport meta-tag saknas',
      description: 'Sidan saknar viewport meta-tag för mobil responsivitet',
      severity: 'high',
      impact: 80,
      affected: '1 sida',
      anchorId: '#mobile'
    });
  }

  // Security issues
  if (result?.security?.issues?.length > 0) {
    result.security.issues.forEach((issue, index) => {
      issues.push({
        id: `security-${index}`,
        category: 'Säkerhet',
        title: issue.title || 'Säkerhetsproblem',
        description: issue.description || issue,
        severity: issue.severity || 'medium',
        impact: issue.impact || 50,
        affected: '1 sida',
        anchorId: '#security'
      });
    });
  }

  // Schema/Structured data issues
  const hasStructured = Array.isArray(result?.structuredData) 
    ? result.structuredData.length > 0 
    : Boolean(result?.technical?.hasSchema);
  
  if (!hasStructured) {
    issues.push({
      id: 'no-structured-data',
      category: 'Schema',
      title: 'Strukturerad data saknas',
      description: 'Ingen Schema.org markup hittades på sidan',
      severity: 'medium',
      impact: 30,
      affected: '1 sida',
      anchorId: '#schema'
    });
  }

  // Social media issues
  if (!result?.openGraph?.title) {
    issues.push({
      id: 'no-og-title',
      category: 'Social',
      title: 'Open Graph titel saknas',
      description: 'Ingen og:title specificerad för sociala medier',
      severity: 'medium',
      impact: 25,
      affected: '1 sida',
      anchorId: '#social'
    });
  }

  if (!result?.openGraph?.description) {
    issues.push({
      id: 'no-og-description',
      category: 'Social',
      title: 'Open Graph beskrivning saknas',
      description: 'Ingen og:description specificerad för sociala medier',
      severity: 'low',
      impact: 20,
      affected: '1 sida',
      anchorId: '#social'
    });
  }

  // Indexability issues
  const indexable = (typeof result?.indexable === 'boolean') 
    ? result.indexable 
    : (result?.robots?.noindex !== true);
    
  if (!indexable) {
    issues.push({
      id: 'not-indexable',
      category: 'Meta',
      title: 'Sidan är noindex',
      description: 'Sidan är markerad som noindex och kommer inte indexeras',
      severity: 'critical',
      impact: 100,
      affected: '1 sida',
      anchorId: '#meta'
    });
  }

  // Content length issues
  const wordCount = result?.content?.wordCount ?? result?.wordCount ?? null;
  if (wordCount !== null && wordCount < 300) {
    issues.push({
      id: 'low-word-count',
      category: 'Innehåll',
      title: 'För lite innehåll',
      description: `${wordCount} ord, rekommenderat minst 300 ord för bättre ranking`,
      severity: wordCount < 100 ? 'high' : 'medium',
      impact: 300 - wordCount,
      affected: '1 sida',
      anchorId: '#content'
    });
  }

  return issues;
}