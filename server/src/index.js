/**
 * MiniShop - Server gửi email xác thực qua Brevo.
 *
 * Luồng:
 *   App gọi POST /send-verification-email { email, name }
 *   -> Firebase Admin sinh link xác thực (generateEmailVerificationLink)
 *   -> Gửi email HTML qua Brevo (API v3)
 *
 * Firebase Auth vẫn giữ nguyên: khi user bấm link, Firebase tự đánh dấu
 * emailVerified = true. Server này chỉ thay thế "nơi gửi email".
 *
 * Cấu hình: xem server/.env.example
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

const { buildVerificationHtml, buildPasswordResetHtml, buildAuctionWinHtml } = require('./emailTemplate');

const PORT = process.env.PORT || 4000;

// ---------- Firebase Admin ----------
// Ưu tiên đọc service account từ env var FIREBASE_SERVICE_ACCOUNT_JSON (dễ triển
// khai lên Render/Railway), nếu không có thì đọc từ file.
const SERVER_ROOT = path.resolve(__dirname, '..');
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (e) {
    console.error('✖ FIREBASE_SERVICE_ACCOUNT_JSON không phải JSON hợp lệ:', e.message);
    process.exit(1);
  }
} else {
  const serviceAccountPath = path.resolve(
    SERVER_ROOT,
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './serviceAccountKey.json',
  );
  if (!fs.existsSync(serviceAccountPath)) {
    console.error('✖ Không tìm thấy service account:', serviceAccountPath);
    console.error(
      '  Hãy tải file serviceAccountKey.json về thư mục server/ và điền FIREBASE_SERVICE_ACCOUNT_PATH trong server/.env',
    );
    process.exit(1);
  }
  serviceAccount = require(serviceAccountPath);
}
initializeApp({ credential: cert(serviceAccount) });

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/send-verification-email', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const name = String(req.body?.name || '').trim();

  if (!email) return res.status(400).json({ error: 'Thiếu email.' });

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    return res.status(500).json({ error: 'Server chưa cấu hình Brevo (BREVO_API_KEY / BREVO_SENDER_EMAIL).' });
  }

  try {
    // Firebase Admin sinh link xác thực (email phải tồn tại trong Auth).
    const link = await getAuth().generateEmailVerificationLink(email);

    const payload = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME || 'MiniShop',
      },
      to: [{ email }],
      subject: 'Xác thực tài khoản MiniShop',
      htmlContent: buildVerificationHtml({ name, email, link }),
      textContent: [
        `Chào ${name || email},`,
        '',
        'Cảm ơn bạn đã đăng ký tài khoản MiniShop.',
        'Bấm link sau để xác thực email (copy nguyên dòng, không thêm xuống dòng):',
        '',
        link,
        '',
        'Nếu bạn không đăng ký tài khoản MiniShop, hãy bỏ qua email này.',
      ].join('\n'),
    };

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('[Brevo]', resp.status, detail);
      return res.status(resp.status).json({ error: 'Gửi email thất bại qua Brevo.', detail });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[send-verification-email]', e.message);
    res.status(500).json({ error: e.message || 'Lỗi server.' });
  }
});

app.post('/send-password-reset-email', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const name = String(req.body?.name || '').trim();

  if (!email) return res.status(400).json({ error: 'Thiếu email.' });

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    return res.status(500).json({ error: 'Server chưa cấu hình Brevo (BREVO_API_KEY / BREVO_SENDER_EMAIL).' });
  }

  try {
    const link = await getAuth().generatePasswordResetLink(email);

    const payload = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME || 'MiniShop',
      },
      to: [{ email }],
      subject: 'Đặt lại mật khẩu MiniShop',
      htmlContent: buildPasswordResetHtml({ name, email, link }),
      textContent: [
        `Chào ${name || email},`,
        '',
        'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản MiniShop của bạn.',
        'Bấm link sau để chọn mật khẩu mới (copy nguyên dòng, không thêm xuống dòng):',
        '',
        link,
        '',
        'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.',
      ].join('\n'),
    };

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('[Brevo]', resp.status, detail);
      return res.status(resp.status).json({ error: 'Gửi email thất bại qua Brevo.', detail });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[send-password-reset-email]', e.message);
    res.status(500).json({ error: e.message || 'Lỗi server.' });
  }
});

// Gửi email thông báo thắng đấu giá cho winner.
// App gọi sau khi chốt phiên: endAuction / chuyển quyền mua.
app.post('/send-auction-win-email', async (req, res) => {
  const email = String(req.body?.email || '').trim();
  const name = String(req.body?.name || '').trim();
  const productName = String(req.body?.productName || '').trim();
  const amount = String(req.body?.amount || '').trim();
  const hoursLeft = String(req.body?.hoursLeft || '24 giờ').trim();
  const deepLink = String(req.body?.deepLink || '').trim();

  if (!email) return res.status(400).json({ error: 'Thiếu email.' });

  if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
    return res.status(500).json({ error: 'Server chưa cấu hình Brevo (BREVO_API_KEY / BREVO_SENDER_EMAIL).' });
  }

  try {
    const payload = {
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME || 'MiniShop',
      },
      to: [{ email }],
      subject: `🔨 Bạn đã thắng đấu giá: ${productName || 'Sản phẩm MiniShop'}`,
      htmlContent: buildAuctionWinHtml({ name, email, productName, amount, hoursLeft, deepLink }),
      textContent: [
        `Chào ${name || email},`,
        '',
        'Chúc mừng bạn đã THẮNG ĐẤU GIÁ trên MiniShop!',
        `Sản phẩm: ${productName}`,
        `Giá chốt: ${amount}`,
        '',
        `Vui lòng mở ứng dụng MiniShop trong ${hoursLeft} để điền thông tin nhận hàng và hoàn tất đơn.`,
        'Lưu ý: thắng đấu giá là cam kết mua. Quá hạn, quyền mua sẽ chuyển cho người đặt giá cao nhất tiếp theo.',
        '',
        '— MiniShop',
      ].join('\n'),
    };

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      console.error('[Brevo]', resp.status, detail);
      return res.status(resp.status).json({ error: 'Gửi email thất bại qua Brevo.', detail });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('[send-auction-win-email]', e.message);
    res.status(500).json({ error: e.message || 'Lỗi server.' });
  }
});

app.listen(PORT, () => {
  console.log(`✓ MiniShop mail server chạy tại http://localhost:${PORT}`);
});