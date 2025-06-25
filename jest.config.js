export default {
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  projects: [
    {
      displayName: 'root',
      testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/client/__tests__/jest.client.setup.js'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
      },
      coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/types\\.ts$'],
    },
    {
      displayName: 'client',
      testMatch: [
        '<rootDir>/src/client/**/__tests__/**/*.test.ts',
        '<rootDir>/src/utils/**/__tests__/**/*.test.ts',
      ],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/client/__tests__/jest.client.setup.js'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
      },
      coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/types\\.ts$'],
    },
    {
      displayName: 'server',
      testMatch: ['<rootDir>/src/server/**/__tests__/**/*.test.ts'],
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/src/server/__tests__/jest.server.setup.js'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
      },
      coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/types\\.ts$'],
    },
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**/*",
    "!**/node_modules/**"
  ],
  coverageProvider: "v8",
  cache: false,
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};