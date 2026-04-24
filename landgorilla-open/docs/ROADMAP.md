# Development Roadmap

## Phase 1 — Foundation (Complete)

- [x] Node.js/TypeScript backend
- [x] PostgreSQL schema (19 tables)
- [x] Auth endpoints (login, register, /me)
- [x] Loan CRUD endpoints
- [x] Portfolio analytics endpoints
- [x] JWT authentication + RBAC
- [x] Docker containerization
- [x] Audit logging schema

## Phase 2 — Borrower & Property Management

- [ ] GET/POST/PUT/DELETE /api/borrowers
- [ ] GET/POST/PUT/DELETE /api/properties
- [ ] GET/POST /api/borrowers/:id/contacts
- [ ] GET/POST /api/loans/:id/disbursements
- [ ] GET/POST /api/loans/:id/covenants
- [ ] Covenant compliance status engine

## Phase 3 — React Frontend

- [ ] Dashboard with portfolio KPIs
- [ ] Loan list + detail views
- [ ] Borrower management UI
- [ ] Covenant tracking UI
- [ ] Charts (Recharts)
- [ ] Role-based UI rendering

## Phase 4 — Automation Workers (Python/OpenClaw)

- [ ] Daily portfolio snapshot job
- [ ] Covenant due-date monitor
- [ ] Maturity date alerts
- [ ] Payment reminder notifications
- [ ] LTV/DSCR recalculation jobs

## Phase 5 — Enterprise Features

- [ ] Swagger/OpenAPI documentation
- [ ] Unit and integration test suite
- [ ] Webhook outbound events
- [ ] SFTP report export
- [ ] SSO (SAML/OIDC)
- [ ] Production Kubernetes manifests
