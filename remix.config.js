/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ignoredRouteFiles: ['**/.*'],
  serverModuleFormat: 'esm',
  tailwind: true,
  browserNodeBuiltinsPolyfill: { modules: { crypto: true } },
};
