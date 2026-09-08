# Rank Everything

An Expo React Native client with a Fastify TypeScript API and MongoDB Atlas persistence.

## Project structure

```text
src/                 Expo frontend
  app/               Screens and routing
  components/        UI components
  services/api.ts    HTTP client for the backend
  types/             Shared frontend types
  utils/             Ranking and filtering logic
backend/             API server
  src/config/        Environment configuration
  src/db/            MongoDB connection
  src/modules/       Ranking CRUD and AI routes
  .env               Local server secrets, never commit
```

## Setup

Install both workspaces:

```bash
npm install
npm install --prefix backend
```

Create the server environment file:

```bash
copy backend\.env.example backend\.env
```

Set `MONGODB_URI` to the MongoDB Atlas connection string. In Atlas, create a database user and allow your development machine IP under Network Access.

Create the Expo environment file by copying `.env.example` to `.env` and set the API URL:

- Web: `http://localhost:4000`
- Android emulator: `http://10.0.2.2:4000`
- Physical Android device: `http://YOUR_COMPUTER_LAN_IP:4000`

## Run locally

Use two terminals:

```bash
npm run start:api
```

```bash
npm start
```

The app uses cloud-only CRUD through the backend. MongoDB credentials and AI keys stay on the backend and are never bundled into Expo.

## API

See [backend/README.md](backend/README.md). CRUD routes are available at `/api/rankings`; ranking numbers are still calculated in the client from rating, and are never stored.

The optional `/api/ai/suggestions` route accepts an item name and notes and calls an OpenAI-compatible provider configured only on the server.
