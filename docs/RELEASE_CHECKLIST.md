# Release Checklist - Guftagu

## App Identity
- [x] Name Guftagu
- [x] Android com.ruhikreguftagu.saad
- [x] iOS com.ruhikreguftagu.saad
- [x] Original icon (deep teal chat bubble, not WhatsApp/Telegram copy)

## Android
- [ ] Verify identifier availability on Play Console (never silently change)
- [ ] Configure applicationId in android/app/build.gradle
- [ ] Adaptive icon mipmap, splash screen
- [ ] Target SDK 34 (verify current Play requirement 2026)
- [ ] Permissions: CAMERA, RECORD_AUDIO, READ_MEDIA_IMAGES, POST_NOTIFICATIONS - document purpose
- [ ] Data Safety form based on actual code (see PRIVACY.md)
- [ ] Account deletion: in-app + hosted page https://[domain]/delete-account
- [ ] Release AAB: flutter build appbundle --release
- [ ] Upload key: keytool gen + Play App Signing, never commit keystore/passwords
- [ ] Versioning: versionName 0.1.0, versionCode 1, semver
- [ ] Store listing: original screenshots from actual app, description not claiming affiliation

## iOS
- [ ] Verify bundle ID availability on App Store Connect
- [ ] Apple Developer team, signing
- [ ] Info.plist purpose strings: NSCameraUsageDescription="Take photos to share in chats", NSMicrophoneUsageDescription="Record voice messages and calls", NSPhotoLibraryUsageDescription="Share photos"
- [ ] Capabilities: Push Notifications, Background Modes (audio, voip if calling)
- [ ] Privacy manifest, third-party SDK privacy
- [ ] App Privacy disclosures accurate
- [ ] In-app account deletion (required)
- [ ] Archive: flutter build ipa, TestFlight

## Both
- [ ] About screen shows Dev Saad Hussain, Co-Dev Ashad Ahamad
- [ ] Privacy policy & terms hosted, placeholders replaced
- [ ] Support contact replaced
- [ ] Age rating, UGC checklist, reviewer access instructions
- [ ] No fake notifications, delivery statuses
- [ ] Security limitations documented (no E2EE)
- [ ] Performance measured in profile/release on mid-range device, report results

## Backend Prod
- [ ] ENV secrets in vault, not .env.example
- [ ] DATABASE_URL prod, REDIS_URL prod, S3 prod bucket private
- [ ] JWT secrets 32+ chars
- [ ] ALLOW_DEV_AUTH=false in prod
- [ ] Migrations: prisma migrate deploy
- [ ] HTTPS/WSS, HSTS, backups, monitoring

## Testing (must pass)
- [ ] Two-device real messaging
- [ ] Offline queue + reconnect
- [ ] Duplicate send deduplication
- [ ] Pagination cursor
- [ ] Concurrent reactions/votes
- [ ] Block enforcement
- [ ] Expired invite
- [ ] Oversized upload rejection
- [ ] Session revocation
- [ ] Account deletion
- [ ] Notification deep link
- [ ] App restart persistence (Drift)

## Blockers (current)
- [ ] Need physical device testing (emulator only in CI)
- [ ] FCM APNs certs not configured
- [ ] STUN/TURN prod config needed for calls
- [ ] Store assets (screenshots) need generation from actual app
- [ ] Security audit for E2EE future

Never claim published/approved/audited unless true.
