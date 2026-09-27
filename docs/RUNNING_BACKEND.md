# Running Guftagu Backend for Physical Device

## The Error You See
```
DioException [connection timeout]: The request connection took longer than 0:00:10
```
This happens because:
- **Release APK** uses `https://api.guftagu.example.com` - this is a placeholder, no real server exists yet
- **Debug APK** uses `http://10.0.2.2:3000` - this ONLY works on Android Emulator (10.0.2.2 = emulator's host loopback)
- On **physical device**, neither works - you need your PC's local IP!

## Solution: Run Backend Locally + Build APK with Your IP

### Step 1: Run Backend on Your PC

```bash
# Clone repo (if not already)
git clone https://github.com/UnivSZ/Guftagu.git
cd Guftagu

# Start Postgres + Redis
cd infra
docker-compose up -d
# Wait 10 sec for DB to start

# Start API
cd ../services/api
npm install
cp .env.example .env
# Edit .env if needed, default works for dev

npx prisma generate
npx prisma migrate deploy
npm run seed   # optional seed data

# Set dev auth
# In .env, ensure:
# ALLOW_DEV_AUTH=true
# JWT_ACCESS_SECRET=test-access-secret-32-chars-long
# JWT_REFRESH_SECRET=test-refresh-secret-32-chars-long

npm run start:dev
# Backend should be at http://localhost:3000
# Test: curl http://localhost:3000/api/v1/health
```

### Step 2: Find Your PC's Local IP

**Windows:**
```cmd
ipconfig
# Look for IPv4 Address: 192.168.1.5
```

**Mac/Linux:**
```bash
ifconfig | grep 192
# or
ip addr show | grep 192
```

Example: `192.168.1.5`

**Important:** Phone and PC must be on same WiFi!

### Step 3: Build APK with Your IP

#### Option A: Local Build
```bash
cd apps/mobile
flutter pub get
flutter build apk --debug --dart-define=API_BASE_URL=http://192.168.1.5:3000/api/v1
# APK at build/app/outputs/flutter-apk/app-debug.apk
# Install: adb install build/app/outputs/flutter-apk/app-debug.apk
```

#### Option B: GitHub Actions (Easier)
1. Go to https://github.com/UnivSZ/Guftagu/actions/workflows/build-apk.yml
2. Click "Run workflow" (top right)
3. Enter your IP: `http://192.168.1.5:3000/api/v1`
4. Click "Run workflow"
5. Wait 10 min, download artifact from that run
6. Install on phone

### Step 4: Login on Phone

1. Open Guftagu app
2. Enter phone: `+910000000001` (any number starting with +91)
3. Tap "Send OTP"
4. **Enter OTP: `000000`** (six zeros)
   - This works because ALLOW_DEV_AUTH=true in dev
   - No real SMS needed
5. You should be logged in!

### Step 5: Test with 2 Accounts

- Install APK on 2 phones (or 1 phone + 1 emulator)
- Login with:
  - User1: +910000000001 / OTP 000000
  - User2: +910000000002 / OTP 000000
- Search username or create conversation via API
- Chat!

## Alternative: Deploy Backend to Cloud

If you want APK to work anywhere (not just same WiFi):

1. Deploy `services/api` to:
   - Render.com (free)
   - Railway.app
   - Fly.io
   - Your VPS

2. Set env vars on cloud:
   ```
   DATABASE_URL=your_postgres_url
   REDIS_URL=your_redis_url
   JWT_ACCESS_SECRET=...
   JWT_REFRESH_SECRET=...
   ALLOW_DEV_AUTH=true
   S3_... (optional)
   ```

3. Build APK with cloud URL:
   ```bash
   flutter build apk --release --dart-define=API_BASE_URL=https://your-api.onrender.com/api/v1
   ```

## Current APKs Explained

| APK | API URL | Works On | Needs Backend? |
|-----|---------|----------|----------------|
| guftagu-debug-apk (10.0.2.2) | http://10.0.2.2:3000 | Emulator only | Yes, localhost:3000 |
| guftagu-release-apk (example.com) | https://api.guftagu.example.com | Nowhere (placeholder) | Needs real deployment |

## Quick Fix for You Right Now

If you just want to see app without backend:

The app UI itself is working! Your screenshot proves:
- ✅ App icon shows
- ✅ Welcome screen loads
- ✅ Dev names visible: "Dev: Saad Hussain • Co-Dev: Ashad Ahamad"
- ✅ Phone input works

The only issue is backend connection. The app has offline queue, so it will store messages locally and sync when backend is available.

## Firewall Note

If still timeout after using your IP:
- Windows Firewall: Allow port 3000
- `netsh advfirewall firewall add rule name="Guftagu API" dir=in action=allow protocol=TCP localport=3000`
- Or temporarily disable firewall for testing
