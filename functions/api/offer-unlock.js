import { createSessionCookie, timingSafeEqual } from '../_lib/session.js';

function redirect(request, path) {
  return Response.redirect(new URL(path, request.url), 302);
}

async function readPassword(request) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => ({}));
    return String((body && body.password) || '');
  }
  const form = await request.formData();
  return String(form.get('password') || '');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const configured = env && env.PRICING_GATE_PASSWORD;
  if (!configured) {
    return redirect(request, '/offer/unlock.html?error=config');
  }

  const password = await readPassword(request);
  if (!timingSafeEqual(password, configured)) {
    return redirect(request, '/offer/unlock.html?error=1');
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/offer/',
      'Set-Cookie': await createSessionCookie(configured),
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  return Response.redirect(new URL('/offer/unlock.html', context.request.url), 302);
}
