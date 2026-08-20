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

## 📤 PUBLIC LÊN EXPO.DEV (EAS)

```bash
npm install -g eas-cli
eas login
eas init                 # gắn projectId thật vào app.json (thay placeholder)
npm run eas:update       # OTA: ai có link là dùng được qua Expo Go
npm run eas:build        # build APK/AAB (cài trực tiếp / lên store)
```
EAS tự nạp biến `EXPO_PUBLIC_*` từ `.env` — không cần cấu hình thêm.

---

## 📁 CẤU TRÚC QUAN TRỌNG
- `app/` — toàn bộ màn hình (file-based routing)
- `services/` — Firebase, Cloudinary, đấu giá, đơn hàng...
- `context/` — AuthContext, CartContext
- `components/` — ProductCard, AuctionCard, Countdown, ProductForm...
- `firestore.rules` — security rules
- `scripts/seed-firestore.js` — seed demo

## ✅ ĐÃ HOÀN THÀNH
Đăng ký (gửi email xác thực) / đăng nhập / đăng xuất · Xác thực email bắt buộc trước khi vào app (màn hình verify-email, gửi lại email được) · Quên mật khẩu (gửi email đặt lại) · Trang chủ (tìm kiếm, danh mục, đấu giá, sản phẩm mới) · Chi tiết sản phẩm · Đăng bán (chọn ảnh → Cloudinary) · Sản phẩm của tôi (sửa/xoá/đã bán) · Giỏ hàng · Checkout COD · Đơn hàng (mua/bán, đổi trạng thái) · Đấu giá đầy đủ · Validation · Loading/Error/Empty · Security Rules · Seed demo.

## ⏳ CHƯA LÀM (ngoài phạm vi)
Thanh toán online thật (chỉ COD) · Chat · Review · Push notification khi có lượt đấu mới.

## 🔧 LƯU Ý KHI GẶP LỖI
- App báo "Chưa cấu hình Firebase/Cloudinary" → `.env` trống → điền key rồi khởi động lại `expo start`.
- Đăng nhập thất bại → kiểm tra đã bật Email/Password trong Firebase Auth.
- Upload ảnh lỗi → kiểm tra Cloudinary preset đã đúng tên và **Unsigned**.