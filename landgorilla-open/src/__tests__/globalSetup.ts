import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export default async function globalSetup() {
  const env = {
    PGPASSWORD: 'loanscope_dev',
    PGHOST: 'localhost',
    PGPORT: '5432',
    PGUSER: 'loanscope',
  };

  // Drop and recreate test DB
  try {
    execSync(`psql -h localhost -U loanscope -d postgres -c "DROP DATABASE IF EXISTS loanscope_test;"`, {
      env: { ...process.env, ...env },
      stdio: 'pipe',
    });
  } catch {
    // ignore
  }

  execSync(`psql -h localhost -U loanscope -d postgres -c "CREATE DATABASE loanscope_test OWNER loanscope;"`, {
    env: { ...process.env, ...env },
    stdio: 'pipe',
  });

  const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  execSync(`psql -h localhost -U loanscope -d loanscope_test`, {
    input: schemaSql,
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}
