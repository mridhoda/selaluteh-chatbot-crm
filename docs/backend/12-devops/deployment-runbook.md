# Deployment Runbook

## Goal

Deploy backend/frontend safely without breaking CRM, Telegram bot, payment webhook, or local file storage.

## Pre-Deployment Checklist

- [ ] Current branch is correct.
- [ ] Latest code is pulled.
- [ ] Dependencies installed.
- [ ] Env variables verified.
- [ ] Database connection verified.
- [ ] Upload directory exists.
- [ ] Upload directory is persistent.
- [ ] Payment provider sandbox/production mode confirmed.
- [ ] Telegram webhook public URL confirmed.
- [ ] Backup completed if deployment touches data.
- [ ] Rollback version identified.

## Deployment Steps

### 1. Announce Deployment

If production:

```txt
Announce short maintenance or low-risk deploy window.
```

### 2. Backup Critical Data

Backup:

- database
- uploads directory
- env/config snapshot if needed

### 3. Deploy Backend

Typical steps:

```bash
git pull
npm --prefix server install
npm --prefix server run build # if build exists
pm2 restart backend # or docker compose restart server
```

Adjust commands to actual infrastructure.

### 4. Deploy Frontend

Typical steps:

```bash
npm --prefix web install
npm --prefix web run build
```

If Docker:

```bash
docker compose build web server
docker compose up -d
```

### 5. Verify Services

Check:

```txt
GET /health
login
dashboard
inbox
Telegram webhook
payment webhook health
```

### 6. Run Smoke Tests

Minimum:

- login owner
- open dashboard
- open inbox
- send Telegram test message
- human takeover test
- create test product/cart/order if marketplace enabled
- test payment sandbox webhook if payment changed

## Post-Deployment

- [ ] Monitor logs for 15–30 minutes.
- [ ] Check error rate.
- [ ] Check webhook processing.
- [ ] Check payment events.
- [ ] Check AI provider errors.
- [ ] Record deployment in deployment log.

## Deployment Log Template

```md
## YYYY-MM-DD HH:mm — Deployment

Version/commit:
Operator:
Changes:
Backup taken:
Smoke tests:
Issues:
Rollback needed: yes/no
```
