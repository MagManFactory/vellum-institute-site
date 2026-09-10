export async function onRequest(context) {
  const dest = new URL('/offer/', context.request.url);
  dest.search = new URL(context.request.url).search;
  return Response.redirect(dest, 302);
}
