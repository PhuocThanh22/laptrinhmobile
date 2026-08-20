# MiniShop — Sàn C2C đồ cũ sinh viên + Đấu giá nhẹ 🛒⚡

Ứng dụng mobile **Mini Marketplace C2C** dành cho sinh viên: mua – bán đồ cũ (sách, giáo trình, điện thoại, laptop, phụ kiện...) giữa người dùng với nhau, kèm chức năng **đấu giá nhẹ**.

Xây dựng bằng **Expo SDK 54 + React Native (TypeScript) + expo-router + Firebase (Auth & Firestore) + Cloudinary**.

---

## 1. Công nghệ & kiến trúc

| Thành phần | Công nghệ |
|---|---|
| Framework | Expo SDK 54, React Native 0.81, TypeScript |
| Điều hướng | expo-router v6 (file-based routing, dựa trên React Navigation) |
| Xác thực | Firebase Authentication (email/password) |
| Dữ liệu | Cloud Firestore |
| **Hình ảnh** | **Cloudinary** — Firestore **chỉ lưu URL**, **KHÔNG dùng Firebase Storage** |
| Chọn ảnh | expo-image-picker |
| Chọn thời gian | @react-native-community/datetimepicker |
| Thông báo | react-native-toast-message |

### Flow hình ảnh (bắt buộc)

```text
Điện thoại → Expo Image Picker → Cloudinary Upload API → Image URL → Firestore
```

### Flow đấu giá

```text
Người bán đăng sản phẩm loại "Đấu giá"
   → giá khởi điểm + bước giá + thời gian kết thúc
Người mua đặt giá (>= giá hiện tại + bước giá)
   → lưu lượt đấu (bidderId, productId, amount, createdAt)
Hết thời gian → tìm bid cao nhất → xác định winner
   → người thắng có thể đặt hàng (checkout)
```

---

## 2. Cấu trúc project

```text
Minishop/
├── app/                        # Màn hình (file-based routing)
│   ├── _layout.tsx             # Root: Auth/Cart provider + Stack.Protected
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx           # Đăng nhập
│   │   ├── register.tsx        # Đăng ký (gửi email xác thực)
│   │   └── forgot-password.tsx # Quên mật khẩu
│   ├── verify-email.tsx        # Màn hình xác thực email (bắt buộc trước khi vào app)
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom tabs: Home, Danh mục, Đăng bán, Giỏ, Cá nhân
│   │   ├── index.tsx           # Trang chủ
│   │   ├── categories.tsx      # Danh mục
│   │   ├── sell.tsx            # Đăng bán (form)
│   │   ├── cart.tsx            # Giỏ hàng
│   │   └── profile.tsx         # Cá nhân (menu)
│   ├── product/
│   │   ├── [id].tsx            # Chi tiết sản phẩm / chi tiết đấu giá
│   │   ├── search.tsx          # Tìm kiếm + lọc
│   │   └── edit/[id].tsx       # Sửa sản phẩm
│   ├── orders/
│   │   ├── checkout.tsx        # Thanh toán (giỏ / mua ngay / thắng đấu giá)
│   │   ├── success.tsx         # Đặt hàng thành công
│   │   └── my-orders.tsx       # Đơn hàng (mua & bán, cập nhật trạng thái)
│   └── profile/
│       ├── my-products.tsx     # Sản phẩm của tôi (sửa/xoá/đã bán/kết thúc đấu giá)
│       ├── my-bids.tsx         # Phiếu đấu giá của tôi
│       └── account.tsx         # Thông tin tài khoản
│
├── components/                 # UI dùng chung
│   ├── ProductCard.tsx         # Card sản phẩm (lưới)
│   ├── AuctionCard.tsx         # Card đấu giá (ngang)
│   ├── ProductForm.tsx         # Form đăng/sửa sản phẩm (kèm chọn ảnh + Cloudinary)
│   ├── Countdown.tsx           # Đếm ngược thời gian đấu giá
│   ├── ImageCarousel.tsx       # Carousel ảnh sản phẩm
│   ├── DateTimeField.tsx       # Chọn ngày giờ (Android/iOS)
│   └── ...                     # Button, Badge, EmptyState, ErrorState, Loading...
│
├── context/
│   ├── AuthContext.tsx         # Trạng thái đăng nhập
│   └── CartContext.tsx         # Giỏ hàng
│
├── services/
│   ├── firebase.ts             # Khởi tạo Firebase
│   ├── authService.ts          # Đăng ký/đăng nhập/đăng xuất
│   ├── productService.ts       # CRUD sản phẩm + bids
│   ├── auctionService.ts       # Đặt giá, kết thúc, xác định winner
│   ├── cartService.ts          # Giỏ hàng
│   ├── orderService.ts         # Đơn hàng
│   ├── cloudinaryService.ts    # Upload ảnh lên Cloudinary (KHÔNG dùng Firebase Storage)
│   └── userService.ts          # Thông tin user
│
├── constants/                  # config (.env), màu sắc, danh mục
├── utils/                      # format tiền, validation, đấu giá
├── types/                      # Kiểu dữ liệu dùng chung
├── scripts/
│   └── seed-firestore.js       # Seed dữ liệu demo (firebase-admin)
├── server/                     # Backend gửi email xác thực qua Brevo (hướng B)
│   ├── src/index.js            # Express: POST /send-verification-email
│   ├── src/emailTemplate.js    # Template email HTML (branded MiniShop)
│   └── .env.example            # FIREBASE_SERVICE_ACCOUNT_PATH, BREVO_API_KEY, ...
├── firestore.rules             # Security Rules
├── .env / .env.example         # KEY (XEM MỤC 5)
├── eas.json                    # Cấu hình EAS (build/update)
└── app.json
```

---

## 3. Các package đã cài

Cài sẵn trong `package.json`:

```bash
# Thư viện Firebase + hỗ trợ
firebase
@react-native-async-storage/async-storage

# Expo modules
expo-image-picker
@react-native-community/datetimepicker

# UI
react-native-toast-message

# (dev) seed dữ liệu demo
firebase-admin
dotenv
```

Nếu mở lại project trên máy khác, chạy:

```bash
npm install
```

---

## 4. Cấu hình Firebase

1. Vào [Firebase Console](https://console.firebase.google.com) → **Add project** (đặt tên ví dụ `minishop`).
2. **Project settings (⚙️) → Your apps → Web** → đăng ký app → copy cấu hình (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId).
3. Bật **Authentication → Sign-in method → Email/Password → Enable**.
4. Bật **Firestore Database → Create database** (chế độ production mode).
5. Deploy **Security Rules** (mục 9) hoặc dán nội dung `firestore.rules`.

> ⚠️ Cấu hình web app ở trên là **công khai** (được nhúng trong app mobile) — đây là thiết kế chuẩn của Firebase. **Tuyệt đối không** đưa service account / API secret vào app.

---

## 5. Cấu hình biến môi trường (quan trọng)

1. Copy file mẫu thành `.env`:

   ```bash
   cp .env.example .env
   ```

2. Điền đầy đủ vào `.env`:

   ```env
   # FIREBASE
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...

   # CLOUDINARY
   EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=...
   ```

3. Khởi động lại `npx expo start`.

### Cấu hình Cloudinary

1. Tạo tài khoản tại [cloudinary.com](https://cloudinary.com) → lấy **Cloud name** (Dashboard).
2. **Settings → Upload → Add upload preset**:
   - Signing Mode: **Unsigned** (quan trọng — để app mobile upload trực tiếp, không cần secret)
   - Lấy tên **upload preset** điền vào `.env`.

> 🔐 `EXPO_PUBLIC_*` là biến public, được nhúng vào bundle. Tuyệt đối **không** điền Cloudinary API Secret hay service account vào `.env`.

> 📌 File `.env` đã được thêm vào `.gitignore` — không đẩy key lên git.

---

## 6. Chạy ứng dụng

### Yêu cầu
- Node 18+ , có **Expo Go** trên điện thoại (hoặc emulator), máy và điện thoại **cùng mạng WiFi**.

### Chạy bằng Expo Go (điện thoại thật)

```bash
npm install
cp .env.example .env     # rồi điền key
npx expo start
```

Mở **Expo Go** trên điện thoại → quét **QR code** hiện trên terminal.

### Chạy trên web (kiểm thử nhanh)

```bash
npx expo start --web
```

### Kiểm tra code

```bash
npm run typecheck   # TypeScript
npm run lint        # ESLint
```

### Server gửi email xác thực (Brevo) — tuỳ chọn

Firebase **khoá cứng** nội dung email xác thực (chống spam) nên không sửa body được qua Console. Để có email đẹp + tránh vào thư rác, app có thể gọi backend `server/` (Express + Firebase Admin + Brevo) để tự gửi:

1. **Chuẩn bị Brevo**: tạo tài khoản [brevo.com](https://www.brevo.com) → **API Keys** lấy key → **Sender** xác thực email người gửi (nên verify domain riêng để không vào spam).
2. **Tải service account** (Firebase Console → Project settings → Service accounts → Generate new private key) lưu vào `server/serviceAccountKey.json`.
3. Cấu hình `server/.env` (copy từ `.env.example`): `FIREBASE_SERVICE_ACCOUNT_PATH`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `PORT`.
4. Chạy server:

   ```bash
   cd server && npm install && npm start    # mặc định cổng 4000
   ```

5. Trong `.env` của app, đặt URL backend:

   ```env
   EXPO_PUBLIC_API_URL=http://localhost:4000
   ```

   > Điện thoại thật (Expo Go) phải dùng IP máy trên cùng WiFi, ví dụ `http://192.168.1.10:4000`.

Khi `EXPO_PUBLIC_API_URL` trống → app **fallback** dùng Firebase gửi email mặc định (không cần server).

---

## 7. Seed dữ liệu demo

Chạy **một lần** để có sẵn dữ liệu trình bày:

1. **Firebase Console → Project settings → Service accounts → Generate new private key** → lưu file `scripts/serviceAccountKey.json`.
2. Thêm vào `.env`:

   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./scripts/serviceAccountKey.json
   ```

3. Chạy:

   ```bash
   npm run seed
   ```

### Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Người bán | `seller@demo.com` | `123456` |
| Người mua | `buyer@demo.com` | `123456` |

Seed tạo sẵn: sản phẩm giá cố định, đấu giá **đang diễn ra** (có lượt đấu), đấu giá **đã kết thúc** (đã xác định winner), sản phẩm **đã bán**, và 1 đơn hàng mẫu.

---

## 8. Quy trình demo chính

### A. Người bán (đăng bán + đấu giá)
```
Đăng nhập seller@demo.com
→ Tab "Đăng bán"
→ Thêm ảnh (thư viện điện thoại → upload Cloudinary)
→ Nhập tên, danh mục, tình trạng, mô tả
→ Chọn "Đấu giá" → giá khởi điểm, bước giá, thời gian kết thúc
→ Đăng bán → vào chi tiết sản phẩm
```

### B. Người mua (đặt giá)
```
Đăng nhập buyer@demo.com
→ Trang chủ → mục "Đang đấu giá" → chọn sản phẩm
→ Xem giá khởi điểm / giá hiện tại / bước giá / countdown / lịch sử đấu
→ Nhập giá (tối thiểu = giá hiện tại + bước giá) → "Đặt giá"
→ Giá hiện tại & lịch sử cập nhật tức thì
```

### C. Kết thúc đấu giá & xác định người thắng
```
Cách 1: chờ hết thời gian → tự động kết thúc
Cách 2 (demo nhanh): vào "Sản phẩm của tôi" → "Kết thúc" phiên đấu
→ hệ thống tìm bid cao nhất → xác định winner
→ Người thắng thấy nút "Đặt hàng ngay" → checkout → tạo đơn
```

### D. Mua hàng giá cố định
```
Trang chủ → sản phẩm giá cố định → "Thêm vào giỏ" hoặc "Mua ngay"
→ Giỏ hàng → "Thanh toán" → nhập thông tin nhận hàng (COD)
→ Đặt hàng → màn hình thành công
→ "Đơn hàng của tôi" xem trạng thái; tab "Đơn tôi bán" cập nhật trạng thái
```

### E. Demo upload ảnh
```
Tab "Đăng bán" → "Thêm ảnh" → chọn ảnh từ thư viện
→ app gọi Cloudinary Upload API (unsigned preset)
→ nhận URL → lưu URL vào Firestore (không lưu file ảnh)
```

---

## 9. Firestore Security Rules

File `firestore.rules` đã chuẩn bị sẵn. Deploy bằng **Firebase CLI**:

```bash
npm i -g firebase-tools
firebase login
firebase init firestore        # chọn project, dùng file firestore.rules
firebase deploy --only firestore:rules
```

Quy tắc chính:
- User chỉ sửa/xoá **sản phẩm của mình**; chỉ sửa **thông tin cá nhân của mình** (name/phone/avatar, không đổi email).
- Sản phẩm: validate dữ liệu khi tạo (ảnh, giá, thời gian đấu giá...). Người bán chỉ sửa các trường cho phép; người đặt giá chỉ được cập nhật `currentPrice/bidsCount`; người mua chỉ được đánh dấu `sold` khi tạo đơn (transaction); phiên đấu hết giờ ai cũng kết thúc được, còn phiên chưa hết giờ chỉ chủ hàng kết thúc.
- Đặt giá phải: đăng nhập, **không phải chủ sản phẩm**, **amount ≥ giá hiện tại + bước giá**, **trong thời gian đấu**, sản phẩm còn `auction_active`; lượt đấu **bất biến** (không sửa/xoá).
- Đơn hàng: người mua tạo đơn cho mình (COD, dữ liệu hợp lệ), người bán chỉ cập nhật **trạng thái** (`status`), không đổi thông tin khác.
- Không cho xoá users/orders/bids.

> 📌 Giới hạn: Firestore Rules không duyệt được từng item trong mảng — các ràng buộc "sản phẩm còn bán / đúng người thắng đấu giá" được đảm bảo bằng **transaction** ở tầng app (`services/orderService`). Để chặn tuyệt đối kẻ ghi trực tiếp qua SDK, cần thêm Cloud Function/backend xác thực đơn hàng.

---

## 10. Deploy & public lên expo.dev (EAS) 🚀

`eas.json`, `app.json` (extra.eas.projectId) và scripts đã chuẩn bị sẵn. Các biến `EXPO_PUBLIC_*` trong `.env` được **EAS tự nạp** khi build/update — không cần cấu hình thêm.

### 10.1. Cài eas-cli & đăng nhập

```bash
npm install -g eas-cli
eas login
```

### 10.2. Gắn project Expo (chỉ 1 lần)

```bash
eas init
```

Lệnh này sẽ tự điền `projectId` thật vào `app.json` (thay chỗ `THAY-THE-BANG-EAS-PROJECT-ID`).

### 10.3. Public OTA qua Expo Go / expo.dev

```bash
npm run eas:update        # = eas update --channel production
```

Sau khi chạy, mở app qua **Expo Go** → mọi người quét link/QR do `eas update` in ra là dùng được ngay (không cần build APK).

> Ứng dụng phải được mở **từ phiên bản đã build cùng projectId** — với Expo Go, `eas update` tự xử lý.

### 10.4. Build APK / AAB (đăng lên cửa hàng hoặc cài trực tiếp)

```bash
npm run eas:build          # chạy eas build (chọn nền tảng)
```

- Build **preview** → nhận link tải APK cài trực tiếp lên điện thoại.
- Build **production** → AAB để đăng Google Play / App Store.
- Sau khi cài APK, các bản update tiếp theo vẫn dùng `eas update` để đẩy OTA.

> 📌 Vì Firebase `AuthDomain` mặc định chỉ cho phép các origin của Firebase, khi chạy bản build không phải từ Expo Go, có thể cần **bỏ chọn "Authorized domains"** hoặc thêm domain của bản update — Firebase Console → Authentication → Settings → Authorized domains.

---

## 11. Chức năng đã hoàn thành ✅

- [x] Đăng ký / Đăng nhập / Đăng xuất (Firebase Auth + users)
- [x] Đăng ký gửi **email xác thực** — user phải xác thực email mới vào được app (màn hình `verify-email`, gửi lại email được)
- [x] Email xác thực **HTML đẹp qua Brevo** (`server/`) — fallback Firebase khi không cấu hình `EXPO_PUBLIC_API_URL`
- [x] **Quên mật khẩu** — gửi email đặt lại mật khẩu (Firebase Password Reset)
- [x] Trang chủ: tìm kiếm, danh mục, đấu giá nổi bật, sản phẩm mới
- [x] Danh sách sản phẩm (lưới), phân loại theo danh mục, lọc hình thức bán
- [x] Tìm kiếm theo tên
- [x] Chi tiết sản phẩm: carousel ảnh, giá, mô tả, người bán, ngày đăng
- [x] Đăng bán: chọn nhiều ảnh từ thư viện → **Cloudinary** → lưu URL vào Firestore
- [x] Sản phẩm của tôi: xem, sửa, xóa, đánh dấu đã bán, kết thúc đấu giá
- [x] Giỏ hàng (thêm/xoá/đổi số lượng/tổng tiền) — không cho thêm sản phẩm đấu giá vào giỏ
- [x] Checkout: thông tin người nhận + COD → tạo đơn, màn hình thành công
- [x] Đơn hàng của tôi: danh sách mua/bán, cập nhật trạng thái (pending→confirmed→shipping→completed)
- [x] Đấu giá: giá khởi điểm, bước giá, giá hiện tại, countdown, lịch sử đấu
- [x] Quy tắc đấu giá: cần đăng nhập, không tự đấu, giá ≥ hiện tại + bước, không đấu sau khi hết giờ
- [x] Tự xác định người thắng khi kết thúc → người thắng checkout được
- [x] Validation toàn bộ form + thông báo lỗi thân thiện
- [x] Loading / error / empty state ở mọi màn hình
- [x] Firestore Security Rules + dữ liệu demo (seed script)

## Chức năng ngoài phạm vi (chưa làm)

- Thanh toán online thật (chỉ COD).
- Chat / tin nhắn giữa người mua và bán.
- Đánh giá (review) sản phẩm.
- Thông báo push khi có lượt đấu mới.

---

## 12. Lưu ý bảo mật

- Không đưa **service account**, **Cloudinary API secret**, **API key private** vào app.
- `.env` đã bị gitignore.
- Firestore Rules hạn chế sửa/xoá dữ liệu không thuộc quyền sở hữu.
- Lượt đấu giá bất biến (không sửa/xoá được) để đảm bảo tính công bằng.

---

Chúc bạn demo thành công! 🎉