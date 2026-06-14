# TORO — landing page (clean build)

Thay thế kiến trúc "self-extracting bundler" (1 file > 500 KB, nguyên nhân lỗi
`Cannot read properties of null (reading 'document')` + LCP tệ) bằng các file
tách rời, deploy-ready cho **Cloudflare Pages**.

## Cấu trúc
```
toro-site/
├── index.html          HTML sạch — không bundler, không base64
├── _headers            Security headers (CSP, HSTS, X-Frame-Options…)
├── worker.js           Cloudflare Worker xử lý form (deploy riêng)
├── favicon.svg         Favicon vector
├── favicon-180.png     Apple touch icon
└── assets/
    ├── style.css       Toàn bộ CSS (tokens + landing + components mới)
    └── main.js         JS: form submit + validate + sticky CTA + scroll reveal
```

## Tại sao lỗi cũ biến mất
Lỗi `reading 'document'` đến từ pattern `document.documentElement.replaceWith()`
trong loader của bundler — script chạy trên một tham chiếu window/document đã bị
gỡ (trả về `null`). Khi không còn loader đó, lỗi không thể xảy ra. Đây cũng là
cách Google (web.dev) và Cloudflare Pages khuyến nghị: phục vụ asset tĩnh dưới
dạng file tách, cache được, thay vì một HTML tự giải nén khổng lồ.

## Deploy (3 bước)

### 1. Pages
- Cloudflare Dashboard → Workers & Pages → Create → Pages → **Direct Upload**
- Kéo thả toàn bộ nội dung thư mục `toro-site/` (không nén thư mục cha).
- `_headers` được áp dụng tự động.

### 2. Worker (form)
- Workers & Pages → Create → **Worker** → dán nội dung `worker.js`.
- Settings → Variables → thêm `WEBHOOK_URL` = URL webhook (Make.com / n8n /
  Google Sheets Apps Script / Lark Automation).
- Deploy → copy URL Worker (dạng `https://ten-worker.tài-khoản.workers.dev`).

### 3. Nối form vào Worker
- Mở `assets/main.js`, đặt:
  ```js
  const TORO_ENDPOINT = 'https://ten-worker.tài-khoản.workers.dev';
  ```
- Nếu dùng domain Worker tuỳ chỉnh (không phải `*.workers.dev`), cập nhật
  `connect-src` trong `_headers` cho khớp.

> Trước khi nối endpoint, form vẫn hiển thị trạng thái "Đã nhận thông tin"
> ở phía client để preview không bị vỡ — nhưng **dữ liệu chưa được gửi đi**
> cho tới khi `TORO_ENDPOINT` được đặt.

## Kiểm chứng nhanh (verifiable)
- **CSP / headers:** https://securityheaders.com — kỳ vọng hạng A.
- **Performance / LCP:** PageSpeed Insights (Google) — bundler cũ tải ~500 KB+
  HTML trước khi vẽ; bản này HTML ~29 KB + CSS + font swap.
- **HTML hợp lệ:** https://validator.w3.org/
- **Lưu ý CSP đã sửa so với bản nháp:** `style-src` phải gồm
  `https://fonts.googleapis.com` (Google Fonts trả CSS từ đó), nếu thiếu thì
  font bị chặn.
