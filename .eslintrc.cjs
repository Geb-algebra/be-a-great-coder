/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['@remix-run/eslint-config', '@remix-run/eslint-config/node', 'prettier'],
  rules: {
    quotes: ['error', 'single', { avoidEscape: true }],
  },
};
