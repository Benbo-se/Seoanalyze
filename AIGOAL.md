# AI-Driven SEO Analysis - Project Goal

## 🎯 Vision & Mål

### Vad är AI-analysen?
En professionell SEO-rapport som kombinerar:
- Fullständig webbplatscrawl (befintlig teknologi)
- Lighthouse performance-analys (befintlig teknologi)
- **NYT: Automatisk konkurrentjämförelse (3 konkurrenter)**
- **NYT: AI-driven analys och prioritering (DeepSeek)**
- **NYT: Konkreta handlingsplaner med kod-exempel**
- **NYT: Historisk tracking över tid**

### Varför gör vi den?
- **Differentiera oss**: Skilja oss från gratis-verktyg som bara visar data
- **Öka värdet**: Från "här är problemen" till "här är lösningen + i vilken ordning"
- **Öka trafik**: Locka fler användare med premium-feature som är gratis
- **Testimonials**: Professionell rapport = mer delningsbar = organisk tillväxt
- **Monetization path**: Kan senare bli premium medan basic analyser är gratis

### Vad skiljer den från befintliga analyser?

| Feature | SEO/CRAWL/PERF (befintlig) | AI-Analys (ny) |
|---------|---------------------------|----------------|
| Hastighet | Snabb (10-30s) | Långsam (60-90s) |
| Omfattning | En webbplats | 4 webbplatser (user + 3 konkurrenter) |
| Output | Teknisk data | Strategisk handlingsplan |
| Konkurrenter | Nej | Ja (automatiskt) |
| AI-insights | Nej | Ja (DeepSeek) |
| Prioritering | Användaren väljer | AI prioriterar |
| Kod-exempel | Begränsat | Omfattande |
| Historik | Nej | Ja |
| Use case | "Vad är fel?" | "Vad ska jag göra? Hur? I vilken ordning?" |

---

## 💎 Värdeproposition

### Vad användaren får:
1. ✅ **Komplett SEO-crawl** av hela webbplatsen
2. ✅ **Lighthouse performance-analys** (Core Web Vitals)
3. ✅ **LIX-analys** (svensk läsbarhet)
4. ✅ **Automatisk konkurrentidentifiering** (3 SEO-konkurrenter)
5. ✅ **Konkurrentjämförelse** (sida-vid-sida tabell)
6. ✅ **AI-prioriterad handlingsplan** (kritiskt → viktigt → långsiktigt)
7. ✅ **Konkreta kod-exempel** (copy-paste lösningar)
8. ✅ **Effektuppskattningar** (förväntad ROI)
9. ✅ **Historisk tracking** (följ förbättring över tid)
10. ✅ **PDF-export** (dela med team/chef)

### Värde vs konkurrenter:

|  | Vi | Screaming Frog | Sitebulb | SEMrush | Byrå |
|--|---|----------------|----------|---------|------|
| **Pris** | Gratis | £149/år | $420/år | $1548/år | 15-50k kr |
| **SEO Crawl** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Performance** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **LIX (svenska)** | ✅ | ❌ | ❌ | ❌ | Manuell |
| **Konkurrentjämförelse** | ✅ Auto | ❌ | ❌ | ✅ Manuell | ✅ |
| **AI-analys** | ✅ | ❌ | ❌ | Begränsad | ✅ |
| **Kod-exempel** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Historik** | ✅ | ❌ | ✅ | ✅ | ✅ |
| **No signup** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Kostnad för oss:
- **DeepSeek AI**: ~5 öre/analys
- **Server (crawl 4 sites)**: ~2 öre/analys
- **Databas storage**: ~1 öre/analys
- **Total**: **~8 öre/analys**

Med 1000 analyser/månad = 80 kr i kostnader. Extremt skalbart.

---

## 🎨 User Flow

### 1. Startsida (befintlig + ny CTA)

**VIKTIGT**: Befintlig funktionalitet får INTE påverkas!

```
┌────────────────────────────────────────────────┐
│ BEFINTLIG HERO (oförändrad)                    │
│                                                 │
│ [SEO] [CRAWL] [PERF]                           │
│ [Analysera nu]                                  │
└────────────────────────────────────────────────┘

                    ↓
              (eller-sektion)
                    ↓

┌────────────────────────────────────────────────┐
│ 🤖 Vill du ha en AI-driven professionell       │
│    SEO-rapport med konkurrentjämförelse?       │
│                                                 │
│ • Jämför dig mot 3 konkurrenter                │
│ • Få prioriterad handlingsplan                 │
│ • Konkreta kod-exempel                         │
│ • Helt gratis under beta                       │
│                                                 │
│ [Läs mer om AI-analysen →]                     │
└────────────────────────────────────────────────┘
```

### 2. Landingpage: /ai-analys

**Hero:**
```
🤖 AI-driven SEO-analys med konkurrentjämförelse

Få en professionell SEO-rapport som visar exakt vad du ska
fixa, i vilken ordning, och hur det påverkar din ranking.

[Starta AI-analys ↓]
```

**Vad du får (benefits):**
- Grid med ikoner + beskrivningar
- Visuell jämförelse: "Din site" vs "3 konkurrenter"
- Exempel på rapport-snippets

**Vs konkurrenter (trust):**
- Tabell (som ovan)
- Social proof om möjligt

**CTA (samma stil som startsida):**
```
┌────────────────────────────────────────┐
│ Ange din webbplats                     │
│ [www.dinwebbplats.se]                  │
│                                         │
│ [🤖 Starta AI-analys (60-90s)]         │
│                                         │
│ Ingen registrering • Gratis under beta │
└────────────────────────────────────────┘
```

### 3. Loading: /ai-analys/[jobId]

**Live progress-indikator:**
```
┌────────────────────────────────────────┐
│ 🤖 AI analyserar ekonomistudion.se     │
│                                         │
│ ✅ Crawlade din webbplats (15 sidor)   │
│ ✅ Analyserade prestanda               │
│ ✅ Identifierade konkurrenter          │
│ 🔄 Crawlar konkurrenter (2/3)...       │
│ ⏸️  AI-analys väntar...                 │
│                                         │
│ [████████████░░░░] 75%                 │
│                                         │
│ Uppskattat: 30 sekunder kvar           │
└────────────────────────────────────────┘
```

### 4. Rapport: /ai-analys/[jobId] (completed)

**Sektioner:**

1. **Executive Summary**
```
┌────────────────────────────────────────┐
│ 🎯 SEO-hälsa: 67/100                   │
│ Status: Gott, men kan förbättras       │
│                                         │
│ Din webbplats har bra grundstruktur    │
│ men saknar viktig SEO-optimering jämfört│
│ med konkurrenterna.                     │
│                                         │
│ • 3 kritiska problem                   │
│ • 8 förbättringsmöjligheter            │
│ • Potential: +35-45% organisk trafik   │
└────────────────────────────────────────┘
```

2. **Konkurrentjämförelse**
```
┌──────────────────────────────────────────────────────┐
│ 📊 DU VS KONKURRENTER                                │
├──────────────────────────────────────────────────────┤
│                  Du    Konk 1  Konk 2  Konk 3  Snitt │
│ Antal sidor      15      42      38      28     36   │
│ Ord/sida        450    1250    1180     890   1107   │
│ LIX              52      45      48      44     46   │
│ Laddningstid   4.2s    2.1s    1.8s    2.9s    2.3s  │
│ Meta desc.     3/15   42/42   38/38   28/28   100%  │
│ H2/sida           3       8      12       6      9   │
│ Bilder alt    12/45   98/98   87/87   56/56   100%  │
├──────────────────────────────────────────────────────┤
│ 💡 Vi analyserade ekonomikonsult.se, redovisnings-  │
│    byrån.se, och bokföring.se (dina största SEO-    │
│    konkurrenter baserat på Google-ranking)          │
└──────────────────────────────────────────────────────┘
```

3. **AI-prioriterad handlingsplan**
```
┌────────────────────────────────────────┐
│ 🔴 ÅTGÄRDA NU (högsta prioritet)       │
├────────────────────────────────────────┤
│ 1. ⚡ Långsam laddningstid              │
│    Nuvarande: 4.2s | Mål: <2.5s        │
│    Impact: Hög | Effort: Medel         │
│                                         │
│    💡 Komprimera bilder (-2.3 MB)      │
│    💡 Aktivera browser caching         │
│    💡 Minifiera CSS/JS                 │
│                                         │
│    Konkurrenterna laddar 48% snabbare  │
│    än dig. Google prioriterar snabba   │
│    sidor i ranking.                    │
│                                         │
│    [Visa kod-exempel ↓]                │
│                                         │
│ 2. 📝 Meta descriptions saknas          │
│    12 av 15 sidor saknar beskrivning   │
│    Impact: Hög | Effort: Låg           │
│    ...                                  │
└────────────────────────────────────────┘
```

4. **Konkreta kod-exempel**
```
┌────────────────────────────────────────┐
│ 💻 SÅ HÄR FIXAR DU DET                 │
├────────────────────────────────────────┤
│ Problem: Saknar meta description       │
│                                         │
│ ❌ FÖRE:                                │
│ <head>                                 │
│   <title>Ekonomistudion</title>       │
│ </head>                                │
│                                         │
│ ✅ EFTER:                               │
│ <head>                                 │
│   <title>Ekonomistudion - Expert på   │
│    företagsekonomi | Stockholm</title>│
│   <meta name="description"            │
│     content="Professionell ekonomi-   │
│     rådgivning för företag i Stockholm│
│     Redovisning, bokföring & skatt."> │
│ </head>                                │
│                                         │
│ 📋 [Kopiera kod]                       │
│ 📖 [Läs mer om meta descriptions]     │
└────────────────────────────────────────┘
```

5. **Förväntad effekt**
```
┌────────────────────────────────────────┐
│ 📈 FÖRVÄNTAD EFFEKT                    │
├────────────────────────────────────────┤
│ Om du fixar alla kritiska problem:     │
│                                         │
│ Laddningstid: 4.2s → 1.8s (-57%) ⚡    │
│ Google-ranking: +15-25 platser 📈      │
│ Organisk trafik: +35-45% 📊            │
│ Bounce rate: 65% → 48% 🎯              │
│                                         │
│ Baserat på branschdata och konkurrent- │
│ analys. Tidskostnad: 4-6 timmar.       │
└────────────────────────────────────────┘
```

6. **Actions**
```
┌────────────────────────────────────────┐
│ [📥 Ladda ner PDF-rapport]             │
│ [📧 Emaila rapporten till mig]         │
│ [🔄 Kör om analys om 30 dagar]         │
│ [📊 Se historik] (om tidigare analys)  │
└────────────────────────────────────────┘
```

---

## 🏗️ Teknisk Arkitektur

### Nya routes:

1. **`/ai-analys`** (landingpage)
   - Static page med info + CTA
   - Samma form-komponent som startsidan (återanvänd)
   - POST till `/api/ai-analyze`

2. **`/ai-analys/[jobId]`** (resultat)
   - Loading state (polling `/api/ai-analyze/[jobId]/status`)
   - Rapport-vy när klar
   - Delbar via URL

### Nya API endpoints:

1. **`POST /api/ai-analyze`**
   - Input: `{ url: "ekonomistudion.se" }`
   - Output: `{ jobId: "abc123" }`
   - Startar background job

2. **`GET /api/ai-analyze/[jobId]/status`**
   - Output: `{ status: "crawling" | "analyzing" | "completed", progress: 0-100, result?: {...} }`

3. **`GET /api/ai-analyze/[jobId]/download`**
   - Genererar PDF
   - Returnerar fil

### Workflow (backend):

```javascript
// POST /api/ai-analyze
async function aiAnalyze(url) {
  const jobId = generateJobId();

  // 1. Spara job i DB (status: "pending")
  await db.aiAnalysis.create({ id: jobId, url, status: "pending" });

  // 2. Starta background job (återanvänd befintlig queue)
  await queue.add("ai-analysis", { jobId, url });

  return { jobId };
}

// Background worker
async function processAiAnalysis({ jobId, url }) {
  try {
    // 1. Crawla user's site (återanvänd befintlig crawler)
    updateStatus(jobId, "crawling_user", 10);
    const userSite = await crawlSite(url, maxPages: 100);

    // 2. Hitta konkurrenter
    updateStatus(jobId, "finding_competitors", 25);
    const competitors = await findCompetitors(userSite);
    // competitors = ["ekonomikonsult.se", "redovisningsbyrån.se", "bokföring.se"]

    // 3. Crawla konkurrenter (parallellt)
    updateStatus(jobId, "crawling_competitors", 40);
    const competitorData = await Promise.all(
      competitors.map(comp => crawlSite(comp, maxPages: 50))
    );

    // 4. Aggregera data
    updateStatus(jobId, "aggregating_data", 70);
    const analysisData = {
      user: {
        url,
        seo: userSite.seo,
        lighthouse: userSite.lighthouse,
        lix: userSite.lix,
        wordCount: userSite.wordCount,
        pages: userSite.pages.length,
        // ... all befintlig data
      },
      competitors: competitorData.map(comp => ({
        url: comp.url,
        seo: comp.seo,
        // ... samma data som user
      }))
    };

    // 5. Skicka till DeepSeek AI
    updateStatus(jobId, "ai_analysis", 80);
    const aiReport = await generateAiReport(analysisData);

    // 6. Spara resultat
    updateStatus(jobId, "completed", 100);
    await db.aiAnalysis.update(jobId, {
      status: "completed",
      result: {
        data: analysisData,
        report: aiReport
      }
    });

  } catch (error) {
    await db.aiAnalysis.update(jobId, {
      status: "failed",
      error: error.message
    });
  }
}
```

### AI-integration (DeepSeek):

```javascript
async function generateAiReport(analysisData) {
  const prompt = `
Du är en erfaren SEO-konsult. Analysera följande data och skapa en
professionell SEO-rapport på svenska.

ANVÄNDARENS WEBBPLATS:
${JSON.stringify(analysisData.user, null, 2)}

KONKURRENTER (3 st):
${JSON.stringify(analysisData.competitors, null, 2)}

UPPGIFT:
1. Jämför användaren mot konkurrenterna
2. Identifiera 3 kritiska problem (high impact, fixable)
3. Identifiera 5-8 viktiga förbättringar
4. Ge konkreta kod-exempel för top 3 problemen
5. Uppskatta effekt (ranking, trafik, conversions)
6. Prioritera baserat på impact vs effort

FORMAT (JSON):
{
  "summary": {
    "score": 0-100,
    "status": "string",
    "description": "2-3 meningar",
    "criticalIssues": number,
    "improvements": number,
    "potentialTrafficIncrease": "X-Y%"
  },
  "comparison": {
    "metrics": [
      {
        "name": "Antal sidor",
        "user": number,
        "competitor1": number,
        "competitor2": number,
        "competitor3": number,
        "average": number
      },
      // ... fler metrics
    ],
    "insight": "string"
  },
  "criticalIssues": [
    {
      "title": "string",
      "current": "string",
      "target": "string",
      "impact": "high|medium|low",
      "effort": "high|medium|low",
      "description": "string",
      "solution": ["string"],
      "codeExample": {
        "before": "string",
        "after": "string",
        "language": "html|css|js"
      },
      "competitorInsight": "string"
    }
  ],
  "improvements": [ /* samma struktur */ ],
  "expectedImpact": {
    "loadTime": { "before": "4.2s", "after": "1.8s", "change": "-57%" },
    "ranking": "+15-25 platser",
    "traffic": "+35-45%",
    "bounceRate": { "before": "65%", "after": "48%" }
  }
}
`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Du är en expert SEO-konsult.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

### Konkurrent-identifiering:

```javascript
async function findCompetitors(userSite) {
  // 1. Extrahera keywords från user's site
  const keywords = extractTopKeywords(userSite, limit: 5);
  // -> ["ekonomikonsult", "stockholm", "redovisning", "företag", "bokföring"]

  // 2. Bygg Google-sökning
  const domain = new URL(userSite.url).hostname;
  const tld = domain.split('.').pop(); // "se"
  const query = `${keywords.join(' ')} site:*.${tld} -site:${domain}`;
  // -> "ekonomikonsult stockholm redovisning... site:*.se -site:ekonomistudion.se"

  // 3. Sök Google (använd puppeteer eller API)
  const searchResults = await searchGoogle(query, limit: 10);

  // 4. Filtrera relevanta resultat
  const competitors = searchResults
    .filter(result => {
      // Ta bort listor, jämförelsesajter, wikipedia etc
      const blacklist = ['wikipedia', 'pricerunner', 'prisjakt', 'google'];
      return !blacklist.some(b => result.url.includes(b));
    })
    .slice(0, 3)
    .map(r => r.url);

  return competitors;
}

function extractTopKeywords(siteData, limit = 5) {
  // 1. Samla all text från H1, H2, meta description, title
  const text = [
    siteData.seo?.h1?.join(' '),
    siteData.seo?.h2?.join(' '),
    siteData.seo?.metaDescription,
    siteData.seo?.title
  ].join(' ');

  // 2. Tokenize + remove stopwords
  const stopwords = ['och', 'i', 'är', 'för', 'på', 'med', 'att', 'en', 'som', 'av', 'till', 'från'];
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopwords.includes(w));

  // 3. Count frequency
  const frequency = {};
  words.forEach(w => frequency[w] = (frequency[w] || 0) + 1);

  // 4. Sort by frequency, return top N
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}
```

### Databas schema (Prisma):

```prisma
model AiAnalysis {
  id            String   @id @default(cuid())
  url           String
  status        String   // "pending" | "crawling_user" | "finding_competitors" | "crawling_competitors" | "aggregating_data" | "ai_analysis" | "completed" | "failed"
  progress      Int      @default(0) // 0-100

  // Results (när completed)
  userData      Json?    // Crawl data för user's site
  competitorData Json?   // Array av 3 konkurrenters data
  aiReport      Json?    // AI-genererad rapport

  // Metadata
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  error         String?

  // För historik (koppla till user om vi lägger till auth senare)
  userEmail     String?

  @@index([url, createdAt])
}
```

---

## 📋 Implementation Roadmap

### Fas 1: MVP (v1.0) - Vecka 1-2

**Mål**: Lansera grundläggande AI-analys

**Features:**
- ✅ Landingpage `/ai-analys` med info + CTA
- ✅ CTA på startsidan "Läs mer om AI-analysen"
- ✅ POST `/api/ai-analyze` - startar analys
- ✅ Automatisk konkurrentidentifiering (Google search)
- ✅ Crawl user + 3 konkurrenter (återanvänd befintlig crawler)
- ✅ DeepSeek AI-integration
- ✅ Basic AI-rapport med:
  - Executive summary
  - Konkurrentjämförelse (tabell)
  - Top 3 kritiska problem
  - 5 förbättringar
  - 2-3 kod-exempel
- ✅ Loading-sida med progress
- ✅ Resultat-sida med rapport
- ✅ Databas (Prisma schema)

**Tekniska tasks:**
1. Skapa `/src/app/ai-analys/page.js` (landingpage)
2. Skapa `/src/app/ai-analys/[jobId]/page.js` (resultat)
3. Skapa `/src/app/api/ai-analyze/route.js` (POST)
4. Skapa `/src/app/api/ai-analyze/[jobId]/status/route.js` (GET)
5. Implementera `findCompetitors()` funktion
6. Implementera `generateAiReport()` funktion (DeepSeek)
7. Skapa React-komponenter för rapport-rendering
8. Lägg till CTA på startsidan (under befintlig hero)
9. Prisma migration för `AiAnalysis` model
10. Testa hela flödet

**Success criteria:**
- User kan starta AI-analys
- Konkurrenter hittas automatiskt
- AI-rapport genereras framgångsrikt
- Rapport visas fint i UI
- Kostnad: <10 öre/analys

---

### Fas 2: Förbättringar (v1.1) - Vecka 3-4

**Mål**: Förbättra AI-rapporten och UX

**Features:**
- ✅ Bättre AI-prompt (mer actionable insights)
- ✅ Fler kod-exempel (top 5 problem)
- ✅ Effektuppskattningar (ranking, trafik, conversions)
- ✅ PDF-export
- ✅ Email-funktion (skicka rapport till email)
- ✅ Bättre error handling
- ✅ Retry logic om AI failar
- ✅ Caching (om samma site analyseras inom 24h, visa cached)

**Tekniska tasks:**
1. Förbättra `generateAiReport()` prompt
2. Implementera PDF-generering (återanvänd befintlig PDF-renderer)
3. Implementera email-funktion
4. Lägg till caching-logic
5. Bättre error messages
6. A/B testa olika AI-prompts

---

### Fas 3: Historisk tracking (v1.2) - Vecka 5-6

**Mål**: Spara historik och visa förbättring över tid

**Features:**
- ✅ Spara varje analys i databas
- ✅ Visa tidigare analyser (om samma URL)
- ✅ Jämför "Förra månaden vs Nu"
- ✅ Trend-grafer (score över tid)
- ✅ "Kör om analys om 30 dagar" reminder

**Tekniska tasks:**
1. Uppdatera databas-schema för historik
2. Implementera historik-vy
3. Skapa trend-grafer (Chart.js eller Recharts)
4. Lägg till reminder-funktion (email eller push notification)

---

### Fas 4: Premium features (v2.0) - Framtid

**Mål**: Monetization

**Features:**
- ✅ Freemium: 1 AI-analys/månad gratis, unlimited med premium
- ✅ Spara konkurrentlistor
- ✅ Schema'd analyser (auto-kör varje vecka/månad)
- ✅ White-label PDF (byrå-kunder)
- ✅ API-access

---

## 🚫 Viktiga Constraints

### Får INTE påverka:
- ❌ Befintlig startsida-layout (bara lägga till ny CTA-sektion)
- ❌ SEO/CRAWL/PERF funktionalitet (måste fungera som innan)
- ❌ Befintliga API endpoints
- ❌ Befintlig databas-struktur (bara lägga till ny tabell)
- ❌ Performance på befintliga features

### Måste vara:
- ✅ Helt separerad feature (egna routes, egna API endpoints)
- ✅ Kan leva sida-vid-sida med befintlig funktionalitet
- ✅ Kan tas bort utan att påverka resten av siten
- ✅ Återanvänder befintliga komponenter där möjligt (crawler, PDF, etc)

---

## 📊 Success Metrics

### KPIs:
1. **Conversion rate**: % av visitors som klickar "Läs mer"
   - Mål: >5% efter 1 månad

2. **Start rate**: % som startar AI-analys från landingpage
   - Mål: >20%

3. **Completion rate**: % som väntar tills rapporten är klar
   - Mål: >80%

4. **Avg time on report page**: Hur länge läser de rapporten?
   - Mål: >3 min (betyder att den är intressant)

5. **Share rate**: % som delar/exporterar PDF
   - Mål: >15%

6. **Return rate**: % som kör om analys inom 30 dagar
   - Mål: >10%

### Kvalitativa metrics:
- User feedback (survey efter rapport)
- Testimonials
- Social shares
- Organic mentions

---

## 💰 Cost & Monetization

### Kostnader:

**Per AI-analys:**
- DeepSeek API: ~5 öre
- Server (4 sites crawl): ~2 öre
- Database storage: ~1 öre
- **Total: ~8 öre/analys**

**Månadskostnad vid olika volymer:**
- 100 analyser/mån: 8 kr
- 1,000 analyser/mån: 80 kr
- 10,000 analyser/mån: 800 kr
- 100,000 analyser/mån: 8,000 kr

**Extremt skalbart!**

### Monetization strategy:

**Fas 1-3 (6 månader): Gratis för alla**
- Bygg användarbas
- Samla testimonials
- Få feedback
- Förbättra produkt

**Fas 4 (efter 6 mån): Freemium**
```
GRATIS:
• 1 AI-analys/månad
• Basic rapport
• 30 dagars historik

PREMIUM (299 kr/mån):
• 10 AI-analyser/månad
• Unlimited historik
• PDF white-label
• Priority support
• Email reminders

PRO (999 kr/mån):
• Unlimited analyser
• API-access
• Schema'd analyser
• Team collaboration
```

**ROI-beräkning:**
- 100 betalande premium users = 29,900 kr/mån
- Kostnader (1000 analyser): 80 kr/mån
- **Profit: 29,820 kr/mån (99.7% margin)**

---

## 🎯 Differentiators (varför vi är bättre)

### Vs Screaming Frog / Sitebulb:
- ✅ Vi har AI-analys (de har bara data)
- ✅ Vi har konkurrentjämförelse automatiskt
- ✅ Vi har kod-exempel
- ✅ Vi är gratis
- ✅ No signup required

### Vs SEMrush / Ahrefs:
- ✅ Vi är gratis (de kostar 1500-2000 kr/mån)
- ✅ Vi har LIX-analys (svenska)
- ✅ Vi är enklare (de är överväldigande)
- ✅ Vi fokuserar på actionable (de fokuserar på data)
- ❌ De har keyword research (vi har inte... än)
- ❌ De har backlink-analys (vi har inte... än)

### Vs SEO-byråer:
- ✅ Vi är instant (de tar dagar/veckor)
- ✅ Vi är gratis (de kostar 15-50k kr)
- ✅ Vi är objektiva (AI, inte säljare)
- ❌ De har manuell expert-granskning
- ❌ De har strategi-workshop
- ❌ De implementerar åt dig

**Vår position**: Mellan gratis-verktyg och dyra byråer. "Professional-grade rapport till hobbyist-pris."

---

## 🚀 Next Steps

1. **Godkänn detta dokument**
2. **Sätt upp DeepSeek API-key**
3. **Starta Fas 1 implementation**
4. **Testa med 3-5 test-siter**
5. **Lansera som beta**
6. **Samla feedback**
7. **Iterera**

---

## 📝 Notes

- Detta dokument är ett levande dokument - uppdatera när planer ändras
- All kod ska följa befintliga patterns i projektet
- Prioritera hastighet (MVP) över perfektion
- Användarfeedback styr utvecklingen
- Håll det enkelt - komplexitet kan läggas till senare

---

## 🔮 FRAMTIDA ANALYSTYPER (Rekommendationer 2025-12-21)

### Prioritet 1: Säkerhetsanalys (UI finns redan!)
**Status:** UI-komponenter (`SeoTabSecurity`, `SeoTabDNS`) väntar på data

**Innehåll:**
- HTTP security headers (CSP, HSTS, X-Frame-Options)
- SSL/TLS-kvalitet (certifikat, protokollversion)
- SPF/DMARC/DKIM för email-säkerhet
- Cookie-säkerhet (Secure, HttpOnly, SameSite)

**Implementering:** Enkel - kräver ingen extern API, endast HTTP requests

---

### Prioritet 2: Innehållsanalys
**Värde:** Hög - data finns redan från crawl

**Innehåll:**
- Duplicate content detection (jämför sidor på sajten)
- Thin content varningar (<300 ord)
- Keyword-densitet per sida
- Utökad läsbarhetsanalys (Flesch-Kincaid utöver LIX)
- Content gap-analys mot konkurrenter

---

### Prioritet 3: Bildoptimering
**Värde:** Populärt - många sajter missar detta

**Innehåll:**
- WebP/AVIF-användning vs äldre format
- Lazy loading-kontroll (loading="lazy")
- Responsive images (srcset, sizes)
- Komprimeringsgrad och filstorlek
- Alt-text kvalitet (inte bara finns/saknas)

---

### Prioritet 4: Teknisk SEO Deep Dive
**Värde:** Avancerat - skiljer oss från enkla verktyg

**Innehåll:**
- JavaScript-rendering check (SPA-problem)
- Canonicals-analys och konflikter
- Redirect chains (301/302 kedjor)
- hreflang-validering (internationella sajter)
- XML sitemap-validering
- Robots.txt-analys och konflikter

---

### Prioritet 5: Lokal SEO (Svenskt fokus!)
**Värde:** Unikt för svenska marknaden

**Innehåll:**
- Schema LocalBusiness-validering
- NAP-konsistens (Namn, Adress, Telefon)
- Google Maps embed-kontroll
- Öppettider i schema
- Svenska recensionsplattformar (Trustpilot, Reco)

---

### Implementeringsordning
1. **Säkerhetsanalys** - UI finns, bara backend behövs (1-2 dagar)
2. **Bildoptimering** - Stor användarnytta (2-3 dagar)
3. **Innehållsanalys** - Bygger på befintlig crawl-data (3-4 dagar)
4. **Teknisk SEO** - Avancerat värde (1 vecka)
5. **Lokal SEO** - Nischad men värdefull (1 vecka)

---

**Skapad**: 2025-10-06
**Senast uppdaterad**: 2025-12-21
**Status**: Planning
**Nästa milstolpe**: Fas 1 MVP implementation
