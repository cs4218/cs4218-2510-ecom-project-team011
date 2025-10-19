import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

export default {
  // display name
  displayName: "integration",

  // when testing integration
  testEnvironment: "node",

  // which test to run - integration tests only
  testMatch: [
    "<rootDir>/test/integration/**/*.test.js",
    "<rootDir>/config/*_integration.test.js",
    "<rootDir>/**/*.integration.test.js",
    "<rootDir>/**/*.i.test.js",
  ],

  // jest code coverage
  collectCoverage: false,
  
  // Integration tests may take longer
  testTimeout: 10000,
  
  // coverageThreshold: {
  //   global: {
  //     lines: 80,
  //     functions: 80,
  //   },
  // },
};
