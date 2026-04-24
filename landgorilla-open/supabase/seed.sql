-- Seed data for LoanScope
-- Default org and admin user (password: Admin1234!)

INSERT INTO organizations (id, name, type)
VALUES ('00000000-0000-0000-0000-000000000001', 'LoanScope Demo', 'private_lender')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (organization_id, email, password_hash, first_name, last_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@loanscope.io',
  '$2a$12$VQ4dn4lWpTvmmK67HIxtregn.us2qgeFpszDPTilLbxmyERwIUiRO',
  'Admin',
  'User',
  'admin'
)
ON CONFLICT (email) DO NOTHING;
