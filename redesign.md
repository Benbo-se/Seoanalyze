# REDESIGN PLAN - Lovable till Next.js

**Skapad:** 2026-01-05
**Status:** KLAR ✓
**Approach:** Alternativ A - Tailwind + shadcn/ui + porta Lovable-komponenter

---

## BESLUT (2026-01-05)

| Fråga | Beslut |
|-------|--------|
| Header-logga | Endast SEOanalyze (ta bort Benbo) |
| "Se demo"-knapp | "Se verktyg" → smooth scroll till #tools |
| Footer org.nr | Länka till benbo.se istället |
| Dark mode | Avvakta (implementeras ej nu) |

---

## SAMMANFATTNING

Vi porterar designen från Lovable-projektet (`github.com/RedaEkengren/svensk-seo-guide`) till vårt Next.js-projekt. Lovable använder Vite + React + Tailwind + shadcn/ui. Vi behåller Next.js men adopterar deras styling-approach och komponenter.

---

## KÄLLA: LOVABLE-PROJEKTET

**Repo:** https://github.com/RedaEkengren/svensk-seo-guide
**Klonat till:** `/tmp/svensk-seo-guide/`

### Lovables komponenter (att porta):
```
/tmp/svensk-seo-guide/src/
├── components/
│   ├── Header.tsx          # Fixed header, glassmorphism
│   ├── Hero.tsx             # URL-input, dual CTA, stats
│   ├── TrustLogos.tsx       # TA BORT (fake logos)
│   ├── Features.tsx         # 8 feature-kort med AI-badges
│   ├── ToolsShowcase.tsx    # Tabs med live preview
│   ├── Pricing.tsx          # TA BORT (vi är gratis)
│   ├── Testimonials.tsx     # TA BORT (inga riktiga)
│   ├── CTA.tsx              # Final call-to-action
│   ├── Footer.tsx           # 4-kolumns footer
│   └── ui/                  # shadcn/ui komponenter (50+ filer)
├── index.css                # CSS-variabler, animationer
└── pages/Index.tsx          # Huvudsida
```

### Lovables färgpalett (HSL → HEX):
```css
--primary: 217 91% 60%      → #3B82F6 (blå - trust)
--accent: 24 95% 53%        → #F97316 (orange - CTA)
--ai: 258 90% 66%           → #8B5CF6 (lila - AI features)
--success: 160 84% 39%      → #10B981 (grön)
--warning: 38 92% 50%       → #F59E0B (gul)
--destructive: 0 84% 60%    → #EF4444 (röd)
```

### Lovables typsnitt:
```
Display: Plus Jakarta Sans (rubriker)
Body: Inter (brödtext)
```

---

## VÅR NUVARANDE STRUKTUR

### Filer som BEHÅLLS (backend, API, workers):
```
/opt/seo-analyzer-nextjs/
├── lib/                          # BEHÅLL ALLT
│   ├── queue-manager.js
│   ├── queue-workers.js
│   ├── gdpr-analyzer.js
│   ├── security-analyzer-full.js
│   └── ... (alla analyzers)
│
├── src/app/api/                  # BEHÅLL ALLA API:er
├── src/app/analys/[jobId]/       # BEHÅLL resultatvisning
├── src/app/blogg/                # BEHÅLL
├── src/app/faq/                  # BEHÅLL
├── src/app/kontakt/              # BEHÅLL
├── src/app/om-oss/               # BEHÅLL
├── src/app/integritetspolicy/    # BEHÅLL
├── src/app/bot/                  # BEHÅLL
│
├── src/components/results/       # BEHÅLL (SEO-resultat)
├── src/components/crawl/         # BEHÅLL (Crawl-resultat)
├── src/components/gdpr/          # BEHÅLL (GDPR-resultat)
├── src/components/security/      # BEHÅLL (Säkerhetsresultat)
├── src/components/chatbot/       # BEHÅLL (Chatbot)
│
├── prisma/                       # BEHÅLL
├── public/images/                # BEHÅLL (loggor, bilder)
└── ecosystem.config.js           # BEHÅLL
```

### Filer som ERSÄTTS:
```
src/app/page.js                   # Landing page → ny struktur
src/app/layout.js                 # Lägg till fonts, uppdatera
src/components/common/Header.jsx  # → Lovable Header
src/components/common/Footer.jsx  # → Lovable Footer
src/components/common/HeroSection.jsx  # → Lovable Hero
src/components/landing/*.jsx      # → Lovable-komponenter
src/styles/globals.css            # → Tailwind + CSS-variabler
src/styles/landing.css            # → Ta bort (Tailwind ersätter)
```

### Filer att TA BORT:
```
src/styles/landing.css                    # Ersätts av Tailwind
src/components/common/FeaturesSections.jsx # Oanvänd
src/components/results.bak-*/             # 5 backup-mappar
*.bak* (88 filer)                         # Backup-filer
```

---

## VÅRA 5 ANALYSTYPER (kritiskt!)

Lovable har 3 verktyg. VI har 5. Detta måste anpassas.

| Vår typ | API type | Queue | AI? | Lovable-motsvarighet |
|---------|----------|-------|-----|----------------------|
| **AI-Rapport** | `seo` (temp) | seo-queue | Ja | Innehållsanalys |
| **GDPR** | `gdpr` | gdpr-queue | Ja | - (ny) |
| **Säkerhet** | `security` | security-queue | Ja | - (ny) |
| **SEO** | `seo` | seo-queue | Nej | SEO-granskning |
| **Crawl** | `crawl` | crawl-queue | Nej | - |
| **Lighthouse** | `lighthouse` | lighthouse-queue | Nej | - |

### Hero-struktur (anpassad):
```
Primära val (synliga):
├── AI-Rapport (Rekommenderad) - lila badge
├── GDPR Cookie-analys - lila badge
└── Säkerhetsanalys - lila badge

"Fler verktyg" (collapsed):
├── SEO-analys
├── Crawl (+ antal sidor input)
└── Lighthouse
```

---

## VÅR NAVIGATION (skiljer från Lovable)

### Lovable Header:
```
Logo | Funktioner | Verktyg (AI) | Priser | Om oss | [Logga in] [Börja gratis]
```

### VÅR Header (anpassad):
```
[Benbo-logo] [SEOanalyze-logo] | Blogg | FAQ | Kontakt | Om oss | [Analysera gratis]
```

**Notera:**
- INGEN "Logga in" (vi har inget medlemskap)
- INGEN "Priser" (vi är 100% gratis)
- Behåll våra bildloggor (inte ikon)

### Vår Footer (anpassad):
```
Kolumn 1: SEOanalyze.se + beskrivning + org.nr
Kolumn 2: Verktyg (AI-Rapport, GDPR, Säkerhet, SEO, Crawl, Lighthouse)
Kolumn 3: Företag (Om oss, Kontakt, Blogg)
Kolumn 4: Juridiskt (Integritetspolicy, Cookies, GDPR)
Bottom: © 2026 + "Byggt i Sverige" + "GDPR" + cookie-inställningar
```

---

## STEG-FÖR-STEG IMPLEMENTATION

### STEG 1: Installera dependencies
```bash
npm install -D tailwindcss postcss autoprefixer
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-tabs @radix-ui/react-accordion
npx tailwindcss init -p
```

### STEG 2: Skapa Tailwind config
**Fil:** `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        ai: {
          DEFAULT: "hsl(var(--ai))",
          foreground: "hsl(var(--ai-foreground))",
          muted: "hsl(var(--ai-muted))",
        },
        success: { DEFAULT: "hsl(var(--success))" },
        warning: { DEFAULT: "hsl(var(--warning))" },
        destructive: { DEFAULT: "hsl(var(--destructive))" },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### STEG 3: Uppdatera globals.css
**Fil:** `src/styles/globals.css`

Lägg till i BÖRJAN (före befintlig CSS):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

@layer base {
  :root {
    --background: 210 20% 98%;
    --foreground: 215 25% 15%;
    --card: 0 0% 100%;
    --card-foreground: 215 25% 15%;
    --primary: 217 91% 60%;
    --primary-foreground: 0 0% 100%;
    --secondary: 215 16% 47%;
    --secondary-foreground: 0 0% 100%;
    --muted: 210 20% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 24 95% 53%;
    --accent-foreground: 0 0% 100%;
    --ai: 258 90% 66%;
    --ai-foreground: 0 0% 100%;
    --ai-muted: 258 90% 96%;
    --success: 160 84% 39%;
    --warning: 38 92% 50%;
    --destructive: 0 84% 60%;
    --border: 214 20% 90%;
    --input: 214 20% 90%;
    --ring: 217 91% 60%;
    --radius: 0.75rem;
  }
}
```

BEHÅLL resten av globals.css för bakåtkompatibilitet med resultat-sidorna.

### STEG 4: Kopiera shadcn/ui komponenter
Kopiera från `/tmp/svensk-seo-guide/src/components/ui/` till `src/components/ui/`:
```
button.tsx → button.jsx (konvertera till JS)
badge.tsx → badge.jsx
tabs.tsx → tabs.jsx
input.tsx → input.jsx
accordion.tsx → accordion.jsx
```

Skapa utility-fil `src/lib/utils.js`:
```javascript
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

### STEG 5: Porta Header
**Fil:** `src/components/common/Header.jsx`

Baserat på Lovable men med:
- Våra bildloggor (`/public/images/SEOanalyzerLogo.png`, `/public/logo.png`)
- Vår navigation (Blogg, FAQ, Kontakt, Om oss)
- Ingen "Logga in"
- CTA: "Analysera gratis" → scrollar till hero

### STEG 6: Porta Hero
**Fil:** `src/components/common/HeroSection.jsx`

Baserat på Lovable men med:
- Våra 5 analystyper (3 synliga + 3 under "Fler verktyg")
- Sparkle-ikon + lila badge för AI-features
- Koppla till `/api/analyze`
- Redirecta till `/analys/[jobId]`

### STEG 7: Porta ToolsShowcase
**Fil:** `src/components/landing/ToolsShowcase.jsx`

Tabs med våra 5 analystyper:
- AI-Rapport (lila, AI-badge)
- GDPR (lila, AI-badge)
- Säkerhet (lila, AI-badge)
- SEO (blå)
- Crawl (blå)
- Lighthouse (blå)

Varje tab visar:
- Ikon + titel
- Beskrivning
- Feature-lista med checkmarks
- "Prova [verktyg]" knapp
- Live preview-mockup (som Lovable)

### STEG 8: Porta Features
**Fil:** `src/components/landing/Features.jsx`

8 feature-kort (anpassa innehåll):
1. Teknisk SEO-analys
2. AI-innehållsoptimering (AI-badge)
3. GDPR Cookie-analys (AI-badge)
4. Säkerhetsanalys (AI-badge)
5. Svensk LIX-analys
6. Crawl hela sajten
7. Lighthouse-prestanda
8. PDF-rapporter

### STEG 9: Porta CTA
**Fil:** `src/components/landing/FinalCTA.jsx`

Lovables design med:
- "Redo att förbättra din SEO?"
- URL-input
- "Börja gratis" + "Så fungerar det"
- "Ingen registrering krävs • 100% gratis"

### STEG 10: Porta Footer
**Fil:** `src/components/common/Footer.jsx`

4-kolumns layout med:
- Vår logga + beskrivning
- Våra verktyg-länkar
- Våra sidor (Blogg, FAQ, etc.)
- Juridiskt (Integritetspolicy, etc.)
- Cookie-inställningar knapp (befintlig funktionalitet)

### STEG 11: Uppdatera page.js
**Fil:** `src/app/page.js`
```jsx
import Header from '@/components/common/Header';
import Hero from '@/components/common/HeroSection';
import ToolsShowcase from '@/components/landing/ToolsShowcase';
import Features from '@/components/landing/Features';
import AggregatedStats from '@/components/landing/AggregatedStats';  // BEHÅLL
import ShortFAQ from '@/components/landing/ShortFAQ';  // BEHÅLL men uppdatera styling
import FinalCTA from '@/components/landing/FinalCTA';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <ToolsShowcase />
        <Features />
        <AggregatedStats />
        <ShortFAQ />
        <FinalCTA />
      </main>
      {/* Footer är i layout.js */}
    </div>
  );
}
```

### STEG 12: Uppdatera layout.js
- Lägg till Google Fonts (Plus Jakarta Sans, Inter)
- Ta bort `landing.css` import
- Behåll Footer, CookieBanner, ChatBot

### STEG 13: Testa och finjustera
```bash
npm run build
pm2 restart seo-nextjs-prod
```

---

## KOMPONENTER ATT IGNORERA (från Lovable)

| Komponent | Anledning |
|-----------|-----------|
| `TrustLogos.tsx` | Fake logos (Volvo, IKEA, etc.) |
| `Pricing.tsx` | Vi är 100% gratis |
| `Testimonials.tsx` | Inga riktiga kundcitat |

---

## BILDER ATT BEHÅLLA

| Bild | Sökväg | Användning |
|------|--------|------------|
| SEOanalyze-logga | `/public/images/SEOanalyzerLogo.png` | Header |
| Benbo-logga | `/public/logo.png` | Header (extern länk) |
| Chatbot-avatar | `/public/images/chatbot-avatar.png` | Chatbot |
| OG-image | `/public/og-image.png` | Social sharing |

---

## CSS-STRATEGI

### Tailwind för nya komponenter:
- Header, Hero, ToolsShowcase, Features, CTA, Footer
- Använd Tailwind-klasser direkt

### Befintlig globals.css för:
- Resultat-sidor (`/analys/[jobId]`)
- Blogg, FAQ, Kontakt, Om oss
- Chatbot
- GDPR/Security results display

### Ta bort:
- `src/styles/landing.css` (ersätts av Tailwind)

---

## CHECKLISTA VID IMPLEMENTATION

```
[ ] 1. Installera Tailwind + dependencies
[ ] 2. Skapa tailwind.config.js
[ ] 3. Uppdatera globals.css med CSS-variabler
[ ] 4. Skapa src/lib/utils.js
[ ] 5. Kopiera + konvertera shadcn/ui komponenter (button, badge, tabs, input, accordion)
[ ] 6. Porta Header.jsx
[ ] 7. Porta HeroSection.jsx
[ ] 8. Porta ToolsShowcase.jsx
[ ] 9. Porta Features.jsx
[ ] 10. Porta FinalCTA.jsx
[ ] 11. Porta Footer.jsx
[ ] 12. Uppdatera page.js
[ ] 13. Uppdatera layout.js (fonts)
[ ] 14. Ta bort landing.css
[ ] 15. Ta bort backup-filer (88 st)
[ ] 16. Bygga och testa
[ ] 17. Verifiera alla 5 analystyper fungerar
[ ] 18. Verifiera alla sidor (blogg, faq, etc.)
```

---

## FRÅGOR ATT BESVARA FÖRE START

1. **Benbo-loggan i header** - Ska den vara kvar eller bara SEOanalyze?
2. **"Se demo" knapp** - Vad ska hända? Scrolla till ToolsShowcase?
3. **Organisationsnummer** - Finns det ett att visa i footer?
4. **Dark mode** - Implementera nu eller senare?

---

## EFTER REDESIGN

Uppdatera följande filer:
- `CLAUDE.md` - Lägg till info om Tailwind, shadcn/ui
- `README.md` - Uppdatera tech stack
- `mdfiler/ux-forbattringar.md` - Markera som ÅTGÄRDAT

Ta bort denna fil (`redesign.md`) när allt är klart.
