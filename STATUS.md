# SEO Analyzer - Systemstatus

**Senast uppdaterad:** 2025-12-13 19:45 UTC

---

## Driftstatus

| Tjänst | Status | Uptime |
|--------|--------|--------|
| Next.js (seo-nextjs-prod) | ✅ Online | 36h |
| Workers (seo-nextjs-workers x2) | ✅ Online | 36h |
| Lighthouse Worker | ✅ Online | 36h |
| Redis | ✅ Online | 36h |
| PostgreSQL | ✅ Online | 36h |
| Nginx | ✅ Online | 36h |

---

## Säkerhetsstatus

**Overall Risk Score: 4.5/10** (Förbättrat från 6.8)

| Säkerhetsåtgärd | Status |
|-----------------|--------|
| Redis lösenord | ✅ Aktivt |
| .env permissions (600) | ✅ OK |
| TLS 1.2/1.3 | ✅ Endast |
| server_tokens off | ✅ OK |
| Fail2Ban | ✅ 319 bannade IPs |
| Root SSH-nyckel | ✅ Borttagen |
| Malware | ✅ Rent |

---

## Serverspecifikationer

| Resurs | Värde |
|--------|-------|
| OS | Ubuntu 24.04 LTS |
| Kernel | 6.8.0-90-generic |
| CPU | 4 cores |
| RAM | 8GB |
| Disk | 77GB (27% använt) |

---

## Portar

| Port | Tjänst | Extern |
|------|--------|--------|
| 22 | SSH | Ja |
| 80 | HTTP (redirect) | Ja |
| 443 | HTTPS | Ja |
| 5001 | Next.js | Intern |
| 5002 | Lighthouse Worker | Intern |
| 5432 | PostgreSQL | Intern |
| 6379 | Redis | Intern |

---

## Credentials (KONFIDENTIELLT)

### Redis
```
Lösenord: XfLgByQsiJir5gatEMfSOR6yUZIT3jjd
```

### PostgreSQL
```
User: seouser
Database: seoanalyzer
Host: localhost:5432
```

---

## PM2 Processer

```
seo-nextjs-prod      | fork | 64.8mb  | online
seo-nextjs-workers   | fork | 97.8mb  | online (x2)
lighthouse-worker    | fork | 57.4mb  | online
pm2-logrotate        | fork | 75.2mb  | online
```

---

## Kända problem

1. **API Authentication** - Ej implementerat (planerat)
2. **npm audit** - Behöver köras för dependency updates

---

## Incident-historik

| Datum | Incident | Åtgärd |
|-------|----------|--------|
| 2025-12-07 | XMRig Monero miner upptäckt | Borttagen, crontab rensad |
| 2025-12-13 | Säkerhetsaudit | Redis pwd, .env perms, TLS fixat |

---

## Kontakt

- **Domän:** seoanalyze.se
- **Server:** DigitalOcean Droplet "SeoWorker"
- **IP:** 128.199.44.138
