# Stacks

A library desk app where members see the books their role can borrow and staff manage members. Angular 17 (standalone, lazy routes, signals) + Express/TypeScript API.

## Run
    cd server && npm install && npm run dev     # http://localhost:3000
    cd client && npm install && npm start       # http://localhost:4200

Demo logins: `admin` / `admin123` (Admin), `user1` / `user123` (General User).

## Architecture
- **server/**: `repository.ts` is a storage interface with a JSON-file implementation; implement it with DynamoDB or MongoDB to switch stores. `index.ts` has auth, role middleware and routes. Any request accepts `?delay=ms` (max 10000).
- **client/core**: `AuthService` (session + `APP_INITIALIZER` restore), `UserService` (all data calls, carries the delay setting), HTTP interceptor (token + error handling), guards.
- **client/features**: lazy-loaded login, dashboard, admin pages. The dashboard loads profile and records in parallel with skeleton rows; the delay selector shows the async behaviour.

Passwords are plain text and tokens are in-memory because this is a demo. Hash passwords and use JWT in production.

## Choosing the store
`STORE=json` (default) uses `server/data/db.json`; seed passwords are hashed on first start.
`STORE=dynamo` uses DynamoDB tables `AccessDeskUsers` (key `id`, string) and `AccessDeskRecords` (key `id`, number); set `AWS_REGION`, `USERS_TABLE`, `RECORDS_TABLE`. Auth uses signed JWTs (`JWT_SECRET`) and bcrypt hashes.

## How I built this
I used an AI assistant (permitted by the challenge brief) to scaffold the project, then reviewed, themed and adapted it. Design choices I can explain: signals for local state, a functional interceptor for auth and errors, `APP_INITIALIZER` to restore the session before routing, and a repository interface so storage (JSON or DynamoDB) is swappable.
