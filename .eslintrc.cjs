/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["@remix-run/eslint-config", "@remix-run/eslint-config/node", "prettier"],
  rules: {
    quotes: ["error", "double", { avoidEscape: true }],
  },
  overrides: [
    {
      files: ["app/routes/**/*.test.{ts,tsx}"],
      extends: ["plugin:testing-library/react"],
    },
  ],
};
