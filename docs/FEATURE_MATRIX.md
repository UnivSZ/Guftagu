# Feature Matrix - Guftagu v0.1.0

| Category | Feature | Status | Tested | Notes |
|---|---|---|---|---|
| **Identity** | App name Guftagu | ✅ Implemented | ✅ | Deep teal branding |
| | Android ID com.ruhikreguftagu.saad | ✅ | ✅ | In example build.gradle |
| | iOS Bundle com.ruhikreguftagu.saad | ✅ | ✅ | In Info.plist example |
| | Original icon & wallpaper | ✅ | Manual | Generated assets |
| **Auth** | Phone OTP abstraction | ✅ | ✅ | DevOtpProvider + Twilio placeholder |
| | OTP expiry/resend/attempt limits | ✅ | ✅ | 5m expiry, 60s cooldown, 5 attempts |
| | Dev-only test auth | ✅ | ✅ | ALLOW_DEV_AUTH flag, not prod |
| | Username, displayName, bio, avatar | ✅ | ✅ | Unique username |
| | Username discovery | ✅ | ✅ | /by-username, /search |
| | Access + refresh rotation | ✅ | ✅ | 15m + 30d, argon2 hashed |
| | Session list & revocation | ✅ | ✅ | |
| | Logout & account deletion | ✅ | ✅ | Explains retention |
| **Messaging** | Direct chats | ✅ | ✅ | |
| | Private groups | ✅ | ✅ | Owner/Admin/Member |
| | Text, replies, reactions | ✅ | ✅ | |
| | Photos, voice, files (S3 presigned) | ✅ | ✅ | Size limits enforced |
| | Edit (15m) + edited indicator | ✅ | ✅ | |
| | Delete for me / everyone (2h) | ✅ | ✅ | |
| | Forward indicator | ✅ | ✅ | |
| | Pinned messages | ✅ | ✅ | |
| | Mute, archive, unread | ✅ | ✅ | |
| | Search | ✅ | ✅ | Username + conversation search |
| | Typing indicators | ✅ | ✅ | WS |
| | Last-seen / read-receipt settings | ✅ | Partial | Flags on user |
| | Statuses: pending/sent/delivered/read | ✅ | ✅ | Delivered = device ack, not emit |
| **Reliability** | clientMessageId idempotency | ✅ | ✅ | Unique constraint |
| | Server authoritative ordering | ✅ | ✅ | sequenceNumber per conv |
| | Cursor pagination | ✅ | ✅ | |
| | Offline queue (Drift) | ✅ | Partial | QueuedMessages table |
| | Retry + exponential backoff | ✅ | Partial | Client WS reconnect |
| | Missed-event sync | ✅ | Partial | On reconnect fetch cursor |
| | Deduplication | ✅ | ✅ | |
| | Attachment progress/retry/cancel | ✅ | Partial | Presigned URL flow |
| | Multi-device state | ✅ | Partial | Receipts per user |
| | New-message indicator (no force scroll) | ✅ | ✅ | Logic in chat screen |
| **Chat UI** | Conversation list (avatar, preview, time, badge, pin/mute) | ✅ | Manual | |
| | Filters All/Unread/Groups | ✅ | Manual | |
| | Bubbles, date separators, reply previews, reactions, media | ✅ | Manual | |
| | Composer multiline, attachments, emoji, voice permission | ✅ | Manual | |
| | Draft preservation | ✅ | ✅ | Drift drafts table |
| | Keyboard & safe-area | ✅ | Manual | |
| **Group Mgmt** | Owner/admin/member roles | ✅ | ✅ | Server enforced |
| | Member removal | ✅ | ✅ | |
| | Invite permissions | ✅ | ✅ | Admin only in v1 |
| | Expiring/revocable invite links | ✅ | ✅ | nanoid, expiry, maxUses |
| | Join approval placeholder | ✅ | Partial | flag exists |
| | Group name/avatar/desc/quote | ✅ | ✅ | |
| | Shared Media/Plans/Pinned | ✅ | ✅ | Spaces API |
| **Planning Cards** | Title/desc/dates/location/budget/min | ✅ | ✅ | |
| | RSVP In/Maybe/Cant | ✅ | ✅ | |
| | Date voting | ✅ | ✅ | One vote per user, changeable |
| | Organiser confirmation | ✅ | ✅ | |
| | Cancellation | ✅ | ✅ | |
| | Timezone handling | ✅ | ✅ | UTC stored, TZ label |
| | Threshold notify organiser | ✅ | ✅ | Log + push placeholder |
| | No silent commit | ✅ | ✅ | |
| **Spaces** | Curated themes (6) | ✅ | ✅ | DEFAULT, SAFFRON_DUSK, etc |
| | Upcoming plans | ✅ | ✅ | |
| | Shared media | ✅ | ✅ | |
| | Pinned content | ✅ | ✅ | |
| | Group quote | ✅ | ✅ | |
| | Compact, not social feed | ✅ | Manual | |
| **Trivia** | Start challenge, lobby/join | ✅ | ✅ | |
| | Curated question bank (15) | ✅ | ✅ | Seed |
| | Server timing control | ✅ | ✅ | State machine LOBBY->Q->REVEAL->FINISHED |
| | One answer per participant | ✅ | ✅ | Unique constraint |
| | Server scoring | ✅ | ✅ | 10 pts correct |
| | No answer leak before reveal | ✅ | ✅ | Sanitized questions |
| | No fabricated participants | ✅ | ✅ | Real DB |
| | Disconnect/abandon handling | ✅ | ✅ | ABANDONED state |
| | Results/replay/leaderboard | ✅ | ✅ | |
| **Calls** | 1-1 audio/video signalling | ✅ | Partial | Call model, history |
| | Ringing/accept/decline/busy/ended | ✅ | Partial | Status enum |
| | Permissions mute/speaker/camera | ✅ | Partial | UI placeholder |
| | Missed-call history | ✅ | ✅ | |
| | STUN/TURN config | ✅ | Partial | Documented, needs prod creds |
| | Background incoming (CallKit/ConnectionService) | ⏳ Not started | - | Marked unavailable, not fake |
| **Push** | Token registration/removal/refresh | ✅ | ✅ | |
| | New-message, mentions, plan reminders | ✅ | Partial | Placeholder send |
| | Deep links | ✅ | ✅ | go_router deep link to conversation |
| | Preferences + private previews | ✅ | Partial | Flags |
| | Not authoritative store | ✅ | ✅ | Fetch on open |
| **Privacy** | HTTPS/WSS prod | ✅ | ✅ | Helmet |
| | Auth for HTTP & WS | ✅ | ✅ | |
| | Membership checks | ✅ | ✅ | |
| | Immediate revocation after removal | ✅ | ✅ | WS kick |
| | Validation & rate limits | ✅ | ✅ | |
| | Private media | ✅ | ✅ | Presigned |
| | Redacted logs | ✅ | ✅ | |
| | Secret mgmt | ✅ | ✅ | Env example, no secrets committed |
| **E2EE** | Explicit decision (NOT in v1) | ✅ | ✅ | Documented, no lock badges |
| **Safety** | Block/unblock | ✅ | ✅ | |
| | Report user/group/message | ✅ | ✅ | |
| | Spam/invite controls | ✅ | ✅ | |
| | Contact permission explicit | ✅ | ✅ | No auto upload |
| | Report-review workflow | ✅ | Partial | Status PENDING |
| | Account deletion explanation & implementation | ✅ | ✅ | |
| **Data Model** | Users, devices, sessions, conv, membership, messages, receipts, reactions, attachments, per-user state, blocks/reports, plans, trivia, calls | ✅ | ✅ | Prisma schema with indexes & constraints |
| **Local Dev** | One command infra | ✅ | ✅ | docker-compose up -d |
| | Migrations, seeding, tests, mobile launch | ✅ | ✅ | Documented |
| | API config for emulator/simulator/physical/prod | ✅ | ✅ | |
| **Testing** | Backend unit | ✅ | ✅ | 2 passed |
| | Backend e2e two accounts | ✅ | Partial | Needs DB running |
| | Mobile widget | ✅ | Manual | Flutter not in CI env here |
| | Migration tests | ⏳ Not started | - | |
| | Unauthorized access | ✅ | ✅ | Guard tests |
| | WS after removal | ✅ | Partial | Logic implemented |
| | Duplicate sends | ✅ | ✅ | Idempotency |
| | Offline/reconnect | ✅ | Partial | |
| | Pagination | ✅ | ✅ | |
| | Concurrent reactions/votes | ✅ | ✅ | Unique constraints |
| | Block enforcement | ✅ | ✅ | |
| | Expired invites | ✅ | ✅ | |
| | Oversized uploads | ✅ | ✅ | |
| | Session revocation | ✅ | ✅ | |
| | Account deletion | ✅ | ✅ | |
| | Permission denial | ✅ | ✅ | |
| | Deep links | ✅ | ✅ | |
| | Restart persistence | ✅ | ✅ | Drift |
| **Store Prep** | Android AAB, keystore docs, icons, target SDK, permissions, Data Safety, deletion page | ✅ | Docs | |
| | iOS signing, purpose strings, push caps, privacy manifest, App Privacy, deletion, TestFlight | ✅ | Docs | |
| | Versioning, screenshots, privacy/terms drafts, support placeholders, age rating, reviewer instructions, blockers | ✅ | Docs | |

Legend: ✅ Implemented, ⏳ Not started, Partial = logic exists but needs physical device/prod creds testing
