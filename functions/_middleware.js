// Cloudflare Pages Edge Middleware - TOROqc
// Implements 301 Permanent Redirect from toroqc.vn / www.toroqc.vn to https://toroqc.com

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If request arrives at toroqc.vn or www.toroqc.vn -> 301 Redirect to https://toroqc.com
  if (url.hostname === "toroqc.vn" || url.hostname === "www.toroqc.vn") {
    url.hostname = "toroqc.com";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  // Normal request to toroqc.com -> serve page
  return context.next();
}
