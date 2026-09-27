# Security & Privacy - Guftagu

## Transport & Storage
- HTTPS/WSS enforced in production via Helmet, HSTS, CORS
- Postgres at-rest encryption, S3 SSE
- JWT access 15m, refresh 30d rotated, argon2 hashed, session revocation
- Rate limiting via Redis token bucket (OTP, messages, reactions)

## Authentication
- Phone OTP via abstraction (Twilio Verify / Firebase / Dev)
- DevOtpProvider ONLY when ALLOW_DEV_AUTH=true AND NODE_ENV!=production, logs code, accepts DEV_OTP_CODE=000000
- OTP expiry 300s, resend cooldown 60s, max attempts 5, hashed with argon2
- Never hardcode universal OTP in prod
- Phone hash stored for privacy, phone not exposed via username discovery
- Endpoints don't reveal if phone has account (generic message)

## Authorization
- Membership check on every conversation read/write
- Role checks: Owner, Admin, Member
- Immediate WS disconnect on removal
- Block enforcement prevents direct creation

## Media
- Private S3 bucket, presigned PUT (1h) and GET (15m)
- Size limits: image 10MB, voice 5MB, file 50MB
- MIME validation, virus scan hook placeholder
- No public URLs

## E2EE Decision
**NOT implemented in v1**
Reason: Group E2EE with multi-device, plans, trivia, search, moderation requires vetted protocol (MLS/Signal) and security audit. Implementing fake E2EE would be misleading.

Current protection:
- TLS 1.2+ transport
- Authenticated endpoints
- At-rest encryption
- Redacted logs

User-facing: Settings and About explicitly state limitation. No lock badges. No claim "only you and recipient can read".

Future: Adopt MLS via libsignal, with identity keys, device verification, group membership changes, attachment encryption, multi-device, recovery, metadata exposure doc, search/notification/backup/moderation design consistent with E2EE, security review before claims.

## User Safety
- Block/unblock (unique constraint)
- Report user/group/message with reason/details, status PENDING -> REVIEWED
- Spam controls, invite link expiry/revocation, max uses
- No auto contact upload without consent, explicit permission request
- Account deletion: explains what removed (PII, sessions, push tokens, memberships) vs what remains (messages with recipients), retention justified for legal, implemented not just UI

## Logging & Secrets
- Redacted logs (no tokens, OTPs, phone)
- Secrets via env, not committed
- Least-privilege infra

## Backup & Retention
- Postgres PITR backups, retention 30d
- S3 versioning, lifecycle
- Message retention: indefinite until user deletes for me/everyone or account deletion

## Vulnerabilities
- Dependency scanning via npm audit, flutter pub audit
- Rate limiting prevents brute force
- Input validation via class-validator, ValidationPipe

## Audit
- Requires security review before prod assurance claims
