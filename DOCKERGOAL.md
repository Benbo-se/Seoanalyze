# 🐳 Docker Migration Plan - SEO Analyzer

**Datum:** 2025-10-05
**Status:** PLANERING
**Mål:** Migrera seoanalyze.se från PM2 till Docker
**Anledning:** Enhetlig drift med stackr.se + bättre isolering

---

## 📋 ÖVERSIKT

### Nuvarande Setup
```
PM2 Process Manager
├── seo-nextjs-prod (2 instanser, cluster mode)
│   └── Port: 5001
├── seo-nextjs-workers (2 instanser, fork mode)
│   └── Puppeteer + Lighthouse + BullMQ
├── PostgreSQL (localhost:5432) - DELAD MED ANDRA APPAR?
├── Redis (localhost:6379) - DELAD MED ANDRA APPAR?
└── Artifacts: /home/reda/Live-Server/artifacts
```

### Målarkitektur (Docker)
```
Docker Compose Stack
├── seoanalyze-web (Next.js)
│   ├── Replicas: 2 (via docker-compose scale)
│   └── Port: 5001:3000
├── seoanalyze-worker-1 (BullMQ worker)
├── seoanalyze-worker-2 (BullMQ worker)
├── seoanalyze-postgres (PostgreSQL 14)
│   ├── Volume: postgres_data
│   └── Port: 5432 (internal only)
├── seoanalyze-redis (Redis 7)
│   ├── Volume: redis_data
│   └── Port: 6379 (internal only)
└── Shared Volume: artifacts_data
```

---

## 🎯 MÅL & FÖRDELAR

### Primära mål:
- ✅ **Isolering** - Separata databaser från stackr.se
- ✅ **Enhetlig drift** - Allt i Docker (som stackr.se)
- ✅ **Reproducerbarhet** - Samma miljö överallt (dev/prod)
- ✅ **Skalbarhet** - Enklare att öka workers/web-instanser

### Sekundära fördelar:
- Enklare backup/restore (Docker volumes)
- Bättre resource limits (CPU/RAM per container)
- Portabilitet (kan flytta till annan server enkelt)
- CI/CD-vänlig (automatiserad deployment)

---

## ⚠️ UTMANINGAR & LÖSNINGAR

### Utmaning 1: Chromium/Puppeteer i Docker
**Problem:** Lighthouse och screenshots kräver Chromium med 30+ system-dependencies

**Lösning:**
```dockerfile
# Använd Debian-based image (inte Alpine pga glibc)
FROM node:20-bookworm-slim

# Installera Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Sätt Puppeteer att använda system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

**Risker:**
- Docker image blir ~1.5GB (vs 400MB utan Chromium)
- Chromium kan krascha om dependencies saknas
- Lighthouse kan bli 10-15% långsammare i container

**Verifiering:**
```bash
# Testa att Puppeteer fungerar
docker run seoanalyze-web node -e "const puppeteer = require('puppeteer'); puppeteer.launch().then(b => b.close())"
```

---

### Utmaning 2: Artifacts-lagring
**Problem:** Screenshots/PDFs sparas i `/home/reda/Live-Server/artifacts` (1.2GB data)

**Lösning:**
```yaml
# docker-compose.yml
volumes:
  artifacts_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /home/reda/seo-artifacts
```

**Migration:**
```bash
# Kopiera befintliga artifacts
sudo cp -r /home/reda/Live-Server/artifacts/* /home/reda/seo-artifacts/
sudo chown -R 1000:1000 /home/reda/seo-artifacts
```

**Risker:**
- Volume kan växa okontrollerat (sätt cleanup-policy)
- Permissions-problem (container kör som user 1000)

---

### Utmaning 3: PostgreSQL Migration
**Problem:** Nuvarande databas kan vara delad med andra appar

**Kontrollera först:**
```bash
# Kolla vilka databaser som finns
psql -U seouser -d seoanalyzer -c "\l"

# Kolla om andra appar använder samma PostgreSQL-server
sudo netstat -tulpn | grep 5432
```

**Migration:**
```bash
# Export nuvarande data
pg_dump -U seouser -h localhost seoanalyzer > /tmp/seoanalyzer_backup.sql

# Import till Docker PostgreSQL (efter containern startar)
docker exec -i seoanalyze-postgres psql -U seouser -d seoanalyzer < /tmp/seoanalyzer_backup.sql
```

**Risker:**
- Dataförlust om backup misslyckas
- Downtime under migration (~5-10 min)
- Schema-versioner kan vara inkompatibla (om Prisma-versioner skiljer)

---

### Utmaning 4: Redis Job Queue
**Problem:** BullMQ har active jobs som kan förloras

**Lösning:** Redis data är INTE kritisk (kan börja tomt)
- Active jobs: Kommer failas, men det är okej
- Completed jobs: Sparas i PostgreSQL (inte Redis)
- Rate limiting: Återställs (okej, är per-domain)

**Om ni MÅSTE behålla job history:**
```bash
# Backup Redis data
redis-cli --rdb /tmp/redis_backup.rdb

# Restore i Docker Redis
docker cp /tmp/redis_backup.rdb seoanalyze-redis:/data/dump.rdb
docker restart seoanalyze-redis
```

---

### Utmaning 5: PM2 Cluster Mode (2 instanser)
**Problem:** PM2 kör 2 Next.js-instanser för load balancing

**Docker-lösning:**
```yaml
# docker-compose.yml
services:
  web:
    image: seoanalyze:latest
    deploy:
      replicas: 2  # 2 containers istället för PM2 cluster
```

**Alternativt (enklare):**
```bash
# Kör en container med Node.js cluster mode
# Next.js har redan inbyggd stöd för detta
NODE_ENV=production node server.js  # Om ni använder custom server
```

**Risker:**
- Load balancing behöver hanteras av Nginx (redan gör ni?)
- Session-hantering om ni lägger till auth (sticky sessions)

---

## 📊 RESOURCE REQUIREMENTS

### Nuvarande (PM2):
```
CPU: ~20% idle, 85% under load
RAM: 1.5GB baseline (web) + 2GB (workers) = 3.5GB total
Disk: 1.2GB (artifacts) + 500MB (PostgreSQL) = 1.7GB
```

### Docker (förväntad):
```
CPU: ~25% idle (+5% overhead), 90% under load
RAM:
  - web (2 replicas): 1.7GB (1.5GB + 200MB overhead)
  - workers (2): 2.2GB (2GB + 200MB overhead)
  - postgres: 300MB
  - redis: 100MB
  TOTAL: 4.3GB (~800MB mer än PM2)

Disk:
  - Docker images: 1.5GB (Chromium-image)
  - Volumes: 2GB (artifacts + postgres)
  TOTAL: 3.5GB (~1.8GB mer än PM2)
```

**Rekommendation:** Server behöver minst **8GB RAM** för bekväm drift.

---

## 🚀 MIGRATION PLAN

### Fas 1: Förberedelse (1-2 dagar)
- [ ] Skapa `Dockerfile` med Chromium-dependencies
- [ ] Skapa `docker-compose.yml` med alla services
- [ ] Skapa `.dockerignore` (exkludera node_modules, .next, logs)
- [ ] Skapa `docker-entrypoint.sh` (Prisma migrations + startup)
- [ ] Testa lokalt: `docker-compose up`
- [ ] Verifiera Puppeteer fungerar i container
- [ ] Verifiera Lighthouse fungerar i container

### Fas 2: Data Migration (2-4 timmar)
- [ ] Backup PostgreSQL: `pg_dump seoanalyzer > backup.sql`
- [ ] Backup Redis: `redis-cli --rdb backup.rdb` (optional)
- [ ] Kopiera artifacts: `cp -r artifacts/ /home/reda/seo-artifacts/`
- [ ] Verifiera backups är kompletta

### Fas 3: Parallell Testning (3-7 dagar)
- [ ] Starta Docker stack på port 5002 (test)
- [ ] PM2 fortsätter köra på port 5001 (prod)
- [ ] Importera PostgreSQL data till Docker
- [ ] Kör test-analyser via port 5002
- [ ] Jämför prestanda: Lighthouse-tid, memory usage, CPU
- [ ] Testa stress: `artillery run artillery-stress-test.yml` mot port 5002
- [ ] Verifiera att artifacts sparas korrekt
- [ ] Kör i 1 vecka parallellt, monitora stabilitet

### Fas 4: Cutover (30 min downtime)
**Före cutover:**
- [ ] Sätt maintenance mode på seoanalyze.se
- [ ] Vänta på att alla aktiva jobb slutförs (eller cancel)
- [ ] Final backup: PostgreSQL + artifacts

**Cutover:**
- [ ] Stoppa PM2: `pm2 stop seo-nextjs-prod seo-nextjs-workers`
- [ ] Uppdatera Nginx: port 5002 → 5001 (om nödvändigt)
- [ ] Starta Docker på port 5001: `docker-compose up -d`
- [ ] Kör health checks:
  ```bash
  curl http://localhost:5001/api/health
  curl http://localhost:5001/api/cache/health
  ```
- [ ] Ta bort maintenance mode
- [ ] Monitora logs: `docker-compose logs -f`

**Rollback-plan:**
```bash
# Om något går fel
docker-compose down
pm2 start ecosystem.config.js
# Uppdatera Nginx tillbaka till PM2-setup
```

### Fas 5: Cleanup (1-2 dagar)
- [ ] Kör i Docker i 1 vecka utan problem
- [ ] Ta bort PM2-processer: `pm2 delete all && pm2 save`
- [ ] Radera gamla logs: `rm -rf logs/`
- [ ] Radera `.next` build-artifacts från PM2-epoken
- [ ] Dokumentera nya deployment-rutiner
- [ ] Uppdatera README.md med Docker-instruktioner

---

## 📈 SUCCESS METRICS

### Före migration (PM2 baseline):
- Lighthouse analysis time: **30s** (median)
- Max concurrent users: **150** (stress test)
- Memory usage: **3.5GB** total
- Uptime: **99.2%** (sista 30 dagarna)
- Cold start: **3s**

### Efter migration (Docker target):
- Lighthouse analysis time: **≤35s** (max 15% långsammare)
- Max concurrent users: **≥140** (max 10% lägre throughput)
- Memory usage: **≤5GB** (max 1.5GB mer overhead)
- Uptime: **≥99%** (samma eller bättre)
- Cold start: **≤6s** (acceptabelt för production)

### KPI:er för success:
✅ Zero data loss (alla analyser migrerade)
✅ <1 timme total downtime
✅ <15% performance-degradation
✅ Inga critiska bugs första veckan
✅ Enklare deployment (docker-compose up)

---

## 🔒 SÄKERHETSASPEKTER

### Secrets Management:
**Nuvarande:** `.env.production` i projektmappen (644 permissions - RISK!)

**Docker:**
```yaml
# docker-compose.yml
services:
  web:
    env_file: .env.production  # Läses från host
    environment:
      - DATABASE_URL=${DATABASE_URL}  # Från .env
```

**Rekommendation:** Använd Docker Secrets (senare):
```yaml
secrets:
  db_password:
    file: /home/reda/secrets/db_password.txt

services:
  web:
    secrets:
      - db_password
```

### Network Isolation:
```yaml
networks:
  frontend:  # web + nginx
  backend:   # web + postgres + redis + workers
```

**Resultat:**
- PostgreSQL INTE exponerad till internet (internal network only)
- Redis INTE exponerad (internal network only)
- Endast web-container på frontend-network

### Resource Limits (säkerhet):
```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

**Skydd mot:**
- Memory exhaustion attacks
- CPU starvation
- Fork bombs (Docker isolering)

---

## 🛠️ VERKTYG & KOMMANDON

### Development:
```bash
# Bygg image
docker build -t seoanalyze:latest .

# Starta alla services
docker-compose up -d

# Loggar
docker-compose logs -f web
docker-compose logs -f workers

# Shell i container
docker exec -it seoanalyze-web bash

# Kör Prisma migrations
docker exec seoanalyze-web npx prisma migrate deploy

# Restart en service
docker-compose restart web
```

### Production:
```bash
# Deploy ny version (zero downtime)
docker-compose pull
docker-compose up -d --no-deps --build web

# Health checks
docker ps --filter "name=seoanalyze"
docker stats seoanalyze-web

# Backup PostgreSQL
docker exec seoanalyze-postgres pg_dump -U seouser seoanalyzer > backup.sql

# Backup artifacts
docker run --rm -v seoanalyze_artifacts:/data -v $(pwd):/backup \
  alpine tar czf /backup/artifacts-backup.tar.gz /data
```

### Monitoring:
```bash
# Resource usage
docker stats --no-stream

# Disk usage
docker system df
docker volume ls

# Network inspection
docker network inspect seoanalyze_backend

# Container health
docker inspect --format='{{.State.Health.Status}}' seoanalyze-web
```

---

## 📚 FILER SOM BEHÖVER SKAPAS

### 1. `Dockerfile`
- Base image: `node:20-bookworm-slim`
- Installera Chromium + dependencies
- Kopiera source code
- Build Next.js app
- Entrypoint: Prisma migrate + start

### 2. `docker-compose.yml`
- Service: web (Next.js, replicas: 2)
- Service: worker (BullMQ, replicas: 2)
- Service: postgres (PostgreSQL 14)
- Service: redis (Redis 7-alpine)
- Volumes: postgres_data, redis_data, artifacts_data
- Networks: frontend, backend

### 3. `.dockerignore`
```
node_modules
.next
.git
logs
*.log
.env.local.backup
npm-debug.log*
.DS_Store
```

### 4. `docker-entrypoint.sh`
```bash
#!/bin/bash
set -e

# Wait for PostgreSQL
until pg_isready -h postgres -U seouser; do
  sleep 1
done

# Run migrations
npx prisma migrate deploy

# Start application
exec "$@"
```

### 5. `.env.docker` (template)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://seouser:PASSWORD@postgres:5432/seoanalyzer
REDIS_URL=redis://:PASSWORD@redis:6379
ARTIFACTS_LOCAL_PATH=/app/artifacts
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

---

## ⏱️ TIDSESTIMERING

| Fas | Tid | Downtime |
|-----|-----|----------|
| **Förberedelse** | 1-2 dagar | 0 min |
| **Data Migration** | 2-4 timmar | 0 min (parallellt) |
| **Parallell Testning** | 3-7 dagar | 0 min |
| **Cutover** | 30-60 min | **30 min** |
| **Monitoring** | 1 vecka | 0 min |
| **Cleanup** | 1-2 dagar | 0 min |
| **TOTAL** | **~2 veckor** | **30 min** |

---

## ✅ CHECKLISTA

### Pre-Migration:
- [ ] Servern har minst 8GB RAM tillgängligt
- [ ] Disk space: minst 10GB fritt
- [ ] Backup-strategi dokumenterad
- [ ] Rollback-plan testad
- [ ] Stakeholders informerade om planerad downtime

### Migration Day:
- [ ] Final backup: PostgreSQL + artifacts + Redis
- [ ] PM2-processer stoppade
- [ ] Docker containers startade
- [ ] Database importerad
- [ ] Health checks: PASSED
- [ ] Test-analys körd: SUCCESS
- [ ] Nginx uppdaterad (om nödvändigt)
- [ ] Monitoring aktiverat

### Post-Migration (första veckan):
- [ ] Inga critiska errors i logs
- [ ] Performance inom target (≤15% degradation)
- [ ] Uptime ≥99%
- [ ] Artifacts sparas korrekt
- [ ] BullMQ workers processar jobb
- [ ] Lighthouse-analyser fungerar
- [ ] Screenshots genereras

### Cleanup (efter 1 vecka):
- [ ] PM2 helt borttaget
- [ ] Gamla logs raderade
- [ ] Dokumentation uppdaterad
- [ ] Team tränade i Docker-kommandon

---

## 🚨 RISKER & MITIGATION

### Risk 1: Chromium crashes i production
**Sannolikhet:** Medium
**Impact:** Hög (Lighthouse-analyser failar)
**Mitigation:**
- Testa Chromium grundligt i dev
- Ha fallback: lägg till `--no-sandbox --disable-setuid-sandbox` flags
- Monitoring: alert om >10% Lighthouse failures

### Risk 2: Data loss under migration
**Sannolikhet:** Låg
**Impact:** Kritisk
**Mitigation:**
- Triple backup: PostgreSQL + artifacts + Redis
- Verify backups innan cutover
- Dry-run på staging environment först

### Risk 3: Performance degradation >20%
**Sannolikhet:** Låg
**Impact:** Medium
**Mitigation:**
- Parallell-testning i 1 vecka
- Artillery stress test innan cutover
- Rollback om degradation >20%

### Risk 4: Långt downtime (>1 timme)
**Sannolikhet:** Medium
**Impact:** Medium
**Mitigation:**
- Maintenance mode med ETA
- Cutover under låg-trafik (natt/helg)
- Tydlig rollback-plan

---

## 📞 SUPPORT & ESKALERING

### Docker-problem:
- Logs: `docker-compose logs -f`
- Restart: `docker-compose restart SERVICE`
- Rebuild: `docker-compose up -d --build`

### Rollback:
```bash
# Emergency rollback (om Docker failar)
docker-compose down
pm2 start ecosystem.config.js
sudo systemctl reload nginx
```

### Eskalering:
1. Kolla logs: `docker-compose logs --tail=100`
2. Health check: `curl localhost:5001/api/health`
3. Container status: `docker ps`
4. Om kritiskt: ROLLBACK till PM2

---

## 🎯 SLUTSATS

### Är Docker värt det?

**JA, om:**
- ✅ Ni vill ha isolering från stackr.se
- ✅ Ni kan acceptera 30 min downtime
- ✅ Ni har 8GB+ RAM på servern
- ✅ Ni vill ha enhetlig drift (allt i Docker)

**NEJ, om:**
- ❌ Servern har <6GB RAM
- ❌ Ni inte kan acceptera 10-15% performance overhead
- ❌ Ni delar PostgreSQL med kritiska andra appar
- ❌ Ni inte har tid för 2 veckors migration

### Rekommendation:
**GO AHEAD** - Docker är rätt val för er långsiktigt. Chromium-setup kräver noggrannhet, men är lösbart. Största vinsten är isolering och framtida skalbarhet.

---

**Nästa steg:** Beslut om migration (Ja/Nej) → Skapa Dockerfile + docker-compose.yml → Testning

**Datum för beslut:** _____________
**Datum för migration:** _____________
**Ansvarig:** _____________

---

**Status:** 🟡 PLANERING
**Senast uppdaterad:** 2025-10-05
