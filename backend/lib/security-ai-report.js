/**
 * Security AI Report Generator
 * Generates AI-powered security reports using DeepSeek
 */

const axios = require('axios');

async function generateSecurityAiReport(analysisData) {
  try {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    // Extract security data
    const headers = analysisData.headers || {};
    const ssl = analysisData.ssl || {};
    const exposedFiles = analysisData.exposedFiles || [];
    const vulnerableLibraries = analysisData.vulnerableLibraries || [];
    const mixedContent = analysisData.mixedContent || { hasIssues: false, resources: [] };

    // Count header issues
    const missingHeaders = Object.entries(headers)
      .filter(([_, data]) => !data.present)
      .map(([name]) => name);

    const presentHeaders = Object.entries(headers)
      .filter(([_, data]) => data.present)
      .map(([name, data]) => ({ name, value: data.value, grade: data.grade }));

    const prompt = `Du är en erfaren IT-säkerhetsexpert och penetrationstestare.
Analysera följande säkerhetsdata för en webbplats och producera en professionell säkerhetsrapport.
Skriv på professionell svenska med tekniskt korrekt terminologi.

WEBBPLATS: ${analysisData.url || 'Okänd'}

ÖVERGRIPANDE SÄKERHETSBETYG: ${analysisData.grade || 'F'} (${analysisData.score || 0}/100)

SSL/TLS-CERTIFIKAT:
- Status: ${ssl.valid ? 'Giltigt' : 'Ogiltigt/Saknas'}
- Protokoll: ${ssl.protocol || 'Okänt'}
- Utfärdare: ${ssl.issuer || 'Okänd'}
- Utgår: ${ssl.expiresAt || 'Okänt'}
- Dagar kvar: ${ssl.daysUntilExpiry !== undefined ? ssl.daysUntilExpiry : 'Okänt'}
- Certifikatkedja: ${ssl.chainValid ? 'OK' : 'Problem'}

SECURITY HEADERS (${presentHeaders.length}/${Object.keys(headers).length} implementerade):

Saknade headers (${missingHeaders.length} st):
${missingHeaders.length > 0 ? missingHeaders.map(h => `- ${h}`).join('\n') : 'Inga saknade headers'}

Implementerade headers:
${presentHeaders.length > 0 ? presentHeaders.map(h => `- ${h.name}: ${h.value?.substring(0, 50) || 'Set'}... (Betyg: ${h.grade || 'N/A'})`).join('\n') : 'Inga headers implementerade'}

EXPONERADE KÄNSLIGA FILER (${exposedFiles.length} hittade):
${exposedFiles.length > 0 ? exposedFiles.map(f => `- ${f.path}: ${f.status === 200 ? 'TILLGÄNGLIG!' : f.status}`).join('\n') : 'Inga exponerade filer hittade'}

SÅRBARA JAVASCRIPT-BIBLIOTEK (${vulnerableLibraries.length} hittade):
${vulnerableLibraries.length > 0 ? vulnerableLibraries.map(lib => `- ${lib.library} v${lib.version}: ${lib.severity} - ${lib.vulnerability}`).join('\n') : 'Inga kända sårbarheter'}

MIXED CONTENT (HTTP på HTTPS-sida):
- Problem: ${mixedContent.hasIssues ? 'Ja' : 'Nej'}
${mixedContent.resources?.length > 0 ? `- Resurser: ${mixedContent.resources.slice(0, 5).join(', ')}` : ''}

RISKNIVÅ: ${analysisData.riskLevel || 'unknown'}

INSTRUKTIONER:
Baserat på ovanstående data, analysera säkerhetsstatusen och producera en rapport.

1. Bedöm den övergripande säkerhetsrisken:
   - SSL-problem är KRITISKA (man-in-the-middle risk)
   - Exponerade filer (.env, .git) är KRITISKA (dataintrång)
   - Saknade security headers ökar attack-ytan
   - Sårbara bibliotek kan utnyttjas för XSS, RCE etc.
   - Mixed content undergräver HTTPS-skyddet

2. Identifiera KRITISKA problem (max 5) som kräver omedelbar åtgärd:
   - Prioritera: Exponerade filer > SSL-problem > Sårbara libs > Headers
   - Förklara konsekvensen av varje sårbarhet
   - Ge OWASP-referens där relevant

3. Ge konkreta rekommendationer för åtgärder

SVARSFORMAT (JSON, inga markdown-block):
{
  "grade": "A|B|C|D|F",
  "score": 0-100,
  "riskLevel": "critical|high|medium|low",
  "summary": "2-3 meningar sammanfattning av säkerhetsstatus",
  "criticalIssues": [
    {
      "issue": "Kort titel",
      "description": "Detaljerad beskrivning med teknisk förklaring",
      "action": "Konkret åtgärd med kodexempel om relevant",
      "severity": "critical|high|medium|low",
      "owaspRef": "Relevant OWASP-referens (t.ex. A01:2021)"
    }
  ],
  "recommendations": [
    {
      "priority": "high|medium|low",
      "title": "Åtgärdstitel",
      "description": "Beskrivning av åtgärd",
      "implementation": "Teknisk implementation",
      "estimatedTime": "Tidsuppskattning"
    }
  ],
  "securityScore": {
    "ssl": 0-100,
    "headers": 0-100,
    "exposedFiles": 0-100,
    "libraries": 0-100,
    "mixedContent": 0-100
  },
  "strengths": ["Saker som fungerar bra"],
  "headerRecommendations": [
    {
      "header": "Header-namn",
      "recommended": "Rekommenderat värde",
      "reason": "Varför detta behövs"
    }
  ],
  "actionPlan": {
    "immediate": "Vad som MÅSTE göras inom 24-48 timmar",
    "shortTerm": "Vad som bör göras inom 1-2 veckor",
    "longTerm": "Långsiktiga säkerhetsförbättringar"
  },
  "complianceNotes": "Eventuella compliance-implikationer (PCI-DSS, ISO 27001)"
}

VIKTIGT:
- Skriv ALLT på professionell svenska
- Var tekniskt specifik - ge konkreta kodexempel där möjligt
- Prioritera efter faktisk risk, inte teoretisk
- Om sajten har betyg A/B, fokusera på fine-tuning snarare än kritik
- Svara ENDAST med JSON, inga markdown-codeblock`;

    console.log('🔒 Sending Security analysis request to DeepSeek AI...');

    // Retry logic for DeepSeek API
    let retries = 3;
    let lastError;
    let response;

    while (retries > 0) {
      try {
        response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Du är en erfaren IT-säkerhetsexpert som ger tekniskt korrekta råd på svenska.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,  // Lower temperature for consistent security advice
          max_tokens: 3500
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
          console.log(`🔒 DeepSeek API failed, retrying... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to get response from DeepSeek API');
    }

    const aiResponse = response.data.choices[0].message.content;
    console.log('🔒 DeepSeek Security AI response received');

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
          console.log('🔒 Successfully extracted JSON from markdown');
        } catch (e2) {
          console.error('🔒 Failed to parse extracted JSON:', e2);
          report = {
            rawResponse: aiResponse,
            grade: analysisData.grade || 'F',
            score: analysisData.score || 0,
            riskLevel: analysisData.riskLevel || 'unknown',
            summary: 'AI-analys kunde inte parsas korrekt',
            criticalIssues: [],
            recommendations: [],
            strengths: []
          };
        }
      } else {
        report = {
          rawResponse: aiResponse,
          grade: analysisData.grade || 'F',
          score: analysisData.score || 0,
          riskLevel: analysisData.riskLevel || 'unknown',
          summary: 'AI-analys kunde inte parsas korrekt',
          criticalIssues: [],
          recommendations: [],
          strengths: []
        };
      }
    }

    return report;

  } catch (error) {
    console.error('🔒 Failed to generate Security AI report:', error);

    // Return fallback report
    return {
      error: error.message,
      grade: analysisData.grade || 'F',
      score: analysisData.score || 0,
      riskLevel: analysisData.riskLevel || 'unknown',
      summary: 'AI-analys misslyckades - manuell granskning krävs',
      criticalIssues: [],
      recommendations: [
        {
          priority: 'high',
          title: 'Manuell säkerhetsgranskning',
          description: 'AI-analysen kunde inte slutföras. Anlita en säkerhetsexpert för manuell penetrationstest.',
          implementation: 'Kontakta en certifierad säkerhetskonsult',
          estimatedTime: '1-2 veckor'
        }
      ],
      strengths: [],
      headerRecommendations: []
    };
  }
}

module.exports = { generateSecurityAiReport };
