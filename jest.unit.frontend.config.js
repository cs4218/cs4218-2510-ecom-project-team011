export default {
  // name displayed during tests
  displayName: "unit (frontend)",
  
  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",
  
  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  
  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },
  
  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],
  
  // only run these tests
  testMatch: [
    "<rootDir>/client/src/pages/**/*.unit.test.js",
    "<rootDir>/client/src/context/*.unit.test.js",
    "<rootDir>/client/src/components/**/*.unit.test.js",
    "<rootDir>/client/**/*.test.js",
  ],
  
  testPathIgnorePatterns: [
    "/node_modules/",
    "\.integration\.test\.js",
    "\.i\.test\.js",
    "\.playwright\.test\.js"
  ],
  
  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/pages/**",
    "client/src/pages/Auth/**",
    "client/src/context/**",
    "client/src/components/**",
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
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],
};
