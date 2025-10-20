export default {
  // display name
  displayName: "unit (backend)",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.unit.test.js",
    "<rootDir>/helpers/*.unit.test.js",
    "<rootDir>/middlewares/*.unit.test.js"
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**"
  ],
  // coverageThreshold: {
  //   global: {
  //     lines: 100,
  //     functions: 100,
  //   },
  // },
};
