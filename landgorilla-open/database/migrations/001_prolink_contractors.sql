-- Migration: Prolink Contractor Management Module
-- Adds contractors, loan_contractors, and draw_requests tables

-- ============================================================
-- contractors: approved vendor registry per organization
-- ============================================================
CREATE TABLE contractors (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_name             VARCHAR(255) NOT NULL,
  dba_name                 VARCHAR(255),
  contractor_type          VARCHAR(50) NOT NULL
                             CHECK (contractor_type IN (
                               'general','electrical','plumbing','framing','roofing',
                               'hvac','concrete','masonry','painting','landscaping','other'
                             )),
  license_number           VARCHAR(100),
  license_state            VARCHAR(50),
  license_expiry           DATE,
  insurance_carrier        VARCHAR(255),
  insurance_policy         VARCHAR(100),
  insurance_expiry         DATE,
  insurance_amount         NUMERIC(18,2),
  bond_carrier             VARCHAR(255),
  bond_number              VARCHAR(100),
  bond_amount              NUMERIC(18,2),
  bond_expiry              DATE,
  tax_id                   VARCHAR(50),
  address_line1            VARCHAR(255),
  address_line2            VARCHAR(255),
  city                     VARCHAR(100),
  state                    VARCHAR(50),
  zip_code                 VARCHAR(20),
  primary_contact_name     VARCHAR(200),
  primary_contact_email    VARCHAR(255),
  primary_contact_phone    VARCHAR(30),
  status                   VARCHAR(50) NOT NULL DEFAULT 'pending_review'
                             CHECK (status IN ('active','inactive','suspended','pending_review')),
  is_approved_vendor       BOOLEAN NOT NULL DEFAULT false,
  approved_by              UUID REFERENCES users(id),
  approved_at              TIMESTAMPTZ,
  notes                    TEXT,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contractors_org        ON contractors(organization_id);
CREATE INDEX idx_contractors_status     ON contractors(status);
CREATE INDEX idx_contractors_type       ON contractors(contractor_type);
CREATE INDEX idx_contractors_approved   ON contractors(organization_id, is_approved_vendor);

-- ============================================================
-- loan_contractors: links contractors to specific loans
-- ============================================================
CREATE TABLE loan_contractors (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id                  UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  contractor_id            UUID NOT NULL REFERENCES contractors(id),
  role                     VARCHAR(50) NOT NULL
                             CHECK (role IN (
                               'general_contractor','sub_contractor',
                               'architect','engineer','inspector'
                             )),
  contract_amount          NUMERIC(18,2),
  scope_of_work            TEXT,
  start_date               DATE,
  expected_completion_date DATE,
  actual_completion_date   DATE,
  status                   VARCHAR(50) NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','completed','terminated')),
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (loan_id, contractor_id, role)
);

CREATE INDEX idx_loan_contractors_loan       ON loan_contractors(loan_id);
CREATE INDEX idx_loan_contractors_contractor ON loan_contractors(contractor_id);

-- ============================================================
-- draw_requests: construction draw / inspection requests
-- ============================================================
CREATE TABLE draw_requests (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id           UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  contractor_id     UUID REFERENCES contractors(id),
  draw_number       INTEGER NOT NULL,
  requested_amount  NUMERIC(18,2) NOT NULL CHECK (requested_amount > 0),
  requested_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  description       TEXT,
  line_items        JSONB,
  inspector_name    VARCHAR(200),
  inspection_date   DATE,
  inspection_notes  TEXT,
  percent_complete  NUMERIC(5,2) CHECK (percent_complete BETWEEN 0 AND 100),
  approved_amount   NUMERIC(18,2),
  status            VARCHAR(50) NOT NULL DEFAULT 'draft'
                      CHECK (status IN (
                        'draft','submitted','inspection_scheduled',
                        'inspection_complete','approved','rejected','funded'
                      )),
  submitted_by      UUID REFERENCES users(id),
  submitted_at      TIMESTAMPTZ,
  approved_by       UUID REFERENCES users(id),
  approved_at       TIMESTAMPTZ,
  funded_at         TIMESTAMPTZ,
  rejection_reason  TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (loan_id, draw_number)
);

CREATE INDEX idx_draw_requests_loan        ON draw_requests(loan_id);
CREATE INDEX idx_draw_requests_contractor  ON draw_requests(contractor_id);
CREATE INDEX idx_draw_requests_status      ON draw_requests(status);
