# CLAUDE.md - Läs detta först

Efter /compact eller ny session, läs filerna nedan i ordning.

## Obligatorisk läsning

1. **`goldenrules.md`** - Projektregler, struktur, förbud (VIKTIGAST)
2. **`mdfiler/credentials.md`** - Redis/PostgreSQL credentials, PM2 kommandon
3. **`mdfiler/SYSTEM-ARCHITECTURE-COMPLETE.md`** - Server, databaser, PM2, säkerhet

## Projektfiler

4. **`redesign.md`** - KLAR: Landing page redesign med Tailwind + Lovable-design
5. **`mdfiler/ux-forbattringar.md`** - UX/UI feedback och prioriterade förbättringar
6. **`mdfiler/framtid.md`** - Planerade funktioner (GDPR, säkerhet, lokal SEO)
7. `README.md` - Tech stack, installation
8. `mdfiler/02readme.md` - Detaljerad README, stress test resultat

## Snabbfakta

- **Projekt:** SEO Analyzer (seoanalyze.se)
- **Stack:** Next.js 15, React 19, Tailwind CSS 3.4, PostgreSQL, Redis, BullMQ, PM2
- **UI:** shadcn/ui-komponenter, Lucide-ikoner, Plus Jakarta Sans + Inter
- **Server:** DigitalOcean 4vCPU/8GB, Ubuntu 24.04
- **Sökväg:** `/opt/seo-analyzer-nextjs/`
- **Kontakt:** reda@benbo.se

## Senaste ändringar (2026-01-05)

### SESSION 2026-01-05 (senaste):
**Landing Page Redesign med Tailwind CSS:**

Komplett redesign av startsidan med Lovable-inspirerad design.

**Installerat:**
- Tailwind CSS 3.4.19 (nedgraderad från v4 för shadcn-kompatibilitet)
- tailwindcss-animate, class-variance-authority, clsx, tailwind-merge
- @radix-ui/react-slot, @radix-ui/react-tabs

**Nya filer:**
- `tailwind.config.js` - Färgpalett, typsnitt, animationer
- `src/lib/utils.js` - cn() helper för klassnamn
- `src/components/ui/` - shadcn/ui-komponenter:
  - `button.jsx`, `badge.jsx`, `tabs.jsx`, `input.jsx`, `card.jsx`
- `src/components/landing/ToolsShowcase.jsx` - 6 analystyper med tabs
- `src/components/landing/Features.jsx` - 8 feature-kort

**Uppdaterade filer:**
- `src/styles/globals.css` - Tailwind directives + CSS-variabler
- `src/components/common/Header.jsx` - Glassmorphism, ny navigation
- `src/components/common/HeroSection.jsx` - Tailwind styling, behåller logik
- `src/components/common/Footer.jsx` - 4-kolumns layout
- `src/components/landing/FinalCTA.jsx` - Gradient CTA-sektion
- `src/app/page.js` - Ny komponentstruktur
- `src/app/layout.js` - Tog bort landing.css

**Designbeslut:**
- Endast SEOanalyze-logga i header (tog bort Benbo)
- "Se verktyg"-knapp scrollar till #tools
- Länk till benbo.se i footer
- Dark mode avvaktar

**Färgpalett (HSL):**
- Primary: #3B82F6 (blå)
- Accent: #F97316 (orange CTA)
- AI: #8B5CF6 (lila för AI-features)

---

### SESSION 2026-01-04:
**GDPR Iframe-detektion + Settings-knapp + EDPB-krav:**

1. **Settings-knapp detektion** - Ny `settingsKeywords` array:
   - Svenska: "anpassa", "inställningar", "hantera", "detaljer"
   - Engelska: "settings", "customize", "manage", "preferences"
   - `hasSettings` sätts nu korrekt

2. **CMP Iframe-detektion** - Ny `CMP_SELECTORS.iframes` (20+ selectors):
   - Sourcepoint: `iframe[id*="sp_message_iframe"]`
   - OneTrust, Cookiebot, Quantcast, Didomi, TrustArc
   - Generiska: `iframe[src*="consent"]`, `iframe[title*="cookie"]`

3. **Iframe context-switch** - Ny metod `findButtonsInIframes()`:
   - Byter till iframe context med `contentFrame()`
   - Kör knapp-detektion inuti iframe
   - Sätter `result.iframeDetected = true`

4. **Banner-data från iframe** - Ny metod `extractBannerDataFromIframe()`:
   - Extraherar text och knappar från CMP-iframe
   - Tar screenshot av iframe

5. **EDPB "Neka alla"-krav** - Ny violation (severity: medium, -10p):
   - Saknad "Neka alla"-knapp ger nu alltid avdrag
   - Gäller även TCF-sajter utan tracking
   - Refererar till EDPB Riktlinjer 05/2020

**Filer ändrade:**
- `lib/gdpr-analyzer.js` - Alla ovan nämnda ändringar

**Testade sajter (med nya scores):**
- aftonbladet.se: Score 90 (före: 100) - saknar reject, iframe detekterad
- expressen.se: Score 80 - alla knappar på huvudsidan
- dn.se: Score 60 - saknar reject + tracking
- svd.se: Score 80 - iframe detekterad, alla knappar
- seoanalyze.se: Score 100 - alla knappar finns

---

### SESSION 2026-01-03:
**GDPR DeepSeek-förbättring + TCF-detektion:**

1. **Banner-text extraktion** - `extractBannerData()` extraherar text, knappar, screenshot
2. **AI-prompt uppdaterad** - DeepSeek får banner-text, skiljer consent-banners från info-notices
3. **Privacy notice-detektion** - "no cookies" = privacy by design
4. **TCF-detektion (IAB)** - Detekterar TCF v1/v2:
   - `__tcfapi` / `__cmp` JavaScript API
   - TCF cookies (`IABTCF_*`, `euconsent-v2`, `_sp_*`)
5. **TCF-logik** - TCF + ingen tracking = compliant

**Filer ändrade:**
- `lib/gdpr-analyzer.js` - `extractBannerData()`, METHOD 5 & 6 för TCF
- `lib/gdpr-ai-report.js` - Uppdaterad prompt

**Testade sajter:**
- argusmetrics.io: Score 100 ✓ (privacy notice)
- aftonbladet.se: Score 100, TCF v2 ✓
- svt.se: Score 100 ✓
- ica.se: Score 100 ✓
- klarna.com: Score 80 (tracking före consent)
- blocket.se: Score 50 (tracking före consent)

### Tidigare (2026-01-03):
**Robust GDPR banner-detektion:**
1. 4 detektionsmetoder: CSS-selector → Textbaserad → Visuell overlay → Consent-cookie
2. Väntetid ökad 2s → 4s för JS-banners
3. Knapp-detektion via nyckelord (svenska + engelska)
4. **Privacy by design-logik** - Sajter utan tracking får högt score (Art. 25)

### NYA FUNKTIONER - GDPR & Säkerhet:
- **GDPR Cookie-analys** - Puppeteer-baserad cookie-detektion med AI-rapport
  - Filer: `lib/gdpr-analyzer.js`, `lib/gdpr-ai-report.js`
  - Komponenter: `src/components/gdpr/GdprResultsDisplay.jsx`
  - Styling: `src/styles/gdpr-results.css` (CSS-indikatorer, inga emojis)
- **Säkerhetsanalys** - SSL, headers, exponerade filer, sårbara bibliotek
  - Filer: `lib/security-analyzer-full.js`, `lib/security-ai-report.js`
  - Komponenter: `src/components/security/SecurityResultsDisplay.jsx`
  - Styling: `src/styles/security-results.css`
- **Nya tabs** i HeroSection: GDPR, SÄKERHET
- **Nya queues & workers** i `queue-manager.js` och `queue-workers.js`
- **API uppdaterat** - `/api/analyze` stödjer type=gdpr och type=security
- **job-meta API fixat** - `src/app/api/job-meta/[jobId]/route.js` inkluderar nu gdpr/security i QUEUES

### Designbeslut:
- **Lucide-ikoner i resultatvisning** - Samma ikonbibliotek som resten av kodbasen
- Ikoner: `CheckCircle` (grön), `XCircle` (röd), `AlertTriangle` (gul), `Info` (blå)
- CSS-klasser: `.icon-ok`, `.icon-error`, `.icon-warning`, `.icon-info`

### Robust GDPR Banner-detektion (2026-01-03):
- **4 detektionsmetoder** i fallback-ordning:
  1. CSS-selector (kända CMPs som Cookiebot, OneTrust, etc.)
  2. Textbaserad (nyckelord: "cookies", "samtycke", "consent", etc.)
  3. Visuell overlay (fixed/sticky element med knappar)
  4. Consent-cookie (fallback om banner redan interagerats med)
- **Utökad väntetid** - 4 sekunder istället för 2 för JS-renderade banners
- **Knapp-detektion** via nyckelord på svenska/engelska
- **Privacy by design** - Sajter utan tracking och utan banner får nu högt score (Artikel 25)

### Tidigare implementerat:
- **Live-statistik** på startsidan (`/api/stats` + `StatsAndTrust.jsx`)
- **Trust badges:** Svensk LIX-analys, Ingen registrering, Färdig kod, 100% gratis
- **Blogg** med 3 artiklar (`/blogg`, `/blogg/lix-lasbarhet-seo`, etc.)
- **Header-navigation:** Blogg, FAQ, Kontakt (ersatte fake Login/Registrera)
- **Tog bort** "tekniska problem"-banner från startsidan

### Kvar att göra:
- UX-förbättringar (se `mdfiler/ux-forbattringar.md`)
- Lokal SEO-analys (se `mdfiler/framtid.md`)
- E-postpåminnelse för retention

## Viktiga filer

| Fil | Beskrivning |
|-----|-------------|
| `src/components/common/StatsAndTrust.jsx` | Live stats + trust badges |
| `src/components/common/HeroSection.jsx` | Startsidans hero med 5 tabs |
| `src/components/common/MobileMenu.jsx` | Header-navigation |
| `src/app/api/stats/route.js` | API för live-statistik |
| `src/app/blogg/` | Blogg med 3 artiklar |
| `lib/gdpr-analyzer.js` | GDPR cookie-analys med Puppeteer |
| `lib/security-analyzer-full.js` | Säkerhetsanalys (SSL, headers, etc.) |
| `lib/queue-manager.js` | Alla BullMQ-köer (inkl. gdpr, security) |
| `lib/queue-workers.js` | Alla workers (inkl. gdpr, security) |
| `src/components/gdpr/GdprResultsDisplay.jsx` | GDPR-resultatvisning |
| `src/components/security/SecurityResultsDisplay.jsx` | Säkerhetsresultatvisning |
| `src/styles/gdpr-results.css` | GDPR styling med CSS-indikatorer |
| `src/styles/security-results.css` | Säkerhet styling |
| `src/app/api/job-meta/[jobId]/route.js` | Job status API (QUEUES array) |
