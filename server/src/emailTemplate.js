/**
 * Template email MiniShop (HTML inline-style, tương thích Gmail/Outlook).
 */

function buildVerificationHtml({ name, email, link }) {
  return buildEmailShell({
    name,
    email,
    title: 'Xác thực email của bạn',
    intro: `Cảm ơn bạn đã đăng ký tài khoản <strong>MiniShop</strong>.
      Bấm vào nút bên dưới để xác thực email và hoàn tất đăng ký:`,
    buttonLabel: 'Xác thực email ngay',
    fallbackNote: 'Nếu nút trên không bấm được, hãy copy link dưới đây vào trình duyệt:',
    footerNote: 'Nếu bạn không đăng ký tài khoản MiniShop, hãy bỏ qua email này.',
    link,
  });
}

function buildPasswordResetHtml({ name, email, link }) {
  return buildEmailShell({
    name,
    email,
    title: 'Đặt lại mật khẩu của bạn',
    intro: `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>MiniShop</strong> của bạn.
      Bấm vào nút bên dưới để chọn mật khẩu mới. Link có hiệu lực trong 1 giờ:`,
    buttonLabel: 'Đặt lại mật khẩu',
    fallbackNote: 'Nếu nút trên không bấm được, hãy copy link dưới đây vào trình duyệt:',
    footerNote: 'Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.',
    link,
  });
}

function buildEmailShell({ name, email, title, intro, buttonLabel, fallbackNote, footerNote, link }) {
  const displayName = name || email.split('@')[0] || 'bạn';

  return `<!DOCTYPE html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#F5F6FA;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F6FA;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #ECEEF3;">
            <!-- Header -->
            <tr>
              <td style="background-color:#FF5A1F;padding:28px 24px;text-align:center;">
                <div style="font-size:20px;font-weight:bold;color:#FFFFFF;">🛒 MiniShop</div>
                <div style="font-size:12px;color:#FFE9E0;margin-top:4px;">Sàn đồ cũ sinh viên · Đấu giá nhẹ</div>
              </td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:28px 24px;color:#1A1D26;">
                <h1 style="font-size:18px;margin:0 0 12px;color:#1A1D26;">${escapeHtml(title)}</h1>
                <p style="font-size:14px;line-height:1.6;margin:0 0 16px;color:#444;">
                  Chào <strong>${escapeHtml(displayName)}</strong>,
                </p>
                <p style="font-size:14px;line-height:1.6;margin:0 0 20px;color:#444;">
                  ${intro}
                </p>
                <!-- Nút hành động -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                  <tr>
                    <td align="center" style="border-radius:10px;">
                      <a href="${escapeHtml(link)}" style="display:inline-block;background-color:#FF5A1F;color:#FFFFFF;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:10px;text-decoration:none;">${escapeHtml(buttonLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="font-size:13px;line-height:1.6;margin:0 0 12px;color:#8A8F9C;">
                  ${escapeHtml(fallbackNote)}
                </p>
                <p style="font-size:12px;line-height:1.5;margin:0 0 20px;color:#8A8F9C;word-break:break-all;">
                  ${escapeHtml(link)}
                </p>
                <p style="font-size:13px;line-height:1.6;margin:0;color:#8A8F9C;">
                  ${escapeHtml(footerNote)}
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background-color:#F5F6FA;padding:16px 24px;text-align:center;color:#8A8F9C;font-size:12px;">
                MiniShop · Email gửi tự động, không cần phản hồi.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

module.exports = { buildVerificationHtml, buildPasswordResetHtml };