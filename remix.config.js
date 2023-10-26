/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ['**/.*'],
  serverModuleFormat: 'esm',
  serverDependenciesToBundle: ['remix-auth-webauthn'],
  tailwind: true,
  browserNodeBuiltinsPolyfill: { modules: { crypto: true } },
};
