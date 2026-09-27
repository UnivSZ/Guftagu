# Guftagu — Architecture & Implementation Plan

## Identity
- App name: Guftagu (Urdu for conversation)
- Android: com.ruhikreguftagu.saad
- iOS: com.ruhikreguftagu.saad
- Design: Deep teal #0F4C4A primary, warm off-white #FDFCF8 light, charcoal #1C1E21 dark

## Vision
WhatsApp/Telegram familiar (95% nav) + differentiation:
1. Planning Cards (group decisions with voting, RSVP, threshold)
2. Group Spaces (themes, quote, shared media, upcoming plans)
3. Trivia (server-authoritative, no answer leak)

## Tech Stack (pinned)
- Mobile: Flutter 3.22+ stable, Dart 3.4+, Riverpod 2.5, go_router 14, Drift 2.18, flutter_secure_storage 9, dio 5
- Backend: NestJS 10.3, TypeScript 5.4, Prisma 5.14, PostgreSQL 16, Redis 7, Socket.IO 4.7 (WebSocket), S3-compatible (MinIO for local)
- Infra: Docker Compose, OpenAPI via @nestjs/swagger

## Architecture Decisions

### Backend
- **Monolithic NestJS** initially for velocity; modules isolated for future split.
- **Prisma + Postgres**: strong typing, migrations, constraints. All critical tables have indexes.
- **JWT**: short-lived access (15m) + rotating refresh (30d) stored hashed. Refresh rotation prevents replay.
- **OTP abstraction**: `OtpProvider` interface. Production: Twilio Verify / Firebase (configurable). Dev: `DevOtpProvider` that logs OTP and accepts `000000` only when `ALLOW_DEV_AUTH=true` and `NODE_ENV!=production`. Never universal OTP in prod.
- **WebSocket**: Socket.IO with auth middleware verifying JWT. User joins `user:{userId}` and `conversation:{id}` rooms after membership check. Redis adapter for horizontal scaling (ioredis). Outbox pattern: message is persisted in transaction, then event published to Redis, then emitted. DB is source of truth.
- **Message reliability**: client-generated `clientMessageId` UUID (idempotency key). Server authoritative `sequenceNumber` per conversation (serial). Cursor pagination via `(sequenceNumber, id)`. Deduplication on `clientMessageId` + `senderId`. Offline queue on client (Drift). Exponential backoff reconnect.
- **Statuses**: pending (client only) -> sent (server persisted) -> delivered (recipient device ack via WS) -> read (explicit ack respecting privacy). Group: delivered when at least one device ack, read receipts per user, aggregated counts.
- **Media**: private S3 bucket, presigned PUT for upload, presigned GET with 15m expiry. Size limits: image 10MB, voice 5MB, file 50MB. Virus scan hook placeholder.
- **Rate limiting**: Redis token bucket for OTP, message send, etc.
- **Security**: Helmet, CORS, ValidationPipe, membership checks in every conversation operation, immediate WS kick on removal.

### Mobile
- **Riverpod**: `StateNotifier` + `AsyncNotifier` for auth, chats, messages.
- **Drift**: tables for conversations, messages, queued sends, drafts. Sync with server via cursor.
- **Secure storage**: tokens in Keychain/Keystore, not Drift.
- **Navigation**: go_router with ShellRoute for tabs: Chats | Spaces | Calls | Settings. Tablet: adaptive two-pane via `LayoutBuilder` >600dp.
- **Performance**: ListView.builder, SliverList, message pagination (50 per page), thumbnail via cached_network_image, no UI thread heavy work (Isolate for image compress).
- **Design tokens**: `AppColors`, `AppTypography`, `AppRadii` centralized.

### E2EE Decision
**NOT implemented in v1**. Reason: group E2EE with multi-device, planning cards, trivia, search, moderation requires complex protocol (MLS/Signal) and security audit. Current transport is TLS + at-rest encryption + authenticated endpoints. Docs and Settings explicitly state limitation. No lock badges. Future: adopt MLS via `libsignal` or similar with audit.

### Signature Features
- **Planning Cards**: `Plan` has `proposedOptions` (datetime), `rsvps`, `votes`. Prevent duplicate votes via unique constraint. Timezone stored as UTC, display in local with original TZ label. Threshold notifies organiser via push, not auto-commit.
- **Spaces**: stored as `Conversation` extension: `theme`, `quote`, `accentColor`. Curated themes (5 initial: Saffron Dusk, Monsoon, Bazaar, Himalaya, Paper). Upcoming plans query, shared media query, pinned messages.
- **Trivia**: curated 30 Q bank. Server controls state machine: LOBBY (30s) -> QUESTION (15s) -> REVEAL (5s) -> next. Answers validated server-side, scores calculated, correct answer never sent before reveal.

## Repository Structure
```
apps/mobile - Flutter app
services/api - NestJS
infra - docker-compose, MinIO, etc
docs - architecture, api, release
```

## Implementation Order
1. Phase 1 (Done in this slice): Architecture, DB schema, auth with dev OTP, conversations, messages, WebSocket, Flutter shell + chat list + conversation + WS client
2. Phase 2: Offline queue, receipts, media, push
3. Phase 3: Plans, Spaces, Trivia
4. Phase 4: Calls (WebRTC)
5. Phase 5: Hardening, store prep

## First Vertical Slice Criteria
sign in -> open conversation -> send message -> receive on second client -> persist across restarts

Backend: auth + conversations + messages + WS works
Mobile: auth screen, chat list, chat screen, WS sync, Drift persistence

## About Screen Requirement
App Settings -> About:
Dev - Saad Hussain
CO-Dev - Ashad Ahamad
App version, bundle id, privacy note.

