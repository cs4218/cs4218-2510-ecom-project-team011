export default {
  // name displayed during tests
  displayName: "integration (backend)",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "node",

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
    "<rootDir>/**/*.integration.test.js",
    "<rootDir>/**/*.i.test.js",
  ],

  // exclude these test
  testPathIgnorePatterns: [
    "/node_modules/",
    "/client/"
  ],

  // jest code coverage
  collectCoverage: false,
  // collectCoverageFrom: [
  //   "client/src/pages/**",
  //   "client/src/pages/Auth/**",
  //   "client/src/context/**",
  //   "client/src/components/**",
  // ],
  // coverageThreshold: {
  //   global: {
  //     lines: 100,
  //     functions: 100,
  //   },
  // },
};
