// Owner authentication for /api/owner/* routes.
// Accepts EITHER:
//  1. Cloudflare Access (free Zero Trust) in front of the route, which sets
//     Cf-Access-Authenticated-User-Email — checked against OWNER_EMAIL; or
//  2. Authorization: Bearer <OWNER_API_TOKEN> (long random secret, stored as a Worker secret).

import { safeEqual } from './payhip.js';

export function ownerIdentity(request, env) {
  const accessEmail = request.headers.get('cf-access-authenticated-user-email');
  if (accessEmail && env.OWNER_EMAIL && accessEmail.toLowerCase() === env.OWNER_EMAIL.toLowerCase()) {
    return accessEmail.toLowerCase();
  }
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (env.OWNER_API_TOKEN && env.OWNER_API_TOKEN.length >= 32 && safeEqual(token, env.OWNER_API_TOKEN)) {
    return env.OWNER_EMAIL ? env.OWNER_EMAIL.toLowerCase() : 'owner';
  }
  return null;
}
