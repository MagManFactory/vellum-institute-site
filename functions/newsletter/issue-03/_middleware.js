import {
  applyIssueAccessHtml,
  decideIssueAccess,
  SUBSCRIBER_COOKIE,
  SUBSCRIBER_MAX_AGE
} from '../../../js/brief-access.mjs';

function isAccessPath(pathname) {
  return pathname.includes('/newsletter/issue-03/access');
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const response = await context.next();
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Vary', 'Cookie');

  if (isAccessPath(url.pathname)) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    const secure = url.protocol === 'https:' ? '; Secure' : '';
    headers.append(
      'Set-Cookie',
      `${SUBSCRIBER_COOKIE}=1; Path=/; Max-Age=${SUBSCRIBER_MAX_AGE}; SameSite=Lax${secure}`
    );
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }

  const html = await response.text();
  const decision = decideIssueAccess({
    cookieHeader: context.request.headers.get('cookie') || '',
    now: new Date()
  });
  const body = applyIssueAccessHtml(html, decision);
  if (!decision.publicNow) headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
