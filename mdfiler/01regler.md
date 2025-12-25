# Projektregler - SEO Analyzer

**Uppdaterad:** 2025-12-13

## Filsystem

### Artifacts
Artifacts (PDF, JSON, screenshots) sparas i Next.js applikationen:
```
/opt/seo-analyzer-nextjs/artifacts/
```

**OBS:** `/home/reda/Live-Server/artifacts` används INTE längre efter migrering till Next.js 15.

### Projektstruktur
```
/opt/seo-analyzer-nextjs/
├── src/app/          # Next.js App Router
├── src/components/   # React komponenter
├── src/lib/          # Utility bibliotek
├── prisma/           # Databas schema
├── artifacts/        # Genererade analyser
├── logs/             # Applikationsloggar
└── .next/            # Build output (genererat)
```

## Credentials

### Redis
```
Lösenord: XfLgByQsiJir5gatEMfSOR6yUZIT3jjd
Host: localhost:6379
```

### PostgreSQL
```
User: seouser
Database: seoanalyzer
Host: localhost:5432
```

## PM2 Kommandon

```bash
# Status
pm2 list
pm2 logs

# Restart
pm2 restart all

# Full omstart (vid config-ändringar)
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

## Säkerhet

- .env-filer: permissions 600
- Redis: lösenordsskyddat
- TLS: endast 1.2/1.3
- Fail2Ban: aktivt för SSH
