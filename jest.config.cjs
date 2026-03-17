// jest.config.cjs for ES module support
const WIN_OR_POSIX_SEP = '[/\\\\]';

module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  // Force a narrow test scope to avoid crawling large non-test folders.
  testMatch: ['<rootDir>/dashboard.test.js'],
  maxWorkers: 1,
  cache: false,
  testPathIgnorePatterns: [
    `${WIN_OR_POSIX_SEP}node_modules${WIN_OR_POSIX_SEP}`,
    `${WIN_OR_POSIX_SEP}\\.venv${WIN_OR_POSIX_SEP}`,
    `${WIN_OR_POSIX_SEP}coverage${WIN_OR_POSIX_SEP}`,
    `${WIN_OR_POSIX_SEP}dashboard-test-isolated${WIN_OR_POSIX_SEP}`,
    `${WIN_OR_POSIX_SEP}smart-contract${WIN_OR_POSIX_SEP}`,
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.venv/',
    '<rootDir>/dashboard-test-isolated/',
    '<rootDir>/smart-contract/',
    '<rootDir>/smart-contract/artifacts/',
    '<rootDir>/smart-contract/cache/',
  ],
  collectCoverageFrom: [
    'dashboard.js',
    '!jest.config.cjs',
    '!jest.setup.cjs',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
