module.exports = {
  rootDir: '.',
  testMatch: [
    '<rootDir>/apps/archy-api/src/**/*.spec.ts',
    '<rootDir>/apps/archy-api/test/**/*.spec.ts',
  ],
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
};
