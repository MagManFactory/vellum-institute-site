// The California guide is the only public report. Other state previews stay on DEV.
export async function onRequest(context) {
  const path = new URL(context.request.url).pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
  if (path === '/reports' || path === '/reports/california-university-admissions-guide') return context.next();
  return new Response('Not found', {status: 404, headers: {'Content-Type':'text/plain; charset=utf-8', 'X-Robots-Tag':'noindex, nofollow'}});
}
