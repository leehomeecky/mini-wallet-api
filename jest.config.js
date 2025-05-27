const { createDefaultPreset } = require('ts-jest');

const tsJestPreset = createDefaultPreset();

/** @type {import("jest").Config} */
module.exports = {
  ...tsJestPreset,
  testEnvironment: 'node',
  transform: {
    ...tsJestPreset.transform,
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testMatch: ['**/tests/**/*.spec.ts'],
  roots: ['<rootDir>/src'],
};
