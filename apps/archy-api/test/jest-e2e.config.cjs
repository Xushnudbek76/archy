module.exports = {
  rootDir: '../../..',
  testMatch: ['<rootDir>/apps/archy-api/test/**/*.e2e-spec.ts'],
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
};
