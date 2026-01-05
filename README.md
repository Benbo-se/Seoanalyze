# SEO Analyzer

En fullständig SEO-analysplattform byggd med Next.js 15 som analyserar webbplatser för SEO, prestanda och tillgänglighet.

## Funktioner

- **SEO-analys** - Analyserar meta-taggar, rubriker, länkar, bilder och mer
- **Lighthouse-analys** - Kör Google Lighthouse för prestanda, tillgänglighet och SEO-poäng
- **Crawling** - Crawlar webbplatser för att hitta alla sidor och analysera struktur
- **GDPR-analys** - Cookie-detektion, tracking-scripts, robust banner-detektion (4 metoder) och AI-genererad compliance-rapport
- **Säkerhetsanalys** - SSL-certifikat, security headers, exponerade filer, sårbara bibliotek och AI-rapport
- **AI-analys** - AI-driven analys av SEO-resultat med rekommendationer
- **Chatbot** - Interaktiv chatbot för SEO-frågor
- **Delningsfunktion** - Dela analysresultat via unika länkar

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 3.4
- **UI-komponenter**: shadcn/ui, Radix UI, Lucide-ikoner
- **Typsnitt**: Plus Jakarta Sans (rubriker), Inter (brödtext)
- **Backend**: Next.js API Routes, Express
- **Databas**: PostgreSQL med Prisma ORM
- **Kö-system**: Redis, BullMQ
- **Analys**: Puppeteer, Lighthouse, Cheerio
- **Felhantering**: Sentry
- **Processhantering**: PM2

## Installation

### Förutsättningar

- Node.js 18+
- PostgreSQL
- Redis

### Steg

1. Klona repot
```bash
git clone https://github.com/RedaEkengren/seoanalyze.se.git
cd seoanalyze.se
```

2. Installera dependencies
```bash
npm install
```

3. Konfigurera miljövariabler
```bash
cp .env.local.example .env.local
```

Redigera `.env.local` med dina värden:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/seoanalyzer
REDIS_URL=redis://localhost:6379
SITE_URL=http://localhost:3000

# Sentry (valfritt)
SENTRY_DSN=your_sentry_dsn
```

4. Konfigurera databasen
```bash
npx prisma generate
npx prisma db push
```

5. Starta utvecklingsservern
```bash
npm run dev
```

## Körning i produktion

### Med PM2 (rekommenderat)
```bash
npm run build
npm run pm2:start
```

### Manuellt
```bash
npm run build
npm run prod:start
```

## Scripts

| Kommando | Beskrivning |
|----------|-------------|
| `npm run dev` | Starta utvecklingsserver |
| `npm run build` | Bygg för produktion |
| `npm run start` | Starta produktionsserver |
| `npm run workers` | Starta bakgrundsworkers |
| `npm run pm2:start` | Starta med PM2 |
| `npm run pm2:logs` | Visa PM2-loggar |

## Projektstruktur

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API-routes
│   │   ├── analys/       # Analyssidor
│   │   ├── blogg/        # Bloggartiklar
│   │   └── ...           # Övriga sidor
│   ├── components/
│   │   ├── ui/           # shadcn/ui-komponenter (button, badge, tabs, etc.)
│   │   ├── common/       # Header, Footer, HeroSection
│   │   ├── landing/      # ToolsShowcase, Features, FinalCTA
│   │   ├── results/      # SEO-resultatvisning
│   │   ├── gdpr/         # GDPR-resultatvisning
│   │   └── security/     # Säkerhetsresultatvisning
│   ├── lib/              # Utilities (cn, etc.)
│   └── styles/           # globals.css, chatbot.css
├── lib/                  # Backend workers och analyzers
├── prisma/               # Databasschema
├── public/               # Statiska filer
└── artifacts/            # Analysresultat (gitignored)
```

## Licens

Privat projekt.
