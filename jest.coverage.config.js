const baseConfig = require('./jest.config.js')

module.exports = {
  ...baseConfig,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
    'clover'
  ],
  collectCoverageFrom: [
    'apps/web/src/**/*.{js,jsx,ts,tsx}',
    'packages/*/src/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.js',
    '!**/jest.setup.js',
    '!**/test-utils.tsx',
    '!**/__tests__/**',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/*.spec.{js,jsx,ts,tsx}',
    '!**/stories/**',
    '!**/storybook-static/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './apps/web/src/components/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './apps/web/src/lib/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './packages/database/src/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
    '/build/',
    '/__tests__/',
    '/test-utils.tsx',
    '.config.js',
    '.setup.js',
  ],
}