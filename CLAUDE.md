# CLAUDE.md - Läs detta först

Efter /compact eller ny session, läs filerna nedan i ordning.

## Obligatorisk läsning

1. **`goldenrules.md`** - Projektregler, struktur, förbud (VIKTIGAST)
2. **`mdfiler/credentials.md`** - Redis/PostgreSQL credentials, PM2 kommandon
3. **`mdfiler/SYSTEM-ARCHITECTURE-COMPLETE.md`** - Server, databaser, PM2, säkerhet

## Projektfiler

4. **`mdfiler/ux-forbattringar.md`** - UX/UI feedback och prioriterade förbättringar
5. **`mdfiler/framtid.md`** - Planerade funktioner (Lokal SEO nästa)
6. `README.md` - Tech stack, installation

## Snabbfakta

- **Projekt:** SEO Analyzer (seoanalyze.se)
- **Stack:** Next.js 15, React 19, Tailwind CSS 3.4, PostgreSQL, Redis, BullMQ, PM2
- **UI:** shadcn/ui-komponenter, Lucide-ikoner, Plus Jakarta Sans + Inter
- **Server:** DigitalOcean 4vCPU/8GB, Ubuntu 24.04
- **Sökväg:** `/opt/seo-analyzer-nextjs/`
- **Kontakt:** reda@benbo.se

---

## Senaste ändringar (2026-01-05)

### SESSION 2026-01-05 (natt) - SENASTE:

**Expert-rekommendationer implementerade:**

1. **sitemap.xml uppdaterad:**
   - Borttagna: `/seo-analys`, `/lighthouse-analys`, `/crawl-analys`, `/anvandarvillkor`
   - Tillagda: `/blogg`, `/faq`, `/kontakt`, `/om-oss`, `/bot`, `/integritetspolicy`
   - Tillagda: 3 bloggartiklar (`/blogg/lix-lasbarhet-seo`, etc.)
   - Alla lastmod uppdaterade till 2026-01-05

2. **FAQ accordion implementerad:**
   - Konverterad till client component med `'use client'`
   - React useState för öppna/stängda items
   - AccordionItem och CategoryAccordion komponenter
   - ChevronDown-ikon från Lucide (roterar vid öppning)
   - "Expandera alla" / "Stäng alla" knappar

3. **Emoji → Lucide på undersidor:**
   - `kontakt/page.js`: 📧→Mail, 🔧→Wrench, 💼→Briefcase, 🤝→Handshake
   - `om-oss/page.js`: 🇸🇪→Flag, 🤖→Bot, 💰→Banknote, 📊→BarChart3, 👨‍💻→Code

4. **FAQPage schema tillagt:**
   - JSON-LD med alla 26 frågor
   - Genereras dynamiskt från faqs-array
   - Injiceras via Next.js Script-komponent

5. **Article schema på bloggartiklar:**
   - `blogg/lix-lasbarhet-seo/page.js`
   - `blogg/vanliga-seo-misstag/page.js`
   - `blogg/forbattra-core-web-vitals/page.js`
   - Inkluderar: headline, description, datePublished, author, publisher, mainEntityOfPage

**Filer ändrade:**
- `public/sitemap.xml` - Uppdaterad med korrekta URLs
- `src/app/faq/page.js` - Accordion + FAQPage schema
- `src/app/kontakt/page.js` - Lucide-ikoner
- `src/app/om-oss/page.js` - Lucide-ikoner
- `src/app/blogg/lix-lasbarhet-seo/page.js` - Header + Article schema
- `src/app/blogg/vanliga-seo-misstag/page.js` - Header + Article schema
- `src/app/blogg/forbattra-core-web-vitals/page.js` - Header + Article schema

---

### SESSION 2026-01-05 (kväll):

**1. AI-Rapport navigering fixad:**
- HeroSection navigerar nu till `/ai-analys` istället för att köra analys direkt
- Användaren kan välja konkurrenter på dedikerad sida
- URL skickas som query param: `/ai-analys?url=...`
- `AiAnalysisLanding.jsx` läser URL från searchParams
- Lade till Suspense boundary i `/ai-analys/page.js`

**2. Ny logga installerad:**
- Ny 150x150 PNG-logga ersatte `SEOanalyzerLogo.png`
- Används i Header och Footer
- Källa: https://files.catbox.moe/dvlyer.png

**3. Favicons genererade:**
- 13 storlekar från 16x16 till 512x512
- Ny `favicon.ico` (multi-size ICO, 285KB)
- Använt: sharp + png-to-ico

**4. AI-resultat CSS fixad:**
- `.ai-results-loading` och `.ai-results-error` fick gradient-bakgrund
- Vit text syns nu mot lila bakgrund
- Fil: `src/styles/ai-results.css`

**Filer ändrade:**
- `src/components/common/HeroSection.jsx` - AI navigerar till /ai-analys
- `src/components/ai-analysis/AiAnalysisLanding.jsx` - Läser URL från query
- `src/app/ai-analys/page.js` - Suspense boundary
- `src/styles/ai-results.css` - Gradient på loading/error
- `public/images/SEOanalyzerLogo.png` - Ny logga
- `public/favicon.ico` - Ny favicon
- `public/icons/*.png` - Alla favicon-storlekar

---

## EXPERT-UTVÄRDERING (2026-01-05)

5 AI-agenter utvärderade sajten. Sammanfattning:

### Betyg

| Expert | Betyg | Huvudkommentar |
|--------|-------|----------------|
| UX/UI | 7.5/10 | Modern design, FAQ saknar accordion |
| Kund | 7/10 | Gratis bra, saknar ansikten/trovärdighet |
| SEO | 7/10 | Bra grund, canonical-taggar pekar fel |
| Konkurrent | Stark | Unikt med SEO+GDPR+Säkerhet gratis |
| Teknisk | 7/10 | Modern stack, bilder behöver optimeras |

### KRITISKA PROBLEM (Fixa omedelbart)

1. **Canonical-taggar pekar på startsidan för ALLA undersidor**
   - Alla undersidor har `canonical: "https://seoanalyze.se"`
   - Bör vara sidspecifika (`/blogg`, `/faq`, etc.)
   - Påverkar: SEO-indexering

2. ~~**Sitemap.xml listar sidor som inte finns (404)**~~ ✅ FIXAT
   - ~~Listar: `/seo-analys`, `/lighthouse-analys`, `/crawl-analys`, `/anvandarvillkor`~~
   - ~~Saknar: `/blogg`, `/faq`, `/om-oss`, `/kontakt`~~
   - Fil: `public/sitemap.xml` - Uppdaterad med korrekta URLs

3. ~~**FAQ saknar accordion-funktionalitet**~~ ✅ FIXAT
   - ~~All text visas samtidigt = lång scrollning~~
   - Implementerat med React useState + ChevronDown-ikon
   - Inkluderar FAQPage JSON-LD schema för rich snippets

4. **Hero-bilder är ~1.5MB totalt**
   - herocrawl.png: 483KB
   - herolighthouse.png: 486KB
   - heroseo.png: 484KB
   - Lösning: Konvertera till WebP

### TOP STYRKOR

1. **100% gratis utan registrering** - unikt på marknaden
2. **Svensk LIX-analys** - ingen konkurrent har detta
3. **Allt-i-ett (SEO + GDPR + Säkerhet)** - konkurrenter kräver 3-5 verktyg
4. **Modern design** med Tailwind + shadcn/ui
5. **Omfattande Schema.org markup**

### PRIORITERAD ÅTGÄRDSLISTA

| Prio | Åtgärd | Påverkan | Status |
|------|--------|----------|--------|
| 1 | Fixa canonical-taggar på undersidor | SEO-kritiskt | ❌ |
| 2 | ~~Uppdatera sitemap.xml~~ | Crawling | ✅ |
| 3 | ~~Implementera FAQ-accordion~~ | UX | ✅ |
| 4 | ~~Byt emoji-ikoner till Lucide~~ | Design | ✅ |
| 5 | Konvertera bilder till WebP | Prestanda | ❌ |
| 6 | Lägg till kontaktformulär | Konvertering | ❌ |
| 7 | Visa ansikten/team på Om oss | Trovärdighet | ❌ |
| 8 | Lägg till kundcitat/testimonials | Social proof | ❌ |
| 9 | ~~Article schema för bloggartiklar~~ | Rich snippets | ✅ |
| 10 | Unika OG-taggar per sida | Social delning | ❌ |

### MARKNADSFÖRINGSTIPS

**Huvudbudskap:**
> "Sveriges smartaste SEO-verktyg - gratis och utan registrering"

**Unika säljpunkter:**
- Enda verktyget med LIX-analys
- Allt-i-ett istället för 5 separata verktyg
- "Gratis utan gränser" (konkurrenter har dagsgränser)

---

## Tidigare sessioner

### SESSION 2026-01-05 (dag):
**Landing Page Redesign med Tailwind CSS - KLAR**

- Tailwind CSS 3.4.19 installerat
- shadcn/ui-komponenter (button, badge, tabs, input, card)
- Ny Header med glassmorphism
- Ny Footer med 4-kolumns layout
- ToolsShowcase med 6 analystyper
- Features med 8 kort
- Rosa färger borttagna, blå tema

### SESSION 2026-01-04:
**GDPR Iframe-detektion + EDPB-krav**

- Settings-knapp detektion
- CMP iframe-detektion (20+ selectors)
- EDPB "Neka alla"-krav (-10p)

### SESSION 2026-01-03:
**GDPR + Säkerhetsanalys implementerat**

- Puppeteer-baserad cookie-detektion
- TCF v1/v2 detektion
- AI-rapport via DeepSeek
- Säkerhetsanalys (SSL, headers, OWASP)

---

## Viktiga filer

| Fil | Beskrivning |
|-----|-------------|
| `src/components/common/HeroSection.jsx` | Hero med 6 analystyper, AI navigerar till /ai-analys |
| `src/components/common/Header.jsx` | Glassmorphism header |
| `src/components/common/Footer.jsx` | 4-kolumns footer |
| `src/app/ai-analys/page.js` | AI-analys landningssida |
| `src/components/ai-analysis/AiAnalysisLanding.jsx` | URL + konkurrentinput |
| `src/components/ai-analysis/AiAnalysisResults.jsx` | AI-resultatvisning |
| `lib/gdpr-analyzer.js` | GDPR cookie-analys |
| `lib/security-analyzer-full.js` | Säkerhetsanalys |
| `lib/queue-manager.js` | Alla BullMQ-köer |
| `lib/queue-workers.js` | Alla workers |
| `public/sitemap.xml` | Uppdaterad 2026-01-05 |
| `src/app/faq/page.js` | Accordion + FAQPage schema |

---

## Kvar att göra (prioriterat)

1. ~~AI-Rapport navigering~~ ✓
2. ~~Ny logga + favicons~~ ✓
3. Fixa canonical-taggar
4. ~~Uppdatera sitemap.xml~~ ✓
5. ~~FAQ accordion~~ ✓
6. ~~Emoji → Lucide på undersidor~~ ✓
7. ~~FAQPage schema~~ ✓
8. ~~Article schema på bloggartiklar~~ ✓
9. Bilder till WebP
10. Kontaktformulär
11. Lokal SEO-analys

---

## Teknisk skuld (städa senare)

### JS-filer i root som bör flyttas till `lib/`
Enligt goldenrules.md ska workers ligga i `/lib/`, men dessa 8 filer ligger i root:

```
crawler.js
debug-mobile-overflow.js
debug-mobile-scroll.js
lighthouse-analyzer.js
lighthouse-runner.js
lighthouse-worker.js
quick-concurrent-test.js
verify-analysis-types.js
```

**Åtgärd krävs:**
1. Flytta filerna till `/lib/`
2. Uppdatera `ecosystem.config.js` (PM2-config)
3. Uppdatera alla importer i `queue-workers.js` och andra filer
4. Testa att PM2-processer startar korrekt

**Notering:** `seoanalyze.conf.backup` (nginx) kan tas bort.
