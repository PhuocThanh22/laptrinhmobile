# 📒 GHI CHÚ - MiniShop (Đồ án Mobile)

> File ghi chú nhanh. Xem `README.md` để có hướng dẫn chi tiết nhất.

## 🎯 Ứng dụng là gì
Sàn mua bán đồ cũ C2C cho sinh viên + chức năng **đấu giá nhẹ**.
Expo SDK 54 · React Native (TypeScript) · expo-router · Firebase (Auth + Firestore) · Cloudinary.

## ⚠️ ĐIỀU KHOẢN BẮT BUỘC
- **KHÔNG dùng Firebase Storage.** Ảnh upload lên **Cloudinary**, Firestore chỉ lưu **URL**.
- Flow: `Điện thoại → Expo Image Picker → Cloudinary → Image URL → Firestore`.
- Không đưa key bí mật (service account, API secret) vào app.

---

## 🔑 CẤU HÌNH KEY (làm trước khi chạy)

### 1. File `.env` (đã tạo sẵn, cần điền)
```
# Firebase - Firebase Console → Project settings → Web app
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# Cloudinary - cloudinary.com → Dashboard (cloud name) + Settings→Upload→Unsigned preset
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```
- Cloudinary preset phải chọn **Signing Mode = Unsigned**.
- `.env` đã nằm trong `.gitignore` (không bị đẩy lên git).

### 2. Firebase cần bật
- Authentication → Sign-in method → **Email/Password**
- Firestore → Create database (production mode)
- Deploy `firestore.rules` (đã có sẵn) hoặc dán thủ công.

---

## 🚀 CHẠY APP

| Lệnh | Mục đích |
|---|---|
| `npm install` | Cài package |
| `cp .env.example .env` | Tạo file env (điền key sau) |
| `npx expo start` | Chạy, quét QR bằng **Expo Go** |
| `npx expo start --web` | Chạy trên web |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run lint` | Kiểm tra code style |

Yêu cầu: máy + điện thoại cùng WiFi, điện thoại có **Expo Go**.

---

## 🧪 DỮ LIỆU DEMO (tài khoản + seed)

Tài khoản đăng nhập sau khi seed:
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Người bán | `seller@demo.com` | `123456` |
| Người mua | `buyer@demo.com` | `123456` |

Chạy seed:
1. Firebase Console → Project settings → **Service accounts** → Generate new private key → lưu vào `scripts/serviceAccountKey.json`
2. Thêm vào `.env`: `FIREBASE_SERVICE_ACCOUNT_PATH=./scripts/serviceAccountKey.json`
3. `npm run seed`

Seed tạo: sản phẩm giá cố định · đấu giá đang diễn ra (có lượt đấu) · đấu giá đã kết thúc (có winner) · đã bán · đơn hàng mẫu.

---

## 🎬 QUY TRÌNH DEMO ĐẤU GIÁ (trọng tâm)

1. Đăng nhập `seller@demo.com` → Tab **Đăng bán** → chọn **Đấu giá** → nhập giá khởi điểm, bước giá, thời gian kết thúc → đăng.
2. Đăng nhập `buyer@demo.com` → Trang chủ → mục **Đang đấu giá** → **Đặt giá** (tối thiểu = giá hiện tại + bước giá) → giá hiện tại & lịch sử cập nhật.
3. Kết thúc (chờ hết giờ, hoặc vào **Sản phẩm của tôi → Kết thúc**) → hệ thống tìm bid cao nhất → xác định winner.
4. Người thắng bấm **Đặt hàng ngay** → checkout COD → tạo đơn.

**Quy tắc đấu giá đã code:**
- Phải đăng nhập · không tự đấu sản phẩm mình · giá ≥ hiện tại + bước giá · không đấu sau khi hết giờ · lưu đủ bidderId/productId/amount/createdAt · tự xác định winner.

---

## 📤 CÁCH ĐẨY PROJECT LÊN EXPO.DEV (EAS) — HƯỚNG DẪN CHI TIẾT

> **Mục đích:** tạo project trên expo.dev và đẩy app lên để mọi người dùng được qua **Expo Go** (OTA) hoặc build APK/AAB.
> Trạng thái hiện tại: `eas-cli` **chưa cài**, `app.json` `extra.eas.projectId` đang là placeholder `THAY-THE-BANG-EAS-PROJECT-ID`.

### Bước 0. Cài eas-cli (một lần)
```bash
npm install -g eas-cli
```
Kiểm tra: `eas --version`

### Bước 1. Đăng nhập tài khoản Expo
```bash
eas login
```
→ Nhập email/mật khẩu tài khoản **expo.dev** của bạn.
(Nếu dùng CI/token: export token rồi `eas whoami` để kiểm tra.)

### Bước 2. Tạo project trên expo.dev + gắn projectId (chạy 1 lần)
```bash
eas init
```
→ Tạo project Expo trên cloud và **tự điền** `projectId` thật vào `app.json`
(thay placeholder `THAY-THE-BANG-EAS-PROJECT-ID`).
> ⚠️ Lệnh này sẽ **ghi đổi file `app.json`** — kiểm tra lại sau khi chạy.

### Bước 3. Đẩy bản cập nhật OTA (dùng qua Expo Go) — cách nhanh nhất
```bash
npm run eas:update        # = eas update --channel production
```
→ Kết quả in ra **link / QR**: ai mở bằng **Expo Go** là dùng được ngay, không cần build.
> Các biến `EXPO_PUBLIC_*` trong `.env` được EAS **tự nạp** — không cần cấu hình thêm.

### Bước 4 (tùy chọn). Build APK/AAB
```bash
npm run eas:build
```
- Chọn **preview** → nhận link tải APK cài trực tiếp.
- Chọn **production** → build AAB đăng Google Play / App Store.
- Sau khi cài APK, bản update tiếp theo vẫn dùng `npm run eas:update` (OTA).

### Lưu ý khi build (không phải Expo Go)
Firebase `AuthDomain` mặc định chỉ cho phép origin của Firebase. Khi chạy bản build
(không phải Expo Go), vào **Firebase Console → Authentication → Settings → Authorized domains**
để thêm domain của bản update (hoặc bỏ chọn giới hạn).

---

## 📁 CẤU TRÚC QUAN TRỌNG
- `app/` — toàn bộ màn hình (file-based routing)
- `services/` — Firebase, Cloudinary, đấu giá, đơn hàng...
- `context/` — AuthContext, CartContext
- `components/` — ProductCard, AuctionCard, Countdown, ProductForm...
- `server/` — backend gửi email xác thực qua **Brevo** (Express + Firebase Admin)
- `firestore.rules` — security rules
- `scripts/seed-firestore.js` — seed demo

## ✉️ EMAIL XÁC THỰC QUA BREVO (server/)
Firebase khoá cứng body email xác thực (chống spam) — sửa qua Console không được.
Để email đẹp + không vào thư rác, dùng server/ gửi mail:
1. Brevo: tạo account → API Keys → xác thực Sender (nên verify domain riêng).
2. Tải service account → lưu `server/serviceAccountKey.json`.
3. Copy `server/.env.example` → `server/.env` (điền BREVO_API_KEY, BREVO_SENDER_EMAIL...).
4. `cd server && npm install && npm start` (cổng 4000).
5. App `.env`: `EXPO_PUBLIC_API_URL=http://<IP-máy>:4000` (điện thoại thật dùng IP LAN; để trống → fallback Firebase gửi email mặc định).

## ✅ ĐÃ HOÀN THÀNH
Đăng ký (gửi email xác thực, có thể qua Brevo HTML) / đăng nhập / đăng xuất · Xác thực email bắt buộc trước khi vào app (màn hình verify-email, gửi lại email được) · Quên mật khẩu (gửi email đặt lại) · Trang chủ (tìm kiếm, danh mục, đấu giá, sản phẩm mới) · Chi tiết sản phẩm · Đăng bán (chọn ảnh → Cloudinary) · Sản phẩm của tôi (sửa/xoá/đã bán) · Giỏ hàng · Checkout (COD + VietQR) · Đơn hàng (mua/bán, đổi trạng thái) · **Chat 1-1 + theo sản phẩm (real-time)** · **Đánh giá sản phẩm 1-5 sao (chỉ đơn completed)** · **Push notification local (tin nhắn mới, đơn đổi trạng thái, bị vượt giá)** · Đấu giá đầy đủ (bao gồm winner hạn 24h + chuyển quyền mua) · Validation · Loading/Error/Empty · Security Rules · Seed demo.

## ⏳ NGOÀI PHẠM VI (chưa làm)
- Thanh toán online **thật**: chỉ thể hiện COD và **VietQR giả lập** (tạo ảnh QR, “Tôi đã chuyển khoản” để mô phỏng xác nhận thanh toán).
- Push notification là **local** (trên thiết bị), chưa gửi **remote** push server→client.

## 🔧 LƯU Ý KHI GẶP LỖI
- App báo "Chưa cấu hình Firebase/Cloudinary" → `.env` trống → điền key rồi khởi động lại `expo start`.
- Đăng nhập thất bại → kiểm tra đã bật Email/Password trong Firebase Auth.
- Upload ảnh lỗi → kiểm tra Cloudinary preset đã đúng tên và **Unsigned**.