# LoanScope

Commercial lending portfolio management platform — Node.js/TypeScript backend with PostgreSQL.

## Quick Start

```bash
cp .env.example .env
docker-compose -f docker/docker-compose.yml up
# API available at http://localhost:3000
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /health | No | Health check |
| POST | /api/auth/login | No | Login |
| POST | /api/auth/register | No | Register user |
| GET | /api/auth/me | Yes | Current user |
| GET | /api/loans | Yes | List loans |
| GET | /api/loans/:id | Yes | Loan detail |
| POST | /api/loans | Yes (officer+) | Create loan |
| PUT | /api/loans/:id | Yes (officer+) | Update loan |
| DELETE | /api/loans/:id | Yes (admin) | Soft-delete loan |
| GET | /api/portfolio/summary | Yes | Portfolio summary |
| GET | /api/portfolio/performance | Yes | Portfolio performance |

## Default Credentials

```
Email: admin@loanscope.io
Password: Admin1234!
Organization ID: 00000000-0000-0000-0000-000000000001
```

## Stack

- Node.js 18 + TypeScript 5.3
- Express 4.18
- PostgreSQL 15
- JWT authentication
- Docker + Docker Compose
