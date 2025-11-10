Backend — MERN-APP
===================

Purpose
-------
This document is the professional README for the backend service of MERN-APP (Express + Mongoose). It covers setup, runtime, endpoints, test strategy, how controllers work, and developer guidelines.

Quick facts
-----------
- Stack: Node.js, Express, Mongoose
- DB: MongoDB (production uses configured URI; tests use mongodb-memory-server)
- Test runner: Jest (unit + integration), Supertest for integration

Prerequisites
-------------
- Node.js 18+ (LTS recommended)
- npm 8+

Getting started (development)
-----------------------------
1. Install dependencies

```bash
cd backend
npm install
```

2. Create `.env` (the repo contains an example). Key env vars used:
- `PORT` - server port
- `MONGO_DB_URI` - production MongoDB connection URI
- `JWT_SECRET` - access token secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth client credentials

3. Start the server

```bash
npm run dev
```

API surface (summary)
---------------------
All routes are mounted under `/api`.

- Authentication
  - POST `/api/signup` — Sign up a user (body: firstName, lastName, email, password)
  - POST `/api/login` — Login (body: email, password) — sets cookies: `token`, `refreshToken`
  - POST `/api/logout` — Clears login cookies
  - GET `/api/profile` — Returns profile of logged in user (cookie token required)
  - POST `/api/auth/google` — Google login (query param: `code`)
  - POST `/api/refresh-token` — Refresh access token

- Posts
  - POST `/api/create-post` — Create new post (multipart/form-data with `image`, `title`) (auth required)
  - GET `/api/posts` — Paginated posts (auth required)
  - GET `/api/user-posts` — Get posts by logged-in user (auth required)
  - GET `/api/post/:postId` — Get single post details (auth required)
  - DELETE `/api/post/:postId` — Delete own post (auth required)
  - DELETE `/api/admin/post/:postId` — Admin-only delete (auth+admin)
  - PATCH `/api/post/:postId` — Update a post (auth required)

- Comments
  - GET `/api/comment/:postId` — Get comments for a post (auth required)
  - POST `/api/comment/:postId` — Add comment to post (auth required)
  - DELETE `/api/comment/:commentId` — Delete comment (auth required)
  - DELETE `/api/admin/comment/:commentId` — Admin delete (auth+admin)
  - PATCH `/api/comment/:commentId` — Update comment (auth required)

- Messages
  - POST `/api/message` — Send a message (auth required) body: { receiver, text }
  - GET `/api/message/:user2` — Fetch messages between logged-in user and user2 (auth required)

Data access & transactions
--------------------------
- The controllers use Mongoose transactions for multi-document operations (e.g., creating comments and updating posts atomically, deleting a post and related comments). Integration tests use an in-memory replica set so transactions can be exercised.

Project structure
-----------------
- `app.js` — Express app and route mounting
- `server.js` — entrypoint (starts server)
- `config/` — DB and JWT helpers
- `controllers/` — Express request handlers (organized by resource)
- `routes/` — Express routers
- `models/` — Mongoose models
- `tests/` — unit and integration tests
- `utils/` — helper functions and google oauth wrapper

Testing
-------
- Unit tests: `tests/unit/*` — Jest test files that mock Mongoose models and verify controller logic.
- Integration tests: `tests/integration/*` — Use `mongodb-memory-server` (replica set) + Supertest to exercise routes end-to-end.

Run tests
---------
Run all tests:

```bash
cd backend
npm test
```

Run only integration tests:

```bash
npx jest tests/integration --runInBand
```

Adding new tests
----------------
- Unit tests should mock Mongoose models (using `jest.mock('...')`) and avoid making network calls.
- Integration tests should use `tests/integration/setup.js` to create an in-memory replica set. This file starts/stops mongodb-memory-server.

Error handling & common pitfalls
-------------------------------
- Mongoose transactions require a replica set; the test setup spins up an in-memory replica set.
- When mocking mongoose in unit tests, ensure you import `mongoose` via `const mongoose = require('mongoose')` to allow Jest to mock methods like `startSession`.

CI recommendations
------------------
- Use `npm ci` to install locked dependencies.
- Run `npm test` and capture test artifacts, and run tests with `--runInBand` for parallel-safe DB use.

Contributing
------------
- Follow patterns in `controllers/*` for request validation and error handling.
- Add tests for new controller behavior and update `TEST_CASES_BACKEND.csv` when adding endpoints.

Contact
-------
If you want, I can also:
- generate a spreadsheet-ready CSV for backend tests (I will add it next),
- create a consolidated monorepo README, or
- add CI workflow to run tests and publish results.
