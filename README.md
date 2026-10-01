# RANK.io

RANK.io is a social personal-ranking app built with Expo React Native, a Fastify TypeScript API, and MongoDB. Users can rank movies, books, restaurants, travel, games, and other things they love.

## Project Structure

```text
frontend/                 Expo React Native app
  src/app/                Expo Router screens
  src/features/auth/      Auth configuration and brand components
  src/services/           API and session clients
  src/hooks/              App hooks, including auth state
  src/components/         Shared UI components
backend/                  Fastify API
  src/config/             Environment configuration
  src/db/                 MongoDB connection and indexes
  src/modules/auth/       Registration, login, Google auth, sessions
  src/modules/users/      User repository and profile routes
  src/modules/rankings/   Ranking API and validation
  src/seed/               Development database seed
```

## Requirements

- Node.js 22.13 or newer
- npm
- MongoDB Atlas or a local MongoDB server
- Expo Go for a physical device, or an Android emulator
- A Google OAuth Web client ID if Google Sign-In is required

Expo SDK 57 targets React Native 0.86 and React 19.2.

## Install

From the repository root:

```powershell
npm install --prefix frontend
npm install --prefix backend
```

The repository does not need a root `npm install`; the frontend and backend are separate workspaces.

## Backend Configuration

Copy the backend environment template:

```powershell
Copy-Item backend\.env.example backend\.env
```

Edit `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=rank_everything
CORS_ORIGIN=*
CURRENT_USER_HANDLE=sam
```

For MongoDB Atlas:

1. Create a database user.
2. Add your development machine IP under Network Access.
3. Put the connection string in `MONGODB_URI`.
4. Keep `backend/.env` private. It is ignored by Git.

Optional AI settings:

```env
AI_API_URL=
AI_API_KEY=
AI_MODEL=
```

## Frontend Configuration

Copy the frontend environment template:

```powershell
Copy-Item frontend\.env.example frontend\.env
```

Choose the API URL for the device you are using.

### Web

```env
EXPO_PUBLIC_API_URL=http://localhost:4000
```

### Android Emulator

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000
```

### Physical Android Device

Find the computer's LAN IP, then use it. For example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.41:4000
```

The phone and computer must be on the same Wi-Fi network, and Windows Firewall must allow port `4000`.

### Google Sign-In

Add the Google OAuth Web client ID to `frontend/.env`:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_web_client_id
```

The app uses the existing Expo AuthSession flow and the redirect scheme configured in `frontend/app.json`:

```text
rankeverything://auth/callback
```

Do not put a Google client secret in the frontend.

## Run Locally

Open two terminals.

### Terminal 1: Backend

```powershell
cd backend
npm run dev
```

The API runs at:

```text
http://localhost:4000
```

If you see `EADDRINUSE`, another API process is already using port `4000`. Do not start a second backend process.

### Terminal 2: Expo Frontend

```powershell
cd frontend
npm run dev
```

You can also use:

```powershell
npm start
```

Expo commands:

- Press `a` for an Android emulator.
- Press `w` for web.
- Scan the QR code with Expo Go for a physical device.

If the app uses stale environment values, restart with:

```powershell
npx expo start --clear
```

## Development Seed Account

The seed script replaces seeded development data, including users, rankings, activity, and auth sessions. Use it only against a development database:

```powershell
cd backend
npm run seed
```

Development account:

```text
Email: test@rank.io
Username: samtest
Password: Rank.ioDemo@123
```

Never use these credentials in production.

## Authentication Flow

### Registration

```text
Register form
  -> POST /api/auth/register
  -> Backend validation
  -> Duplicate email/username checks
  -> bcrypt password hash
  -> MongoDB user document
  -> Auth session token
  -> Authenticated app
```

### Login

Login accepts either an email or username:

```text
Login form
  -> POST /api/auth/login
  -> Password hash verification
  -> MongoDB auth session
  -> Frontend bearer token state
  -> Authenticated app
```

### Google Login

```text
Google OAuth
  -> Expo AuthSession authorization code
  -> Google token exchange
  -> Backend verifies Google access token
  -> Existing user login or new user creation
  -> RANK.io auth session
```

### Session and Logout

Sessions are stored in MongoDB as SHA-256 token hashes with expiration. The raw token is stored locally only as the session credential; passwords are never stored locally.

- Remember Me enabled: session is persisted locally.
- Remember Me disabled: session is memory-only and disappears when the app closes.
- App startup: stored sessions are checked with `/api/auth/me`.
- Invalid or expired sessions are cleared.
- Logout revokes the backend session and clears local state.

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Rankings

- `GET /api/rankings`
- `GET /api/rankings/:id`
- `POST /api/rankings`
- `PATCH /api/rankings/:id`
- `DELETE /api/rankings/:id`
- `GET /api/categories`
- `GET /api/tags`

### Community and Users

- `GET /api/community/feed`
- `GET /api/community/leaderboard`
- `POST /api/community/feed/:id/like`
- `POST /api/community/feed/:id/comments`
- `POST /api/community/feed/:id/share`
- `GET /api/users/:handle`
- `GET /api/users/:handle/stats`
- `GET /api/users/:handle/rankings`
- `POST /api/users/:handle/follow`

Protected endpoints require:

```http
Authorization: Bearer <session-token>
```

## Validation and Testing

Frontend checks:

```powershell
cd frontend
npx tsc --noEmit
npm run lint
```

Backend checks:

```powershell
cd backend
npx tsc -p tsconfig.json --noEmit
```

Android bundle check:

```powershell
cd frontend
npx expo export --platform android --output-dir .expo-export-check
```

Check the API health endpoint:

```powershell
Invoke-WebRequest http://localhost:4000/health
```

Expected response:

```json
{"status":"ok"}
```

Authentication checks to perform during development:

- Register a new user.
- Log in with email.
- Log in with username.
- Try an incorrect password.
- Try duplicate email and username registration.
- Restore a persisted session.
- Test Remember Me enabled and disabled.
- Log out and confirm `/api/auth/me` returns `401`.
- Test Google login with a configured OAuth client ID.
- Test the app with the backend stopped to confirm the friendly connection error.

## Security Rules

Never commit:

- `frontend/.env`
- `backend/.env`
- MongoDB credentials
- Google OAuth client secrets
- API keys
- Passwords or session tokens

Passwords are hashed by the backend with bcrypt. Authentication responses contain safe user information and a session token, never a password or password hash.

## Git Commands

Check changes:

```powershell
git status
git diff
```

Commit and push intentional changes:

```powershell
git add -A
git diff --cached --stat
git commit -m "Describe the change"
git pull --rebase origin main
git push origin main
```

Review staged deletions carefully before running `git commit`.
