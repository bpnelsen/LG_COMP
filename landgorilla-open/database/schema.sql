-- LoanScope Database Schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE 1: organizations
-- ============================================================
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(50) NOT NULL CHECK (type IN ('bank','credit_union','private_lender','insurance')),
  license_number VARCHAR(100),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city          VARCHAR(100),
  state         VARCHAR(50),
  zip_code      VARCHAR(20),
  country       VARCHAR(50) DEFAULT 'US',
  phone         VARCHAR(30),
  website       VARCHAR(255),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 2: users
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  role            VARCHAR(50) NOT NULL DEFAULT 'viewer'
                    CHECK (role IN ('admin','loan_officer','analyst','viewer')),
  phone           VARCHAR(30),
  title           VARCHAR(100),
  avatar_url      VARCHAR(500),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 3: borrowers
-- ============================================================
CREATE TABLE borrowers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type     VARCHAR(50) NOT NULL CHECK (entity_type IN ('individual','llc','corporation','partnership','trust')),
  legal_name      VARCHAR(255) NOT NULL,
  dba_name        VARCHAR(255),
  tax_id          VARCHAR(50),
  credit_score    INTEGER CHECK (credit_score BETWEEN 300 AND 850),
  annual_revenue  NUMERIC(18,2),
  net_worth       NUMERIC(18,2),
  total_debt      NUMERIC(18,2),
  years_in_business INTEGER,
  industry        VARCHAR(100),
  naics_code      VARCHAR(10),
  notes           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 4: contacts
-- ============================================================
CREATE TABLE contacts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  borrower_id    UUID NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  title          VARCHAR(100),
  email          VARCHAR(255),
  phone          VARCHAR(30),
  is_primary     BOOLEAN NOT NULL DEFAULT false,
  contact_type   VARCHAR(50) DEFAULT 'general'
                   CHECK (contact_type IN ('general','guarantor','authorized_signer','beneficial_owner')),
  ownership_pct  NUMERIC(5,2) CHECK (ownership_pct BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 5: properties
-- ============================================================
CREATE TABLE properties (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  borrower_id     UUID NOT NULL REFERENCES borrowers(id),
  property_type   VARCHAR(50) NOT NULL
                    CHECK (property_type IN ('residential','commercial','industrial','land','mixed_use')),
  address_line1   VARCHAR(255) NOT NULL,
  address_line2   VARCHAR(255),
  city            VARCHAR(100) NOT NULL,
  state           VARCHAR(50) NOT NULL,
  zip_code        VARCHAR(20) NOT NULL,
  country         VARCHAR(50) NOT NULL DEFAULT 'US',
  parcel_number   VARCHAR(100),
  square_footage  NUMERIC(12,2),
  lot_size        NUMERIC(12,2),
  year_built      INTEGER,
  units           INTEGER,
  zoning          VARCHAR(100),
  occupancy_rate  NUMERIC(5,2) CHECK (occupancy_rate BETWEEN 0 AND 100),
  noi             NUMERIC(18,2),
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 6: loans
-- ============================================================
CREATE TABLE loans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_number      VARCHAR(50) NOT NULL,
  borrower_id      UUID NOT NULL REFERENCES borrowers(id),
  property_id      UUID REFERENCES properties(id),
  loan_officer_id  UUID REFERENCES users(id),
  status           VARCHAR(50) NOT NULL DEFAULT 'application'
                     CHECK (status IN ('application','underwriting','approved','funded',
                                       'performing','watchlist','default','foreclosure',
                                       'paid_off','charged_off')),
  loan_type        VARCHAR(50) NOT NULL
                     CHECK (loan_type IN ('construction','bridge','permanent','mezzanine','equity')),
  original_balance NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_balance  NUMERIC(18,2) NOT NULL DEFAULT 0,
  committed_amount NUMERIC(18,2) NOT NULL,
  interest_rate    NUMERIC(6,4) NOT NULL,
  rate_type        VARCHAR(20) NOT NULL DEFAULT 'fixed' CHECK (rate_type IN ('fixed','variable')),
  index_rate       VARCHAR(50),
  spread           NUMERIC(6,4),
  origination_date DATE,
  maturity_date    DATE,
  extension_options INTEGER DEFAULT 0,
  ltv_ratio        NUMERIC(6,4),
  dscr             NUMERIC(6,4),
  noi              NUMERIC(18,2),
  recourse         BOOLEAN DEFAULT true,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, loan_number)
);

-- ============================================================
-- TABLE 7: loan_documents
-- ============================================================
CREATE TABLE loan_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id       UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES users(id),
  document_type VARCHAR(100) NOT NULL,
  file_name     VARCHAR(255) NOT NULL,
  file_size     BIGINT,
  mime_type     VARCHAR(100),
  storage_key   TEXT NOT NULL,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 8: covenants
-- ============================================================
CREATE TABLE covenants (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id            UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  covenant_type      VARCHAR(50) NOT NULL
                       CHECK (covenant_type IN ('financial','reporting','operational','insurance')),
  description        TEXT NOT NULL,
  threshold_value    NUMERIC(18,4),
  threshold_operator VARCHAR(3) CHECK (threshold_operator IN ('<','<=','>','>=','=')),
  frequency          VARCHAR(20) NOT NULL
                       CHECK (frequency IN ('monthly','quarterly','semi_annual','annual','one_time')),
  next_due_date      DATE,
  status             VARCHAR(20) NOT NULL DEFAULT 'compliant'
                       CHECK (status IN ('compliant','waived','exception','breach')),
  last_tested_at     TIMESTAMPTZ,
  last_tested_value  NUMERIC(18,4),
  notes              TEXT,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 9: covenant_exceptions
-- ============================================================
CREATE TABLE covenant_exceptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  covenant_id   UUID NOT NULL REFERENCES covenants(id) ON DELETE CASCADE,
  reported_by   UUID NOT NULL REFERENCES users(id),
  exception_date DATE NOT NULL DEFAULT CURRENT_DATE,
  actual_value  NUMERIC(18,4),
  description   TEXT NOT NULL,
  resolution    TEXT,
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 10: disbursements
-- ============================================================
CREATE TABLE disbursements (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id           UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  requested_by      UUID REFERENCES users(id),
  approved_by       UUID REFERENCES users(id),
  amount            NUMERIC(18,2) NOT NULL,
  disbursement_date DATE NOT NULL,
  description       TEXT,
  bank_account      VARCHAR(50),
  wire_reference    VARCHAR(100),
  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','approved','disbursed','cancelled')),
  approved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 11: payments
-- ============================================================
CREATE TABLE payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id          UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  payment_date     DATE NOT NULL,
  amount           NUMERIC(18,2) NOT NULL,
  principal        NUMERIC(18,2) NOT NULL DEFAULT 0,
  interest         NUMERIC(18,2) NOT NULL DEFAULT 0,
  fees             NUMERIC(18,2) NOT NULL DEFAULT 0,
  balance_after    NUMERIC(18,2) NOT NULL,
  payment_method   VARCHAR(50),
  reference_number VARCHAR(100),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 12: valuations
-- ============================================================
CREATE TABLE valuations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id      UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  loan_id          UUID REFERENCES loans(id),
  valuation_type   VARCHAR(50) NOT NULL
                     CHECK (valuation_type IN ('appraisal','bpo','avm','inspection','tax_assessed')),
  appraiser_name   VARCHAR(255),
  appraiser_license VARCHAR(100),
  value            NUMERIC(18,2) NOT NULL,
  valuation_date   DATE NOT NULL,
  effective_date   DATE,
  report_url       TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 13: insurance_policies
-- ============================================================
CREATE TABLE insurance_policies (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id        UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  property_id    UUID REFERENCES properties(id),
  policy_type    VARCHAR(50) NOT NULL
                   CHECK (policy_type IN ('property','liability','flood','title','hazard','other')),
  carrier        VARCHAR(255) NOT NULL,
  policy_number  VARCHAR(100) NOT NULL,
  coverage_amount NUMERIC(18,2) NOT NULL,
  premium        NUMERIC(18,2),
  effective_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 14: portfolio_snapshots
-- ============================================================
CREATE TABLE portfolio_snapshots (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date    DATE NOT NULL,
  total_loans      INTEGER NOT NULL DEFAULT 0,
  total_committed  NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_outstanding NUMERIC(18,2) NOT NULL DEFAULT 0,
  performing_count INTEGER NOT NULL DEFAULT 0,
  watchlist_count  INTEGER NOT NULL DEFAULT 0,
  default_count    INTEGER NOT NULL DEFAULT 0,
  avg_interest_rate NUMERIC(6,4),
  avg_ltv          NUMERIC(6,4),
  avg_dscr         NUMERIC(6,4),
  metrics_json     JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 15: tasks
-- ============================================================
CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loan_id         UUID REFERENCES loans(id),
  assigned_to     UUID REFERENCES users(id),
  created_by      UUID NOT NULL REFERENCES users(id),
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  task_type       VARCHAR(50) DEFAULT 'general',
  priority        VARCHAR(20) NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),
  status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','completed','cancelled')),
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 16: notifications
-- ============================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  loan_id         UUID REFERENCES loans(id),
  type            VARCHAR(50) NOT NULL,
  title           VARCHAR(255) NOT NULL,
  message         TEXT,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 17: report_definitions
-- ============================================================
CREATE TABLE report_definitions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES users(id),
  name            VARCHAR(255) NOT NULL,
  report_type     VARCHAR(100) NOT NULL,
  description     TEXT,
  filters_json    JSONB,
  columns_json    JSONB,
  schedule        VARCHAR(50),
  last_run_at     TIMESTAMPTZ,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 18: report_runs
-- ============================================================
CREATE TABLE report_runs (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_definition_id UUID NOT NULL REFERENCES report_definitions(id) ON DELETE CASCADE,
  run_by             UUID NOT NULL REFERENCES users(id),
  status             VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','running','completed','failed')),
  row_count          INTEGER,
  file_url           TEXT,
  error_message      TEXT,
  started_at         TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE 19: audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  action          VARCHAR(50) NOT NULL,
  table_name      VARCHAR(100) NOT NULL,
  record_id       UUID,
  old_values      JSONB,
  new_values      JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- organizations
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- users
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- borrowers
CREATE INDEX idx_borrowers_organization_id ON borrowers(organization_id);
CREATE INDEX idx_borrowers_entity_type ON borrowers(entity_type);
CREATE INDEX idx_borrowers_is_active ON borrowers(is_active);

-- contacts
CREATE INDEX idx_contacts_borrower_id ON contacts(borrower_id);

-- properties
CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_properties_borrower_id ON properties(borrower_id);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_state ON properties(state);

-- loans
CREATE INDEX idx_loans_organization_id ON loans(organization_id);
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_property_id ON loans(property_id);
CREATE INDEX idx_loans_loan_officer_id ON loans(loan_officer_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_loan_type ON loans(loan_type);
CREATE INDEX idx_loans_origination_date ON loans(origination_date);
CREATE INDEX idx_loans_maturity_date ON loans(maturity_date);
CREATE INDEX idx_loans_is_active ON loans(is_active);
CREATE INDEX idx_loans_org_status ON loans(organization_id, status) WHERE is_active = true;

-- covenants
CREATE INDEX idx_covenants_loan_id ON covenants(loan_id);
CREATE INDEX idx_covenants_status ON covenants(status);
CREATE INDEX idx_covenants_next_due_date ON covenants(next_due_date);
CREATE INDEX idx_covenants_is_active ON covenants(is_active);

-- disbursements
CREATE INDEX idx_disbursements_loan_id ON disbursements(loan_id);
CREATE INDEX idx_disbursements_status ON disbursements(status);
CREATE INDEX idx_disbursements_date ON disbursements(disbursement_date);

-- payments
CREATE INDEX idx_payments_loan_id ON payments(loan_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- valuations
CREATE INDEX idx_valuations_property_id ON valuations(property_id);
CREATE INDEX idx_valuations_loan_id ON valuations(loan_id);
CREATE INDEX idx_valuations_date ON valuations(valuation_date);

-- portfolio_snapshots
CREATE INDEX idx_portfolio_snapshots_org_date ON portfolio_snapshots(organization_id, snapshot_date);

-- tasks
CREATE INDEX idx_tasks_organization_id ON tasks(organization_id);
CREATE INDEX idx_tasks_loan_id ON tasks(loan_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- audit_logs
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'organizations','users','borrowers','contacts','properties','loans',
    'loan_documents','covenants','covenant_exceptions','disbursements',
    'payments','valuations','insurance_policies','tasks','notifications',
    'report_definitions'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at()',
      tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- SEED: default organization and admin user
-- Password: Admin1234! (bcrypt hash)
-- ============================================================

INSERT INTO organizations (id, name, type)
VALUES ('00000000-0000-0000-0000-000000000001', 'LoanScope Demo', 'private_lender');

INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@loanscope.io',
  '$2a$12$VQ4dn4lWpTvmmK67HIxtregn.us2qgeFpszDPTilLbxmyERwIUiRO',
  'Admin',
  'User',
  'admin'
);
