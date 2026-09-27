# Deployment Guide

## Backend

### Docker Build
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY services/api/package*.json ./
RUN npm ci
COPY services/api ./
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
```

### Env (prod)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=32+ chars random
JWT_REFRESH_SECRET=32+ chars random
ALLOW_DEV_AUTH=false
OTP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=...
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=guftagu-prod-media
S3_REGION=us-east-1
...
```

### Migrations
```
npx prisma migrate deploy
npx prisma generate
```

### Health
- GET /api/v1/docs should 200
- WS /ws should accept token

## Infra Prod
- Use RDS Postgres 16, ElastiCache Redis 7, S3 private bucket
- MinIO only for local
- Enable versioning, PITR backups
- WAF, ALB, TLS cert

## Mobile Release

### Android
1. Create keystore: keytool -genkey -v -keystore guftagu.jks -keyalg RSA -keysize 2048 -validity 10000 -alias guftagu
2. Create android/key.properties (never commit)
```
storePassword=...
keyPassword=...
keyAlias=guftagu
storeFile=../guftagu.jks
```
3. Configure android/app/build.gradle signingConfigs release from key.properties
4. flutter build appbundle --release --dart-define=API_BASE_URL=https://api.guftagu.example.com/api/v1
5. Upload AAB to Play Console, complete Data Safety, deletion page

### iOS
1. Apple Developer: identifier com.ruhikreguftagu.saad, capabilities Push, Background Modes
2. Certificates, provisioning
3. Info.plist purpose strings already in example
4. flutter build ipa --release --dart-define=API_BASE_URL=https://api.guftagu.example.com/api/v1
5. Xcode Organizer -> Distribute -> TestFlight

## Monitoring
- Logs: pino, redacted
- Metrics: Prometheus + Grafana for WS connections, message rate, OTP rate limiting
- Alerts: high 5xx, DB connections, Redis down

## Scaling
- API stateless, horizontal via Redis adapter for Socket.IO
- Sticky sessions not needed with Redis adapter
- Postgres read replicas for message history

## Security Hardening
- Enable WAF, rate limiting at ALB
- Rotate JWT secrets periodically, revoke sessions
- S3 bucket private, no public access, presigned only
- Dependency audit weekly
