import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/__tests__/**/*.test.ts'],
  globalSetup: '<rootDir>/__tests__/globalSetup.ts',
  globalTeardown: '<rootDir>/__tests__/globalTeardown.ts',
  setupFiles: ['<rootDir>/__tests__/setEnv.ts'],
  forceExit: true,
  testTimeout: 30000,
  collectCoverageFrom: [
    '**/*.ts',
    '!**/__tests__/**',
    '!**/index.ts',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
};

export default config;
