# Credentials & Kommandon

## Redis
```
Lösenord: XfLgByQsiJir5gatEMfSOR6yUZIT3jjd
Host: localhost:6379
```

## PostgreSQL
```
User: seouser
Password: 2WiUDRsAGq5Vuxdkj5yeA3cUM0uIvjEz
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

## Build & Deploy
```bash
# Bygg och starta om
npm run build && pm2 restart seo-nextjs-prod

# Kolla loggar vid problem
pm2 logs seo-nextjs-prod --lines 50
```

## Testa API:er
```bash
# Stats API
curl -s http://localhost:5001/api/stats | jq

# Health check
curl -s http://localhost:5001/api/cache/health | jq
```
