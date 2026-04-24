# Architecture

## Overview

```
Client (HTTP)
    │
    ▼
Express API (Node.js 18 / TypeScript)
    │
    ├── Helmet + CORS + Rate Limiter
    ├── JWT Authentication middleware
    ├── Routes: /api/auth, /api/loans, /api/portfolio
    └── Error handler
    │
    ▼
PostgreSQL 15 (connection pool via node-postgres)
```

## Directory Structure

```
src/
├── index.ts              # App entry — Express setup, route mounting
├── routes/
│   ├── auth.ts           # POST /login, POST /register, GET /me
│   ├── loans.ts          # CRUD for loans + covenant/disbursement detail
│   └── portfolio.ts      # GET /summary, GET /performance
├── middleware/
│   ├── auth.ts           # JWT verify, requireRole()
│   └── errorHandler.ts   # Zod validation errors + 500 fallback
├── db/
│   └── index.ts          # pg Pool, query(), testConnection()
├── types/
│   └── index.ts          # All TypeScript interfaces and enums
└── utils/
    └── logger.ts         # Winston logger
```

## Database (19 tables)

| # | Table | Purpose |
|---|-------|---------|
| 1 | organizations | Multi-tenant root — lenders, banks, credit unions |
| 2 | users | Staff per organization with RBAC roles |
| 3 | borrowers | Borrower entities (individual, LLC, corp, etc.) |
| 4 | contacts | People attached to a borrower |
| 5 | properties | Collateral properties |
| 6 | loans | Core loan records |
| 7 | loan_documents | File attachments on a loan |
| 8 | covenants | Financial/reporting/insurance covenants |
| 9 | covenant_exceptions | Exceptions and waivers on covenants |
| 10 | disbursements | Draw requests and fund disbursements |
| 11 | payments | Payment history |
| 12 | valuations | Appraisals, BPOs, AVMs |
| 13 | insurance_policies | Insurance tracking per loan/property |
| 14 | portfolio_snapshots | Daily point-in-time portfolio metrics |
| 15 | tasks | Workflow tasks assigned to staff |
| 16 | notifications | System alerts and notifications |
| 17 | report_definitions | Saved report configurations |
| 18 | report_runs | Report execution history |
| 19 | audit_logs | Full audit trail of all changes |

## Authentication

- Passwords hashed with bcrypt (cost factor 12)
- JWT signed with HS256, default TTL 24 h
- Roles: `admin` > `loan_officer` > `analyst` > `viewer`

## Multi-Tenancy

All data tables include `organization_id`. Every query filters by the organization derived from the JWT payload — tenants are fully isolated at the query level.

## Security

- `helmet` sets secure HTTP headers
- `express-rate-limit` limits to 100 req/15 min per IP on `/api/*`
- Input validated with `zod` schemas before any DB query
- SQL injections prevented via parameterized queries (node-postgres)
