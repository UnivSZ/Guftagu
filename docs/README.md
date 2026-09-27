# Guftagu — Messenger

**App Name:** Guftagu  
**Android:** `com.ruhikreguftagu.saad`  
**iOS:** `com.ruhikreguftagu.saad`  
**Dev:** Saad Hussain  
**Co-Dev:** Ashad Ahamad  

Guftagu means conversation (Urdu). Familiar like WhatsApp/Telegram (95% nav) + signature features:
1. Planning Cards (RSVP, voting, threshold notify)
2. Group Spaces (themes, quote, shared media, upcoming plans)
3. Trivia (server-authoritative, no answer leak)

## Repository Structure
```
apps/mobile - Flutter app (Riverpod, go_router, Drift, secure storage)
services/api - NestJS + Prisma + PostgreSQL + Redis + Socket.IO + S3
infra - docker-compose (postgres, redis, minio)
docs - architecture, api, security, release
```

## Quick Start (Local Dev)

### Prerequisites
- Node 20+, npm
- Flutter 3.22+ (for mobile)
- Docker & Docker Compose (for infra) OR local Postgres/Redis
- Android Studio / Xcode for emulators

### 1. Infra (one command)
```bash
cd infra
docker-compose up -d
# Postgres :5432, Redis :6379, MinIO :9000 (console :9001)
```

Create bucket `guftagu-media` in MinIO console (http://localhost:9001 minioadmin/minioadmin)

### 2. Backend
```bash
cd services/api
cp .env.example .env
# Edit .env if needed (secrets)
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run start:dev
# API: http://localhost:3000/api/v1
# Docs: http://localhost:3000/api/v1/docs
```

### 3. Mobile
```bash
cd apps/mobile
flutter pub get
# Generate drift
dart run build_runner build --delete-conflicting-outputs
# Run
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1  # Android emulator
flutter run --dart-define=API_BASE_URL=http://localhost:3000/api/v1 # iOS simulator
```

For physical device, set API_BASE_URL to your machine LAN IP, e.g. `http://192.168.1.5:3000/api/v1`

### 4. Tests
```bash
cd services/api
npm test
npm run test:e2e
cd ../../apps/mobile
flutter test
```

## API Overview
- `POST /auth/request-otp` - request OTP (dev logs code)
- `POST /auth/verify-otp` - verify, get tokens
- `POST /auth/refresh` - rotate refresh
- `GET /users/me`, `PATCH /users/me`, `GET /users/by-username/:username`, `GET /users/search?q=`
- `GET /conversations`, `POST /conversations/direct`, `POST /conversations/group`, `GET /conversations/:id`
- `GET /conversations/:id/messages?cursor=&limit=`, `POST /conversations/:id/messages`
- `PATCH /messages/:id` (edit), `DELETE /messages/:id/for-me`, `DELETE /messages/:id/for-everyone`
- `POST /messages/:id/reactions`
- `POST /conversations/:id/plans`, `GET /conversations/:id/plans`, `POST /plans/:id/rsvp`, `POST /plans/:id/vote`
- `POST /conversations/:id/trivia/start`, `POST /trivia/:id/join`, `GET /trivia/:id`, `POST /trivia/:id/answer`
- `POST /media/upload-url`, `GET /media/download-url`
- `POST /push/tokens`
- `POST /calls`, `GET /calls/history`
- `GET /spaces/:conversationId`, `GET /spaces/themes`
- WebSocket `/ws` with auth token, events: `message:new`, `typing`, `message:delivered`, `message:read`, `presence:update`

See OpenAPI at `/api/v1/docs`

## Security & Privacy
- Transport: TLS (HTTPS/WSS) in prod, Helmet, CORS
- Auth: JWT 15m access + rotating 30d refresh (argon2 hashed), session revocation
- OTP: abstraction, DevOtpProvider only when ALLOW_DEV_AUTH=true and NODE_ENV!=production, rate limit, expiry 5m, cooldown 60s, max attempts 5
- Membership checks on every conversation operation, immediate WS kick on removal
- Media: private S3, presigned URLs (15m GET, 1h PUT)
- **E2EE: NOT implemented in v1**. Explicitly documented. No lock badges. Future: MLS/Signal with audit. See docs/SECURITY.md
- Blocks, reports, account deletion (messages remain with recipients per policy)

## Feature Matrix
| Feature | Implemented | Tested | Notes |
|---|---|---|---|
| Auth OTP abstraction + dev bypass | ✅ | ✅ | No prod universal OTP |
| Username discovery | ✅ | ✅ | |
| Direct messaging | ✅ | ✅ | Idempotent, seq ordering |
| Group messaging | ✅ | ✅ | Owner/Admin/Member |
| Replies, reactions, edit, delete | ✅ | ✅ | Edit 15m, delete everyone 2h |
| Offline queue, reconnect backoff | ✅ (client) | Partial | Drift queue + WS retry |
| Typing, receipts, presence | ✅ | ✅ | Delivered != WS emit |
| Media presigned S3 | ✅ | ✅ | Size limits enforced |
| Planning Cards | ✅ | ✅ | Threshold notifies organiser |
| Spaces/themes/quote | ✅ | ✅ | 6 curated themes |
| Trivia game | ✅ | ✅ | Server authoritative |
| Calls signalling | ✅ (basic) | Partial | WebRTC STUN/TURN needed |
| Push tokens | ✅ | Partial | FCM integration placeholder |
| Block/report/delete account | ✅ | ✅ | |
| Two-pane tablet | ✅ (adaptive) | Manual | LayoutBuilder >600dp |
| Performance 60fps | ✅ (lazy, thumbnails) | Manual | Measure in profile mode |

## Mobile Build Instructions
### Android
- applicationId `com.ruhikreguftagu.saad` in `android/app/build.gradle`
- Adaptive icon: `android/app/src/main/res/mipmap-*`
- Splash: `flutter_native_splash` config
- Release AAB: `flutter build appbundle --release`
- Keystore: create via `keytool -genkey -v -keystore guftagu.jks -keyalg RSA -keysize 2048 -validity 10000 -alias guftagu`
- Never commit keystore, configure `android/key.properties`
- Target SDK 34, check Play policy

### iOS
- Bundle ID `com.ruhikreguftagu.saad` in Xcode
- Capabilities: Push, Background Modes (audio, voip if calling)
- Permission strings in Info.plist: NSCameraUsageDescription, NSMicrophoneUsageDescription, NSPhotoLibraryUsageDescription
- Privacy manifest
- Archive: `flutter build ipa --release` or Xcode Archive -> TestFlight

## Deployment
- Backend: Docker image `node:20-alpine`, run migrations `prisma migrate deploy`, env secrets via vault
- Postgres backups, Redis persistence, S3 private bucket
- Use managed Postgres (RDS), Redis (ElastiCache), S3
- HTTPS/WSS via ALB/Cloudflare

## About Screen
Settings -> About shows:
- Dev - Saad Hussain
- Co-Dev - Ashad Ahamad
- Version, bundle ID, privacy note, mission

## Limitations & Next Steps
- E2EE not implemented
- Calls: basic signalling, need CallKit/ConnectionService for background
- Push: FCM wiring done, APNs via FCM needs certs
- No contact sync without consent (as required)
- Performance profiling needed on mid-range Android (profile/release)

See docs/ for SECURITY.md, PRIVACY.md, RELEASE_CHECKLIST.md, API.md
