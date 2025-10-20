export default {
  // display name
  displayName: "integration (backend)",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.integration.test.js",
    "<rootDir>/helpers/*.integration.test.js",
    "<rootDir>/middlewares/*.integration.test.js",
    "<rootDir>/config/*.integration.test.js"
  ],

  // jest code coverage
  collectCoverage: false,
  // collectCoverageFrom: [
  //   "controllers/**",
  //   "helpers/**",
  //   "middlewares/**"
  // ],
  // coverageThreshold: {
  //   global: {
  //     lines: 100,
  //     functions: 100,
  //   },
  // },
};
