export default {
  // display name
  displayName: "unit (backend)",
  
  // when testing backend
  testEnvironment: "node",
  
  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js"
  ],
  
  testPathIgnorePatterns: [
    "/node_modules/",
    "/client/",
    "\.integration\.test\.js",
    "\.i\.test\.js",
    "\.playwright\.test\.js"
  ],
  
  
  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**",
    "helpers/**",
    "middlewares/**"
  ],
    coveragePathIgnorePatterns: [
    "/node_modules/",
    "\.integration\.test\.js",
    "\.i\.test\.js",
    "\.playwright\.test\.js",
    "__tests__"
  ],

  // coverageThreshold: {
  //   global: {
  //     lines: 100,
  //     functions: 100,
  //   },
  // },
};
