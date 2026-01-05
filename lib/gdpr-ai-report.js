/**
 * GDPR AI Report Generator
 * Generates AI-powered GDPR compliance reports using DeepSeek
 */

const axios = require('axios');

async function generateGdprAiReport(analysisData) {
  try {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Extract cookie data
    const cookiesBeforeConsent = analysisData.cookiesBeforeConsent || [];
    const trackingCookies = cookiesBeforeConsent.filter(c => c.isTracking);
    const trackingScripts = analysisData.trackingScripts || [];

    // Cookie categories summary
    const cookieCategories = {};
    cookiesBeforeConsent.forEach(cookie => {
      const cat = cookie.category || 'unknown';
      cookieCategories[cat] = (cookieCategories[cat] || 0) + 1;
    });

    const prompt = `Du är en GDPR-expert och dataskyddsspecialist.
Analysera följande cookie- och tracking-data för en svensk webbplats och producera en professionell GDPR-rapport.
Skriv på professionell svenska med juridiskt korrekt terminologi.

WEBBPLATS: ${analysisData.url || 'Okänd'}

COOKIES IDENTIFIERADE INNAN SAMTYCKE (${cookiesBeforeConsent.length} st):
${cookiesBeforeConsent.length > 0 ? cookiesBeforeConsent.map(c => `- ${c.name}: ${c.category || 'okänd kategori'}${c.isTracking ? ' [TRACKING]' : ''}`).join('\n') : 'Inga cookies hittades'}

TRACKING-COOKIES (${trackingCookies.length} st):
${trackingCookies.length > 0 ? trackingCookies.map(c => `- ${c.name} (${c.category})`).join('\n') : 'Inga tracking-cookies'}

COOKIE-KATEGORIER:
${Object.entries(cookieCategories).map(([cat, count]) => `- ${cat}: ${count} st`).join('\n')}

TRACKING-SKRIPT DETEKTERADE (${trackingScripts.length} st):
${trackingScripts.length > 0 ? trackingScripts.map(s => `- ${s.name}: ${s.type}`).join('\n') : 'Inga tracking-skript hittades'}

COOKIE-BANNER:
- Finns cookie-banner: ${analysisData.banner?.exists ? 'Ja' : 'Nej'}
- Finns "Acceptera alla"-knapp: ${analysisData.banner?.hasAcceptAll ? 'Ja' : 'Nej'}
- Finns "Neka alla"-knapp: ${analysisData.banner?.hasRejectAll ? 'Ja' : 'Nej'}
- Detektionsmetod: ${analysisData.banner?.detectionMethod || 'Ej identifierad'}
- CMP-leverantör: ${analysisData.cmpProvider || 'Ej identifierad'}

COOKIE-BANNER TEXT (om tillgänglig):
${analysisData.banner?.text || 'Ingen bannertext extraherad'}

KNAPPAR I BANNERN:
${analysisData.banner?.buttons?.length > 0 ? analysisData.banner.buttons.join(', ') : 'Inga knappar identifierade'}

COOKIES EFTER "NEKA ALLA" (om testat):
${analysisData.cookiesAfterReject ? `${analysisData.cookiesAfterReject.length} cookies kvar` : 'Ej testat'}

ÖVERTRÄDELSER IDENTIFIERADE:
${analysisData.violations?.length > 0 ? analysisData.violations.map(v => `- ${v}`).join('\n') : 'Inga tydliga överträdelser'}

COMPLIANCE SCORE: ${analysisData.complianceScore || 0}/100
RISKNIVÅ: ${analysisData.riskLevel || 'unknown'}

INSTRUKTIONER:
Baserat på ovanstående data, analysera GDPR-efterlevnaden och producera en rapport.

VIKTIGT - AVGÖR FÖRST:
1. Är detta en RIKTIG consent-banner eller bara marknadsföring/info-text?
   - Om bannertexten säger "No cookies", "Vi använder inga cookies", "Cookie-free" eller liknande = INTE en consent-banner
   - Om sajten tydligt kommunicerar att de inte använder tracking = behandla som "privacy by design" = BRA!
   - Om det bara är marknadsföringstext om integritet (men inga tracking-cookies hittades) = POSITIVT, inte en överträdelse

2. Om sajten INTE har tracking-cookies och INTE har en banner = "Privacy by design" (GDPR Artikel 25) = BÄSTA PRAXIS!

3. Bedöm den övergripande GDPR-risken baserat på:
   - Tracking-cookies INNAN samtycke (allvarligast)
   - Avsaknad av cookie-banner
   - Avsaknad av "Neka alla"-alternativ
   - Kvarvarande cookies efter nekande
   - Tredjepartsskript som laddar tracking

2. Identifiera KRITISKA problem (max 5) som kan leda till böter:
   - GDPR-artikel 7: Samtycke måste vara frivilligt och informerat
   - GDPR-artikel 6: Laglig grund för behandling
   - GDPR-artikel 25: Privacy by design
   - ePrivacy-direktivet: Cookies kräver samtycke

3. Ge konkreta rekommendationer för åtgärder

SVARSFORMAT (JSON, inga markdown-block):
{
  "riskLevel": "critical|high|medium|low",
  "complianceScore": 0-100,
  "summary": "2-3 meningar sammanfattning av GDPR-status",
  "criticalIssues": [
    {
      "issue": "Kort titel",
      "description": "Detaljerad beskrivning med hänvisning till GDPR-artikel",
      "action": "Konkret åtgärd",
      "gdprArticle": "Relevant GDPR-artikel (t.ex. Art. 7)"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "title": "Åtgärdstitel",
      "description": "Beskrivning av åtgärd",
      "estimatedTime": "Tidsuppskattning"
    }
  ],
  "compliantAspects": ["Lista saker som fungerar bra"],
  "potentialFineRisk": "Uppskattad botrisk (t.ex. 'Medel - upp till 2% av omsättning')",
  "legalBasis": {
    "required": "Vilken rättslig grund som krävs för cookie-användning",
    "current": "Nuvarande status baserat på analys"
  },
  "actionPlan": {
    "immediate": "Vad som bör göras inom 1 vecka",
    "shortTerm": "Vad som bör göras inom 1 månad",
    "longTerm": "Långsiktiga förbättringar"
  }
}

VIKTIGT:
- Skriv ALLT på professionell svenska
- Referera till specifika GDPR-artiklar där relevant
- Var saklig och juridiskt korrekt
- Om inga tracking-cookies hittas INNAN samtycke, är det positivt
- Cookie-banner med "Neka alla" är ett krav sedan januari 2022
- Svara ENDAST med JSON, inga markdown-codeblock`;

    console.log('🍪 Sending GDPR analysis request to DeepSeek AI...');

    // Note: Screenshot is captured but NOT sent to DeepSeek since deepseek-chat doesn't support images
    // The banner text and button texts are included in the prompt instead
    if (analysisData.banner?.screenshot) {
      console.log('📸 Banner screenshot captured (not sent to API - text used instead)');
    }

    const messages = [
      { role: 'system', content: 'Du är en GDPR- och dataskyddsexpert som ger juridiskt korrekta råd på svenska.' },
      { role: 'user', content: prompt }
    ];

    // Retry logic for DeepSeek API
    let retries = 3;
    let lastError;
    let response;

    while (retries > 0) {
      try {
        response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: messages,
          temperature: 0.5,  // Lower temperature for more consistent legal advice
          max_tokens: 3000
        }, {
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000  // 60 seconds timeout
        });
        break;  // Success, exit retry loop
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          console.log(`🍪 DeepSeek API failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response from DeepSeek API');
    }

    const aiResponse = response.data.choices[0].message.content;
    console.log('🍪 DeepSeek GDPR AI response received');

    // Parse JSON response
    let report;
    try {
      report = JSON.parse(aiResponse);
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          report = JSON.parse(jsonMatch[1]);
          console.log('🍪 Successfully extracted JSON from markdown');
        } catch (e2) {
          console.error('🍪 Failed to parse extracted JSON:', e2);
          report = {
            rawResponse: aiResponse,
            riskLevel: analysisData.riskLevel || 'unknown',
            complianceScore: analysisData.complianceScore || 0,
            summary: 'AI-analys kunde inte parsas korrekt',
            criticalIssues: [],
            recommendations: [],
            compliantAspects: [],
            potentialFineRisk: 'Okänd'
          };
        }
      } else {
        report = {
          rawResponse: aiResponse,
          riskLevel: analysisData.riskLevel || 'unknown',
          complianceScore: analysisData.complianceScore || 0,
          summary: 'AI-analys kunde inte parsas korrekt',
          criticalIssues: [],
          recommendations: [],
          compliantAspects: [],
          potentialFineRisk: 'Okänd'
        };
      }
    }

    return report;

  } catch (error) {
    console.error('🍪 Failed to generate GDPR AI report:', error);

    // Return fallback report
    return {
      error: error.message,
      riskLevel: analysisData.riskLevel || 'unknown',
      complianceScore: analysisData.complianceScore || 0,
      summary: 'AI-analys misslyckades - manuell granskning krävs',
      criticalIssues: [],
      recommendations: [
        {
          priority: 'high',
          title: 'Manuell GDPR-granskning',
          description: 'AI-analysen kunde inte slutföras. Anlita en GDPR-expert för manuell granskning.',
          estimatedTime: '1-2 veckor'
        }
      ],
      compliantAspects: [],
      potentialFineRisk: 'Okänd - manuell granskning krävs'
    };
  }
}

module.exports = { generateGdprAiReport };
