module.exports = {
  rootDir: '../../..',
  testMatch: ['<rootDir>/apps/archy-api/test/**/*.database-spec.ts'],
  testEnvironment: 'node',
  testTimeout: 15000,
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
};
