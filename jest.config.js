// jest.config.js  (root)
export default {
  // Run each sub‑project with its own config / displayName
  projects: [
    "<rootDir>/jest.unit.backend.config.js",
    "<rootDir>/jest.unit.frontend.config.js",
    "<rootDir>/jest.integration.frontend.config.js",
    "<rootDir>/jest.integration.backend.config.js",
  ]
};
