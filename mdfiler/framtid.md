# Framtida funktioner

Dokumenterat: 2026-01-04

---

## IMPLEMENTERADE FUNKTIONER

### GDPR Iframe + EDPB-krav - IMPLEMENTERAD 2026-01-04
**Status:** Klart

**Problem som löstes:**
- Settings-knapp ("Anpassa") detekterades inte
- TCF-banners i iframes (Aftonbladet, SVD) kunde inte analyseras
- Saknad "Neka alla" gav inget avdrag för TCF-sajter utan tracking

**Implementerat:**
- **Settings-knapp detektion** - Ny `settingsKeywords` array:
  - Svenska: "anpassa", "inställningar", "hantera", "detaljer"
  - Engelska: "settings", "customize", "manage", "preferences"
- **CMP Iframe-detektion** - Ny `CMP_SELECTORS.iframes` (20+ selectors):
  - Sourcepoint, OneTrust, Cookiebot, Quantcast, Didomi, TrustArc
  - Generiska: `iframe[src*="consent"]`, `iframe[title*="cookie"]`
- **Iframe context-switch** - Ny metod `findButtonsInIframes()`:
  - Byter till iframe med `contentFrame()`
  - Kör knapp-detektion inuti iframe
- **Banner-data från iframe** - Ny metod `extractBannerDataFromIframe()`:
  - Extraherar text och knappar från CMP-iframe
  - Tar screenshot av iframe
- **EDPB "Neka alla"-krav** - Ny violation (severity: medium, -10p):
  - Saknad "Neka alla"-knapp ger alltid avdrag
  - Gäller även TCF-sajter utan tracking
  - Refererar till EDPB Riktlinjer 05/2020

**Filer ändrade:**
- `lib/gdpr-analyzer.js` - Alla ovan nämnda ändringar

**Testade sajter (uppdaterade scores):**
- aftonbladet.se: Score 90 (före: 100) - saknar reject, iframe detekterad
- expressen.se: Score 80 - alla knappar på huvudsidan
- dn.se: Score 60 - saknar reject + tracking
- svd.se: Score 80 - iframe detekterad, alla knappar
- seoanalyze.se: Score 100 - alla knappar finns

---

### GDPR-analys - IMPLEMENTERAD 2026-01-03
**Status:** Klart

**Implementerat:**
- Puppeteer-baserad cookie-detektion INNAN samtycke
- Detekterar 30+ kända tracking-cookies (GA, FB, Hotjar, etc.)
- **Robust banner-detektion** med 6 metoder i fallback-ordning:
  1. CSS-selector (kända CMPs: Cookiebot, OneTrust, CookieYes, etc.)
  2. Textbaserad (söker "cookies", "samtycke", "consent" i synliga element)
  3. Visuell overlay (fixed/sticky element med knappar)
  4. Consent-cookie (fallback om cookie redan finns)
  5. **TCF API** (`__tcfapi`, `__cmp`, Sourcepoint)
  6. **TCF cookies** (`IABTCF_*`, `euconsent-v2`, `_sp_*`)
- **Knapp-detektion** via nyckelord (svenska + engelska)
- **Privacy by design-stöd** - Sajter utan tracking får högt score (GDPR Art. 25)
- **Privacy notice-detektion** - "no cookies" meddelanden = ej consent-banner
- **TCF-kompatibilitet** - IAB TCF v1/v2 detekteras och hanteras korrekt
- Testar "Neka alla"-funktionalitet
- AI-genererad GDPR-rapport via DeepSeek (med banner-text)
- Compliance score och risknivå
- Lucide-ikoner i resultatvisning (inga emojis)

**Filer:**
- `lib/gdpr-analyzer.js` - Puppeteer-baserad analys med robust detektion
- `lib/gdpr-ai-report.js` - DeepSeek AI-rapport
- `src/components/gdpr/GdprResultsDisplay.jsx` - Resultatvisning med Lucide-ikoner
- `src/styles/gdpr-results.css` - Styling med CSS-klasser för ikoner

**API:** `POST /api/analyze { type: 'gdpr', url: '...' }`

---

### Säkerhetsanalys - IMPLEMENTERAD 2026-01-03
**Status:** Klart

**Implementerat:**
- SSL/TLS-certifikatanalys (giltighet, protokoll, utgångsdatum)
- Security headers (CSP, X-Frame-Options, HSTS, X-Content-Type-Options, etc.)
- Exponerade känsliga filer (/.git, /.env, /wp-config.php.bak, etc.)
- Sårbara JavaScript-bibliotek (jQuery, Bootstrap, Angular, etc.)
- Mixed content-detektion
- AI-genererad säkerhetsrapport via DeepSeek
- Security grade (A-F) och poäng

**Filer:**
- `lib/security-analyzer-full.js` - Fullständig säkerhetsanalys
- `lib/security-ai-report.js` - DeepSeek AI-rapport
- `src/components/security/SecurityResultsDisplay.jsx` - Resultatvisning
- `src/styles/security-results.css` - Styling

**API:** `POST /api/analyze { type: 'security', url: '...' }`

---

### GDPR DeepSeek-förbättring + TCF - IMPLEMENTERAD 2026-01-03
**Status:** Klart

**Problem som löstes:**
- DeepSeek fick bara boolean (banner finns: ja/nej)
- AI såg aldrig vad bannern faktiskt sa
- False positive: argusmetrics.io ("No cookies" tolkades som consent-banner)
- TCF-baserade banners (Aftonbladet, etc.) detekterades inte

**Implementerat:**
- `extractBannerData()` - Extraherar banner-text, knappar, screenshot
- AI-prompt inkluderar nu banner-text och knapp-texter
- Privacy notice-detektion ("no cookies" = privacy by design)
- **TCF-detektion (IAB Transparency and Consent Framework):**
  - METHOD 5: `__tcfapi`, `__cmp`, Sourcepoint globals
  - METHOD 6: TCF cookies (`IABTCF_*`, `euconsent-v2`, `_sp_*`)
- TCF-specifik logik i `analyzeViolations()`:
  - TCF + ingen tracking = "TCF-kompatibel" (compliant)
  - TCF + tracking före consent = violation

**Filer ändrade:**
- `lib/gdpr-analyzer.js` - `extractBannerData()`, METHOD 5 & 6, `analyzeViolations()`
- `lib/gdpr-ai-report.js` - Uppdaterad prompt

**Resultat:**
- argusmetrics.io: Score 100 (privacy notice)
- aftonbladet.se: Score 100, TCF v2 detekterad (före: banner missades)
- svt.se, ica.se: Score 100
- klarna.com: Score 80 (tracking före consent)
- blocket.se: Score 50 (tracking före consent)

---

## KOMMANDE FUNKTIONER

### Lokal SEO-analys
**Prioritet:** Medium
**Estimat:** 2-3 veckor

**Vad som kontrolleras:**
- Google Business Profile finns? (scraping)
- NAP-konsistens (Namn, Adress, Telefon på sajten)
- Schema.org LocalBusiness markup
- Lokala nyckelord i content
- Google Maps-inbäddning finns?
- Lokala backlinks/citeringar

**Implementation:**
- Ny worker: `local-seo-worker.js`
- Ny analystyp: `type: 'local-seo'`
- Ny knapp på startsidan

---

## RETENTION & KONVERTERING

### E-postpåminnelse
**Prioritet:** Medium
**Estimat:** 1 vecka

**Funktionalitet:**
- Valfri e-postinsamling vid analys
- GDPR-samtycke krävs
- Cron-jobb skickar påminnelse efter 30 dagar
- "Din webbplats analyserades för 30 dagar sedan - kör en ny analys?"

**Tekniskt:**
- Integration med SendGrid eller Mailgun
- Ny tabell: `EmailSubscription`
- Cron-worker för utskick

---

### Användarkonton
**Prioritet:** Låg
**Estimat:** 2-3 veckor

**Funktionalitet:**
- Registrering/inloggning (Next-Auth)
- Dashboard med analyshistorik
- Jämför analyser över tid
- Spara favorit-domäner
- Möjliggör premium-tier i framtiden

**Tekniskt:**
- Next-Auth implementation
- Prisma User-modell
- Dashboard-sidor
- Rollhantering (user/admin)

---

## PRIORITERINGSORDNING

1. ~~GDPR-analys~~ - KLART
2. ~~Säkerhetsanalys~~ - KLART
3. E-postpåminnelse (retention)
4. Lokal SEO (nischad målgrupp)
5. Användarkonton (kräver mest arbete)
