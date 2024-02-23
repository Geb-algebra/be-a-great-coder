import type { LoaderFunctionArgs } from '@remix-run/node';

import { authenticator } from '~/accounts/services/auth.server.ts';

export async function loader({ request }: LoaderFunctionArgs) {
  return authenticator.logout(request, { redirectTo: '/' });
}
