# Viktigt - PM2 Production Deployment

## Problem: PM2 läser inte uppdaterad ecosystem.config.js

När du uppdaterar `ecosystem.config.js` (t.ex. environment-variabler eller memory limits) så läser PM2 **INTE** automatiskt om konfigurationen vid `pm2 restart`.

## Lösningen:

```bash
NODE_ENV=production npm install
pm2 delete all                          # Ta bort alla gamla processer
pm2 start ecosystem.config.js           # Starta HELT nya processer med rätt config
pm2 save                                # Spara till dump.pm2
```

Detta säkerställde att:
- DEEPSEEK_API_KEY laddades från ecosystem.config.js
- Memory limit uppdaterades från gamla 1100MB till 2048MB
- Alla environment-variabler är korrekta
- Konfigurationen sparas permanent i /home/reda/.pm2/dump.pm2

## Varför?

PM2 cachar environment-variabler från när processen först startades. `pm2 restart` eller `pm2 restart --update-env` läser **inte alltid** om alla värden från `ecosystem.config.js`.

**Säkraste sättet:** `pm2 delete all` + `pm2 start ecosystem.config.js` + `pm2 save`

## Verifiering

```bash
# Kolla att processerna kör
pm2 list

# Kolla environment-variabler (ersätt 5 med worker process ID)
pm2 env 5 | grep DEEPSEEK_API_KEY

# Kolla att config är sparad
grep -c "DEEPSEEK_API_KEY" /home/reda/.pm2/dump.pm2
```

---

## Säkerhetskonfiguration (Uppdaterad 2025-12-13)

### Redis
```bash
# Lösenord (spara säkert!)
XfLgByQsiJir5gatEMfSOR6yUZIT3jjd

# Testa anslutning
redis-cli -a 'XfLgByQsiJir5gatEMfSOR6yUZIT3jjd' PING
```

### .env-filer
Alla .env-filer ska ha permissions 600:
```bash
chmod 600 .env .env.local .env.production
```

### Nginx
- TLS 1.2/1.3 endast
- server_tokens off
- Security headers aktiverade

### Kernel
- Nuvarande: 6.8.0-90-generic
