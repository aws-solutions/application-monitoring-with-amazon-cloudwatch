module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: false,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of regexp pattern strings used to skip coverage collection
  coveragePathIgnorePatterns: ["/node_modules/"],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ["node_modules"],

  // An array of file extensions your modules use
  moduleFileExtensions: ["ts", "json", "jsx", "js", "tsx", "node"],

  // Automatically reset mock state between every test
  resetMocks: false,

  // The glob patterns Jest uses to detect test files
  testMatch: ["**/?(*.)+(spec|test).[t]s?(x)"],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ["/node_modules/"],

  // A map from regular expressions to paths to transformers
  transform: {
    "^.+\\.(t)sx?$": "ts-jest",
  },

  // Indicates whether each individual test should be reported during the run
  verbose: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "./lib/*",
    "!./lib/utils/*",
    "!**.js",
    "!**/*.d.ts",
    "!**/*.json",
  ],
  coverageReporters: ["text", "lcov"],

  // This option allows the use of a custom results processor.
  testResultsProcessor: "jest-sonar-reporter",
};
