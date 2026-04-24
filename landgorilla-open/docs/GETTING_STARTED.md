# Getting Started

## Prerequisites

- Docker + Docker Compose, **or** Node.js 18+ and PostgreSQL 15

## Docker Setup (recommended)

```bash
# 1. Clone and enter the project
cd landgorilla-open

# 2. Copy environment config
cp .env.example .env

# 3. Start all services
docker-compose -f docker/docker-compose.yml up

# 4. Wait ~10 seconds, then test
curl http://localhost:3000/health
```

## Local Setup

```bash
# 1. Install dependencies
npm install

# 2. Create a PostgreSQL database and apply the schema
psql -U postgres -c "CREATE DATABASE loanscope;"
psql -U postgres -d loanscope -f database/schema.sql

# 3. Configure environment
cp .env.example .env
# Edit .env — set DB_USER, DB_PASSWORD, JWT_SECRET

# 4. Run in development mode
npm run dev
```

## Testing the API

```bash
# Health check
curl http://localhost:3000/health

# Login with seed admin
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loanscope.io","password":"Admin1234!"}' | jq .

# Export the token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@loanscope.io","password":"Admin1234!"}' | jq -r .data.token)

# Get portfolio summary
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/portfolio/summary | jq .

# List loans
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/loans | jq .
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `loanscope` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `JWT_SECRET` | — | **Required** — use a long random string |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `LOG_LEVEL` | `info` | winston log level |
