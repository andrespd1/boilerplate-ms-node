// jest.config.ts

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Option A: collectCoverageFrom (explicit "include" + "exclude")
  collectCoverageFrom: [
    'src/**/*.ts', // include all TypeScript files in src
    '!src/config/**', // exclude config folder
    '!src/enums/**', // exclude enums folder
    '!src/proto-generated/**', // exclude proto-generated folder
    '!src/repositories/**', // exclude repositories folder
    '!src/index.ts', // exclude single file
  ],

  // A pattern for where tests live (adjust if needed)
  testMatch: ['**/tests/**/*.test.ts'],
  coverageThreshold: {
    global: { branches: 85, functions: 85, lines: 85, statements: 85 },
  },

  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
