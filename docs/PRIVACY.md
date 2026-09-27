# Privacy Policy Draft - Guftagu

**Owner fields to replace before release: [Company Name], [Contact Email], [Address], [DPO]**

Effective: 2026-09-27

Guftagu (com.ruhikreguftagu.saad) is a messenger. Dev: Saad Hussain, Co-Dev: Ashad Ahamad.

## Data Collected
- Phone (hashed for lookup), username, displayName, bio, avatar
- Messages, reactions, receipts, attachments (stored until deleted)
- Device info, push tokens, IP (for security)
- Plans, votes, RSVPs, trivia answers
- Reports

## Purpose
- Provide messaging, group planning, spaces, trivia, calls
- Security, abuse prevention, notifications

## Legal Basis
- Contract, legitimate interest, consent (contacts, push)

## Sharing
- No selling. Processors: hosting (Postgres, S3), OTP provider (Twilio/Firebase), push (FCM/APNs). DPA required.

## Retention
- Account: until deletion
- Messages: until deleted for me/everyone or account deletion (remain with recipients per policy)
- Logs: 90d

## Rights
- Access, correction, deletion, export. Contact [Contact Email]. Deletion in-app: Settings -> Delete Account.

## Security
- TLS transport, at-rest encryption. E2EE NOT implemented in v1. See SECURITY.md.

## Children
- Not for <13. UGC moderation.

## Contact
[Company Name], [Address], [Contact Email]

## Deletion Request
Hosted page at https://[domain]/delete-account must be provided for Play Store. In-app deletion also.

## Data Safety (Android)
- Location: No
- Personal info: Phone, username, displayName, avatar, bio
- Messages: stored, not shared
- Photos, voice, files: user-provided, private S3
- No contact auto-upload without consent

## App Privacy (iOS)
- Contact Info: Phone (hashed), Name, Avatar
- User Content: Messages, Photos, Voice, Files
- Identifiers: User ID, Device ID, Push Token
- Usage Data: None for tracking

Replace placeholders before store submission.
