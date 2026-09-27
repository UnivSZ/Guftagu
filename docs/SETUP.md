# Setup Guide

## Backend (one command for deps)
```bash
cd infra
docker-compose up -d
# Wait for healthy
docker-compose ps

cd ../services/api
cp .env.example .env
# Edit secrets
npm install
npx prisma migrate dev
npx prisma generate
npm run prisma:seed
npm run start:dev
```

Verify: curl http://localhost:3000/api/v1/docs

## Mobile - Android Emulator
- Install Android Studio, create AVD (Pixel 7, API 34)
- Flutter: flutter doctor
- Env: API_BASE_URL=http://10.0.2.2:3000/api/v1 (emulator maps host)
- Run: flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1

## Mobile - iOS Simulator (macOS only)
- Xcode, simctl
- API_BASE_URL=http://localhost:3000/api/v1
- flutter run --dart-define=API_BASE_URL=http://localhost:3000/api/v1 -d "iPhone 15"

## Physical Devices
- Find LAN IP: ifconfig / ipconfig
- Backend must bind 0.0.0.0 (already)
- Firewall allow 3000
- API_BASE_URL=http://192.168.1.X:3000/api/v1
- Android: adb reverse tcp:3000 tcp:3000 alternative
- iOS: device and mac same network

## Production URLs
- Set API_BASE_URL to https://api.guftagu.example.com/api/v1 via --dart-define or flavor
- Use secure transport (no http exceptions in release)

## Troubleshooting
- Prisma: DATABASE_URL must match docker-compose
- MinIO: create bucket guftagu-media via console http://localhost:9001
- WS: token must be valid, check secure storage
- Flutter build_runner: dart run build_runner build --delete-conflicting-outputs
- Drift: sqlite3_flutter_libs required for Android

## Seed Data
- Users: saad, ashad, test1, test2 (phone +910000000001 etc)
- Trivia: 15 questions
- Login with dev OTP 000000 when ALLOW_DEV_AUTH=true

## Tests
```bash
cd services/api
npm test
# e2e needs running DB
npm run test:e2e

cd apps/mobile
flutter test
```
