import { execSync } from 'child_process';

export default async function globalTeardown() {
  const env = {
    PGPASSWORD: 'loanscope_dev',
    PGHOST: 'localhost',
    PGPORT: '5432',
    PGUSER: 'loanscope',
  };

  try {
    execSync(
      `psql -h localhost -U loanscope -d postgres -c "DROP DATABASE IF EXISTS loanscope_test;"`,
      { env: { ...process.env, ...env }, stdio: 'pipe' }
    );
  } catch {
    // ignore
  }
}
