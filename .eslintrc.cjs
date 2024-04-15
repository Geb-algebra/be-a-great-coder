/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["plugin:testing-library/react", "biome"],
  files: ["app/routes/**/*.test.{ts,tsx}"],
  rules: {
    quotes: ["error", "double", { avoidEscape: true }],
  },
};
