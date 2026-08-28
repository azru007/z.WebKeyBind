module.exports = {
  projects: [
    {
      displayName: "unit",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/unit/**/*.test.js"],
      setupFiles: ["<rootDir>/tests/setup/chrome-mock.js"]
    },
    {
      displayName: "integration",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
      setupFiles: ["<rootDir>/tests/setup/chrome-mock.js"]
    },
    {
      displayName: "security",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/security/**/*.test.js"]
    }
  ],
  collectCoverageFrom: [
    "background.js",
    "content.js",
    "popup.js",
    "import_export.js",
    "language.js"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "json-summary"]
};
