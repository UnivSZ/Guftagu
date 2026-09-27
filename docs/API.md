# Guftagu API

Base: `/api/v1`
Docs: `/api/v1/docs` (Swagger)

## Auth
POST /auth/request-otp {phone}
POST /auth/verify-otp {phone, code, deviceName, platform} -> {user, accessToken, refreshToken, isNewUser}
POST /auth/refresh {refreshToken} -> {accessToken, refreshToken, user}
GET /auth/sessions (Bearer)
DELETE /auth/sessions/:id

## Users
GET /users/me
PATCH /users/me {username?, displayName?, bio?, avatarUrl?}
GET /users/by-username/:username
GET /users/search?q=
DELETE /users/me

## Conversations
GET /conversations
GET /conversations/:id
POST /conversations/direct {otherUserId}
POST /conversations/group {name, description?, memberIds, avatarUrl?}
PATCH /conversations/:id {name?, description?, avatarUrl?, quote?, theme?, accentColor?}
POST /conversations/:id/members {memberIds}
DELETE /conversations/:id/members/:userId
POST /conversations/:id/invite-links {expiresInHours?, maxUses?}
POST /conversations/join/:code
PATCH /conversations/:id/membership {isArchived?, isPinned?, mutedUntil?}

## Messages
GET /conversations/:id/messages?cursor=&limit= -> {messages, nextCursor, hasMore}
POST /conversations/:id/messages {clientMessageId, body?, type?, replyToId?, isForwarded?}
PATCH /messages/:id {body}
DELETE /messages/:id/for-me
DELETE /messages/:id/for-everyone
POST /messages/:id/reactions {emoji}
DELETE /messages/:id/reactions/:emoji
POST /conversations/:id/read {lastReadSequence}
POST /messages/:id/delivered {deviceId?}
POST /conversations/:id/pin/:messageId
DELETE /conversations/:id/pin/:messageId

## Plans
POST /conversations/:id/plans {title, description?, locationText?, locationLink?, budget?, currency?, minParticipants?, options: [{startAt, endAt?, timeZone?}]}
GET /conversations/:id/plans
POST /plans/:id/rsvp {status: IN|MAYBE|CANT}
POST /plans/:id/vote {optionId}
POST /plans/:id/confirm {optionId?}
DELETE /plans/:id (cancel)

## Spaces
GET /spaces/themes
GET /spaces/:conversationId -> {conversation, upcomingPlans, sharedMedia, themes}

## Trivia
POST /conversations/:id/trivia/start {questionCount?}
POST /trivia/:sessionId/join
GET /trivia/:sessionId -> {session, questions (sanitized)}
POST /trivia/:sessionId/answer {questionId, selectedIndex}
POST /trivia/:sessionId/advance
POST /trivia/:sessionId/abandon
GET /trivia/:sessionId/leaderboard

## Media
POST /media/upload-url {fileName, mimeType, size} -> {uploadUrl, key}
GET /media/download-url?key= -> {url}

## Push
POST /push/tokens {token, platform}
DELETE /push/tokens {token}

## Calls
POST /calls {calleeId, type: AUDIO|VIDEO, conversationId?}
PATCH /calls/:id {status}
GET /calls/history

## Blocks & Reports
POST /blocks {blockedId}
DELETE /blocks/:blockedId
GET /blocks
POST /reports {targetUserId?, targetGroupId?, targetMessageId?, reason, details?}

## WebSocket
Namespace /ws, auth {token}
Client emits:
- message:send {conversationId, clientMessageId, body, type, replyToId} -> ack {message}
- typing:start {conversationId}
- typing:stop {conversationId}
- message:delivered {messageId}
- message:read {conversationId, lastReadSequence}

Server emits:
- connected {userId}
- message:new {message}
- message:delivered {messageId, userId}
- message:read {conversationId, userId, lastReadSequence}
- typing {conversationId, userId, isTyping}
- presence:update {userId, status, lastSeenAt?}

## Statuses
- PENDING: client only, not yet server
- SENT: persisted by server
- DELIVERED: recipient device ack (via WS receipt, not just emit success)
- READ: explicit ack respecting privacy settings

Group receipts: delivered when any device ack, read per user aggregated.

## Idempotency
Client-generated clientMessageId UUID, server unique constraint (senderId, clientMessageId), safe retry.
