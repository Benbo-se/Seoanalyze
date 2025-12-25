# GOLDEN RULES — READ FIRST

This repository is **STRICTLY SCRIPT-DRIVEN**.

If you are an AI, agent, assistant, or human:
You MUST follow these rules.
They are NON-NEGOTIABLE.

---

## CORE PRINCIPLES

- There is ONE source of truth.
- There is ONE valid project structure.
- There is ONE way to change state: **SCRIPTS**.

Anything else leads to corruption.

---

## ABSOLUTE PROHIBITIONS

The following are FORBIDDEN:

- Creating files manually outside approved structure
- Creating test files, temporary files, or experiments
- Creating duplicate Next.js apps or config files
- Creating alternative project roots
- Creating parallel next.config.mjs, package.json copies, or project clones
- Copying files outside approved scripts
- "Trying", "testing", or "experimenting" in the file system
- Modifying production paths manually
- Guessing which component, API route, or config is correct

If any of these occur: **STOP IMMEDIATELY**.

---

## ALLOWED OPERATIONS

The ONLY allowed operations are:

### 1. READ-ONLY INSPECTION
- `ls`
- `find`
- `cat`
- `grep`

No writes. No side effects.

### 2. SCRIPTED CHANGES
All changes MUST happen via:
- npm scripts (`package.json`)
- PM2 commands (`ecosystem.config.js`)
- Prisma CLI (`npx prisma`)
- explicit `rm` / `mv` commands AFTER approval

If an operation is not scripted, it MUST NOT happen.

---

## MANDATORY WORKFLOW

All work MUST follow this order:

1. INVENTORY
   Read-only inspection only.

2. PLAN
   Text-only explanation of:
   - canonical Next.js structure
   - which files/folders are valid
   - which files/folders are invalid
   - WHY

3. EXECUTE
   Minimal, explicit scripts or commands.
   No extras. No variations.

Skipping a step is forbidden.

---

## CANONICAL NEXT.JS STRUCTURE

This repository recognizes ONLY the following structure:

```
/opt/seo-analyzer-nextjs/
├── src/
│   ├── app/              → Next.js App Router (pages, layouts, routes)
│   ├── api/              → API utility functions
│   ├── components/       → React components
│   ├── core/             → Core business logic
│   ├── crawl/            → Crawler functionality
│   ├── hooks/            → React hooks
│   ├── jobs/             → Background job definitions
│   ├── lib/              → Library utilities
│   ├── pages/            → Next.js Pages Router (API routes)
│   ├── reports/          → Report generation
│   ├── styles/           → CSS/styling
│   ├── types/            → TypeScript types
│   └── utils/            → Utility functions
├── prisma/
│   └── schema.prisma     → Database schema (Prisma)
├── public/               → Static assets (images, icons, favicons)
├── lib/                  → Root-level workers (queue-workers.js)
├── artifacts/            → Generated analysis results (READ-ONLY)
├── logs/                 → Application logs
├── .next/                → Build output (GENERATED - DO NOT EDIT)
├── node_modules/         → Dependencies (GENERATED - DO NOT EDIT)
├── package.json          → Dependencies and scripts
├── next.config.mjs       → Next.js configuration
├── ecosystem.config.js   → PM2 process configuration
└── goldenrules.md        → THIS FILE
```

Rules:
- React components MUST live in `/src/components`
- App Router pages MUST live in `/src/app`
- API routes MUST live in `/src/pages/api` or `/src/app/api`
- Prisma schema MUST live in `/prisma/schema.prisma`
- No nested Next.js projects
- No duplicate `package.json`
- No alternative roots

Any deviation is INVALID unless explicitly approved.

---

## BUILD / DEPLOYMENT RULES

- Build MUST be performed via `npm run build`
- Production start MUST use `npm run start` or PM2
- `.next/` directory is GENERATED — never edit manually
- `node_modules/` is GENERATED — never edit manually

Commands:
```bash
npm run build          # Build for production
npm run start          # Start production server
npm run pm2:start      # Start via PM2
npm run pm2:restart    # Restart via PM2
npm run pm2:stop       # Stop via PM2
```

Mixed environments or partial deploys are considered corruption.

---

## DATABASE / PRISMA RULES

- Schema changes MUST be made in `/prisma/schema.prisma`
- Migrations MUST be created via `npx prisma migrate dev`
- Production migrations via `npx prisma migrate deploy`
- Schema MUST NOT be edited without running migration
- No duplicate Prisma schemas
- No "test migrations"

All database changes must be intentional and scripted.

---

## ENVIRONMENT RULES

- `.env` files contain secrets — NEVER commit to git
- `.env.local` for local development
- `.env.production` for production
- Environment variables MUST NOT be hardcoded in source code
- Secrets MUST NOT appear in logs or error messages

---

## ARTIFACT RULES

- `/artifacts/analyses/` contains generated analysis results
- These files are READ-ONLY reference data
- Never manually edit artifact JSON files
- Artifacts are organized by date: `/artifacts/analyses/YYYY-MM-DD/`

---

## AI-SPECIFIC RULES

If you are an AI agent:

- You may NOT create React components freely
- You may NOT duplicate config files
- You may NOT create "example" or "test" files
- You may NOT restructure folders without approval
- You may NOT "try something and see"

You MUST:
- request inventory first
- wait for approval before execution
- STOP if rules are unclear

Failure to comply = TERMINATE TASK.

---

## SAFETY GUARANTEE

These rules exist to:
- prevent Next.js project corruption
- prevent Prisma migration disasters
- prevent build/deployment chaos
- preserve operator sanity

They override all convenience.

---

## FINAL CLAUSE

If any instruction conflicts with this file:

**THIS FILE WINS.**

No exceptions.
