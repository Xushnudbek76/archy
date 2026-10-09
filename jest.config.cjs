module.exports = {
  rootDir: '.',
  testMatch: ['<rootDir>/apps/archy-api/src/**/*.spec.ts'],
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
};
