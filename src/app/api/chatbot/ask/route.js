import { NextResponse } from 'next/server';
import { prisma } from '@/core/prisma';

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(request) {
  const startTime = Date.now();

  try {
    const { message, sessionId, context } = await request.json();

    // Validate input
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Message too long (max 500 characters)' }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    // Build system prompt based on context
    const systemPrompt = buildSystemPrompt(context);

    // Call DeepSeek API
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...buildConversationHistory(context.conversationHistory),
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', response.status, errorData);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    const tokensUsed = data.usage?.total_tokens || 0;
    const cost = 0.02; // Approximate cost per request
    const responseTime = Date.now() - startTime;

    // Log to database
    const chatLog = await prisma.chatLog.create({
      data: {
        sessionId,
        userMessage: message,
        botResponse: answer,
        currentPage: context?.currentPage || null,
        analysisId: context?.analysisId || null,
        responseTime,
        tokensUsed,
        cost
      }
    });

    return NextResponse.json({
      answer,
      logId: chatLog.id,
      responseTime
    });

  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json({
      error: 'Ett fel uppstod. Försök igen eller kontakta reda@benbo.se',
      details: error.message
    }, { status: 500 });
  }
}

function buildSystemPrompt(context) {
  let prompt = `Du är en hjälpsam kundservice-bot för SEO Analyzer (seoanalyze.se).

VÅR TJÄNST:
- SEO-analys: Analyserar en sidas SEO-kvalitet (30-60s). Kollar title, meta, headings, bilder, LIX-läsbarhet.
- Crawl-analys: Crawlar hela webbplatsen, hittar 404, duplicates, tekniska problem (2-5 min).
- Lighthouse: Mäter prestanda och Core Web Vitals (LCP, FCP, TBT, CLS) (1-3 min).
- AI-analys: Kombinerar allt ovan + AI-rekommendationer + konkurrentjämförelse (60-90s).

VIKTIGT:
- Allt är GRATIS under beta
- Ingen registrering krävs
- Vi stödjer svenska webbplatser (LIX-analys)
- DeepSeek-powered AI för smarta rekommendationer

VANLIGA TERMER:
- LCP (Largest Contentful Paint) = Hur lång tid innan största innehållet syns. Bör vara <2.5s.
- FCP (First Contentful Paint) = Tid tills första innehållet syns. Bör vara <1.8s.
- TBT (Total Blocking Time) = Hur lång tid JavaScript blockerar sidan. Bör vara <200ms.
- CLS (Cumulative Layout Shift) = Hur mycket sidan "hoppar" när den laddas. Bör vara <0.1.
- LIX = Läsbarhetsindex för svenska texter. 30-40 = lätt, 40-50 = medel, 50+ = svår.
- Score 0 i Crawl = INTE att sajten är trasig, utan att det finns förbättringspotential (404, duplicates, etc).

SUPPORT:
- Om analys fastnar >5 min, be användare uppdatera sidan eller testa igen
- Om error 429, säg att de träffat rate limit och ska vänta 1 minut
- Om error 500, be dem kontakta reda@benbo.se

UPPGIFT:
- Svara på SVENSKA
- Var vänlig, hjälpsam och uppmuntrande
- Förklara tekniska termer i klartext
- Max 120 ord per svar
- Använd emojis sparsamt (max 1-2 per svar)
- Ge konkreta, actionable råd
- Om användare frågar om konkurrenter (Screaming Frog, etc), var ärlig om vad vi är bättre/sämre på`;

  // Add context if user is on a results page
  if (context?.currentPage) {
    if (context.currentPage.includes('/analyses/') || context.currentPage.includes('/ai-analys/')) {
      prompt += `\n\nKONTEXT: Användaren tittar just nu på en analysresultat-sida. De har kört en analys och ser resultaten.`;
    }

    if (context.currentPage.includes('/ai-analys/')) {
      prompt += `\nDe tittar specifikt på en AI-analys med konkurrentjämförelse.`;
    }
  }

  if (context?.analysisId) {
    prompt += `\nAnalysis ID: ${context.analysisId}`;
  }

  return prompt;
}

function buildConversationHistory(history) {
  if (!history || history.length === 0) return [];

  // Only take last 6 messages (3 exchanges) to avoid token limit
  const recentHistory = history.slice(-6);

  return recentHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
}
