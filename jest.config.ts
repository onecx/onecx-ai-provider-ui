/* eslint-disable */
import type { Config } from 'jest'

const config: Config = {
  displayName: 'onecx-ai-management',
  preset: './jest.preset.js',
  verbose: false,
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: ['<rootDir>/src/app/**/*.spec.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },
  transformIgnorePatterns: ['node_modules/(?!@ngrx|(?!deck.gl)|d3-scale|(?!.*.mjs$))'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment'
  ],
  collectCoverage: true,
  coverageDirectory: '<rootDir>/reports/coverage/',
  coveragePathIgnorePatterns: ['src/app/shared/generated'],
  coverageReporters: ['json', 'lcov', 'text', 'text-summary', 'html'],
  testResultsProcessor: 'jest-sonar-reporter',
  testPathIgnorePatterns: ['<rootDir>/src/app/shared/'],
  reporters: [
    'default',
    [
      'jest-sonar',
      {
        outputDirectory: './reports',
        outputName: 'sonarqube_report.xml',
        reportedFilePath: 'absolute'
      }
    ]
  ]
}

export default config
