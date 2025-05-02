export default {
  preset: 'ts-jest/presets/default-esm',  // Use ts-jest with ESM for expo modules
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  projects: [
    {
      displayName: 'root',
      testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
      preset: 'jest-expo',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo|@expo-google-fonts|react-navigation|@react-navigation|native-base|unimodules|sentry-expo|react-native-svg|expo-modules-core)',
      ],
      coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/', '/types\\.ts$'],
    },
    {
      displayName: 'client',
      testMatch: [
        '<rootDir>/src/client/**/__tests__/**/*.test.ts',
        '<rootDir>/src/utils/**/__tests__/**/*.test.ts',
      ],
      preset: 'jest-expo',
      setupFilesAfterEnv: ['<rootDir>/src/client/__tests__/jest.client.setup.js'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.test.json' }],
      },
      transformIgnorePatterns: [
        'node_modules/(?!(jest-)?react-native|@react-native|expo(nent)?|@expo|@expo-google-fonts|react-navigation|@react-navigation|native-base|unimodules|sentry-expo|react-native-svg|expo-modules-core)',
      ],
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
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};
