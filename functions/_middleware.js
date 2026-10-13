// Cloudflare Pages Edge Middleware - TOROqc
// Implements 301 Permanent Redirect from toroqc.vn / www.toroqc.vn to https://toroqc.com

export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Đánh chặn toàn bộ request đến toroqc.vn và www.toroqc.vn ở tầng biên cao nhất
  if (url.hostname === "toroqc.vn" || url.hostname === "www.toroqc.vn") {
    return Response.redirect(`https://toroqc.com${url.pathname}${url.search}`, 301);
  }

  // Request hợp lệ đến toroqc.com -> phục vụ nội dung trang
  return context.next();
}
