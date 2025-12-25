# SEO ANALYZER - KOMPLETT SYSTEMARKITEKTUR
*Genererad 29 september 2025* | **Uppdaterad: 13 december 2025**

## 🖥️ INFRASTRUKTUR ÖVERSIKT

### Virtual Machine Specifikationer
- **Provider**: DigitalOcean Droplet
- **OS**: Ubuntu 24.04.3 LTS (Noble)
- **Kernel**: 6.8.0-90-generic (uppdaterad 2025-12-13)
- **CPU**: 4x Intel DO-Regular (4 cores, VT-x enabled)
- **RAM**: 8GB (7.8Gi tillgängligt)
- **Swap**: 4GB
- **Disk**: 77GB (21GB använt, 56GB ledigt)
- **Hostname**: SeoWorker
- **IP**: 128.199.44.138

## 🔒 NÄTVERKSSÄKERHET

### UFW (Uncomplicated Firewall)
**Status**: Aktivt med strikt policy

```
Default Policy:
- Incoming: DENY (blockerar allt som standard)
- Outgoing: ALLOW
- Routed: DISABLED

Tillåtna portar (Incoming):
- 22/tcp  (SSH)
- 80/tcp  (HTTP)
- 443/tcp (HTTPS)
```

### Fail2Ban
**Status**: Aktivt

```
Aktiva jails:
- sshd (SSH brute-force protection)

Statistik (2025-12-13):
- Currently banned: 319 IP-adresser
- Total banned: 886 IP-adresser
- Total failed attempts: 3,170
```

### TLS/SSL
- **Protokoll**: TLSv1.2 och TLSv1.3 endast
- **Certifikat**: Let's Encrypt (auto-renewal)
- **server_tokens**: off

### IPTables
```
Policy: DROP (default blockera allt)
Hanteras genom UFW-kedjan:
- ufw-before-input
- ufw-after-input
- ufw-reject-input
- ufw-track-input
```

## 🌐 WEBBSERVER (NGINX)

### Nginx Configuration
**Version**: nginx/1.24.0 (Ubuntu)
**Config**: `/etc/nginx/sites-available/seoanalyze.conf`

### Säkerhetshuvuden
```nginx
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Routing Setup
1. **HTTPS (443)**:
   - Huvudtrafik → Next.js (port 5001)
   - `/old/` → React legacy app (port 5000)
   - SSL via Let's Encrypt

2. **HTTP (80)**:
   - Auto-redirect till HTTPS

3. **Säkerhetsblock**:
   - Blockerar `.env`, `.log` filer
   - Blockerar dolda filer (`/.`)

### SSL/TLS
- **Certifikat**: Let's Encrypt (automatisk förnyelse)
- **Protokoll**: TLS 1.2+ enforced
- **DH Params**: 2048-bit

## 🗄️ DATABASER

### PostgreSQL 16
**Status**: Aktiv, optimerad för 8GB RAM

```
Databas: seoanalyzer
Storlek: 9.6MB
Användare: seouser

Tabeller:
- Analysis (huvudtabell för analyser)
- AnalysisArtifact (lagrade artefakter)
- ChangeDetection (ändringsövervakning)
- ChangeSnapshot (historiska snapshots)
- Share (delningslänkar)
- rum_events (Real User Metrics)

Nuvarande inställningar:
- shared_buffers: 128MB (bör vara 1GB)
- max_connections: 100
- work_mem: 4MB (bör vara 16MB)
```

### Redis
**Status**: Aktiv cache/queue

```
Version: 7.x
Port: 6379 (localhost only)
Konfiguration:
- maxmemory: 2GB
- eviction policy: allkeys-lru
- Nuvarande användning: 459MB

Keyspace:
- 4,417 nycklar
- 2 med expiry
- Genomsnittlig TTL: 7,048 sekunder

Används för:
- BullMQ job queues
- Session caching
- Rate limiting
- Temporär data
```

## 🚀 APPLIKATIONSSTACK

### Node.js
**Version**: v20.19.4

### PM2 Process Manager
**Status**: Systemd service (pm2-reda.service)

```
Aktiva processer:
┌──────────────────────┬──────────┬─────────┬─────────┬──────────┐
│ Process              │ Instanser│ Mode    │ Memory  │ Restarts │
├──────────────────────┼──────────┼─────────┼─────────┼──────────┤
│ seo-nextjs-prod      │ 1        │ cluster │ ~61MB   │ 0        │
│ seo-nextjs-workers   │ 2        │ fork    │ ~330MB  │ 2        │
│ lh-worker            │ 1        │ fork    │ 58MB    │ 0        │
│ pm2-logrotate        │ 1        │ module  │ 67MB    │ -        │
└──────────────────────┴──────────┴─────────┴─────────┴──────────┘
```

**Problem löst**: Instabil process 11 borttagen - kör nu endast stabil instance 12

### Next.js Application
```
Framework: Next.js 15.5.2 med Turbopack
Arkitektur: App Router
Build: Production optimerad (npm run build, EJ standalone mode)
Portar: 5001 (huvudapp)

Miljövariabler:
- NODE_ENV: production
- NODE_OPTIONS: --max-old-space-size=1536
- CRAWL_CONCURRENCY: 15
- LIGHTHOUSE_CONCURRENCY: 3
- UV_THREADPOOL_SIZE: 16
```

### Worker Architecture
```
Queue System: BullMQ (Redis-backed)
Workers:
- SEO analysis worker
- Lighthouse worker (separat process)
- Crawl worker
- PDF generation

Lighthouse Worker:
- Port: 5002 (localhost)
- Chrome path: /usr/bin/chromium
- Timeout: 30s
- Max concurrency: 3
```

## 📊 SYSTEMÖVERVAKNING

### Aktiva tjänster
```
✅ nginx.service - Webbserver & reverse proxy
✅ postgresql@16-main.service - Databas
✅ redis-server.service - Cache & queues
✅ pm2-reda.service - Process manager
✅ fail2ban.service - Säkerhet
```

### Loggning
```
Nginx:
- Access: /home/reda/Live-Server/logs/nginx-access.log
- Error: /home/reda/Live-Server/logs/nginx-error.log

PM2/Node:
- /home/reda/seo-analyzer-nextjs/logs/
- Rotation via pm2-logrotate
- Separata loggar per process
```

### Resursanvändning
```
RAM: 2.2GB av 7.8GB (28%)
CPU: <5% i vila
Disk: 21GB av 77GB (27%)
Redis: 459MB av 2GB
PostgreSQL: 9.6MB

Process-minne:
- Workers: ~660MB total
- Next.js: ~120MB total
- Lighthouse: 58MB
- PM2: 67MB
```

## 🔐 SÄKERHETSÅTGÄRDER

### Nätverksnivå
1. **UFW**: Strikt firewall med minimal exponering
2. **Fail2Ban**: 791 blockerade IP-adresser
3. **SSH**: Endast port 22, skyddad av fail2ban
4. **HTTPS**: Enforced med HSTS

### Applikationsnivå
1. **Nginx säkerhetshuvuden**: XSS, clickjacking, MIME-type protection
2. **Rate limiting**: Via Redis
3. **Blockerade filer**: .env, .log, dolda filer
4. **SSL/TLS**: Let's Encrypt med auto-förnyelse

### Databas
1. **PostgreSQL**: Endast localhost
2. **Redis**: Endast localhost, password-skyddad
3. **Begränsade användare**: seouser för PostgreSQL

## ⚡ OPTIMERINGAR (September 2025)

### Implementerade
✅ PM2 Cluster mode (2 instanser)
✅ Worker parallellisering (2 instanser)
✅ Redis maxmemory: 2GB med LRU eviction
✅ Ökad concurrency: Crawl (15), Lighthouse (3)
✅ Node.js heap: 1536MB (prod), 2048MB (workers)

### Rekommenderade
⚠️ PostgreSQL behöver optimering (kör optimize-postgresql.sh)
⚠️ Fix instabil seo-nextjs-prod process (1858 restarts)
⚠️ Stäng port 3000 i UFW (development port)
⚠️ Implementera backup-strategi för databas

## 📈 PRESTANDA

### Kapacitet
- **Samtidiga analyser**: 8-10 st
- **Crawling**: 15 sidor parallellt
- **Lighthouse**: 3 parallella analyser
- **Response time**: ~23ms (main app), ~6ms (lighthouse)

### Skalbarhet
- Cluster mode ger zero-downtime deployment
- Load balancing över 2 Next.js instanser
- Redis cache för 2GB data
- 5.6GB RAM tillgängligt för expansion

## 🏗️ ARKITEKTURDIAGRAM

```
Internet
    │
    ├─── [443/HTTPS] ──→ Nginx (Reverse Proxy)
    │                         │
    │                         ├──→ Next.js App (5001)
    │                         │    ├── Instance 1
    │                         │    └── Instance 2
    │                         │
    │                         └──→ Legacy React (5000)
    │
    ├─── [80/HTTP] ────→ Auto-redirect to HTTPS
    │
    └─── [22/SSH] ─────→ Protected by Fail2Ban

Internal Services:
    │
    ├── PostgreSQL (5432) - localhost only
    ├── Redis (6379) - localhost only
    ├── Lighthouse Worker (5002) - localhost only
    │
    └── PM2 Manager
        ├── SEO Workers (2x)
        ├── Next.js Cluster (2x)
        └── Lighthouse Worker (1x)
```

## 🚨 IDENTIFIERADE PROBLEM

1. **Fixed**: Instabil process borttagen - systemet kör nu stabilt
2. **Security**: Port 3000 öppen externt (development)
3. **Performance**: PostgreSQL ej optimerad för 8GB RAM
4. **Maintenance**: Ingen automatisk backup-rutin

## ✅ SLUTSATS

Systemet är välbyggt med:
- Stark säkerhetsgrund (UFW, Fail2Ban, HTTPS)
- God skalbarhet (PM2 cluster, Redis cache)
- Modern stack (Next.js 15, Node 20)
- Effektiv resursanvändning (28% RAM)

Men behöver åtgärda:
- Process-instabilitet
- PostgreSQL-optimering
- Säkerhetsförbättringar
- Backup-strategi

**Total bedömning**: Produktionsklar med mindre justeringar behövda.