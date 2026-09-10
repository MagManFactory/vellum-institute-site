import { verifySession } from '../_lib/session.js';

function isUnlockPath(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  return path === '/offer/unlock' || path === '/offer/unlock.html';
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (isUnlockPath(url.pathname)) {
    return context.next();
  }

  if (await verifySession(context.request, context.env)) {
    return context.next();
  }

  return Response.redirect(new URL('/offer/unlock.html', url), 302);
}
