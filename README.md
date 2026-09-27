# Guftagu — Messenger

**Dev:** Saad Hussain  
**Co-Dev:** Ashad Ahamad  
**App ID:** com.ruhikreguftagu.saad (Android & iOS)  
**Name:** Guftagu (Urdu: conversation)

Familiar, dependable messenger (95% WhatsApp/Telegram UX) + Planning Cards, Spaces, Trivia.

See `docs/README.md` for full setup, architecture, API, release checklist.

## One-command infra
```bash
cd infra && docker-compose up -d
cd ../services/api && cp .env.example .env && npm i && npx prisma migrate dev && npm run prisma:seed && npm run start:dev
cd ../../apps/mobile && flutter pub get && flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

## About Screen
In-app Settings -> About shows Dev - Saad Hussain, CO-Dev - Ashad Ahamad as required.

## Tech
- Flutter stable, Riverpod, go_router, Drift, secure storage
- NestJS, Prisma, Postgres, Redis, Socket.IO, S3, FCM
- Docker Compose, OpenAPI

## Status
- Vertical slice runnable: auth -> conversations -> messages -> WS realtime -> persist
- Plans, Spaces, Trivia implemented backend + UI
- Calls basic signalling
- Tests, CI, docs included

See docs/ for SECURITY (E2EE not in v1), PRIVACY, API, SETUP, RELEASE_CHECKLIST.

