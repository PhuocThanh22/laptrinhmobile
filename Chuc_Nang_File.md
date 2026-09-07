# FILE MAP - MiniShop

> Bản đồ chức năng từng file trong project.

---

## Cấu hình gốc

| File | Chức năng |
|---|---|
| `app.json` | Cấu hình Expo: tên, icon, splash, bundle ID, permissions, plugins |
| `package.json` | Dependencies + scripts (`seed`, `eas:update`, `lint`, `typecheck`...) |
| `eas.json` | Cấu hình EAS Build profiles (development/preview/production) + channels OTA |
| `tsconfig.json` | TypeScript strict mode, alias `@/*` trỏ root |
| `metro.config.js` | Metro bundler: mock `react-native-maps` + `react-native-webview` trên web |
| `eslint.config.js` | ESLint dùng `eslint-config-expo` |
| `.env.example` | Mẫu biến môi trường: Firebase, Cloudinary, VietQR, Brevo, Google client IDs |
| `firestore.rules` | Security Rules cho users/products/bids/orders/reviews/carts/conversations |
| `google-services.json` | Cấu hình Firebase cho Android |

---

## `app/` - Màn hình (file-based routing)

### Root

| File | Chức năng |
|---|---|
| `app/_layout.tsx` | Root layout: AuthProvider + CartProvider + Stack.Protected bảo vệ màn đã đăng nhập |
| `app/verify-email.tsx` | Màn xác thực email: gửi lại email, kiểm tra trạng thái, bắt buộc xác thực trước khi vào app |

### `(auth)/` - Xác thực

| File | Chức năng |
|---|---|
| `app/(auth)/_layout.tsx` | Layout nhóm màn auth (login/register/forgot-password) |
| `app/(auth)/login.tsx` | Đăng nhập: email/password + Google OAuth |
| `app/(auth)/register.tsx` | Đăng ký: tạo tài khoản + gửi email xác thực + Google sign-up |
| `app/(auth)/forgot-password.tsx` | Quên mật khẩu: nhập email -> gửi link đặt lại |

### `(tabs)/` - Tab bar chính

| File | Chức năng |
|---|---|
| `app/(tabs)/_layout.tsx` | Bottom tabs: Trang chủ, Danh mục, Đăng bán, Đơn hàng, Cá nhân (icon Lucide + haptic) |
| `app/(tabs)/index.tsx` | Trang chủ: sản phẩm nổi bật, danh mục, đấu giá đang diễn ra, tìm kiếm nhanh |
| `app/(tabs)/categories.tsx` | Danh mục: lọc theo danh mục + loại bán (giá cố định/đấu giá) + tìm kiếm |
| `app/(tabs)/sell.tsx` | Đăng bán: gọi ProductForm để tạo sản phẩm mới |
| `app/(tabs)/orders.tsx` | Tab đơn hàng: đơn mua (buy) + đơn bán (sell), cập nhật trạng thái |
| `app/(tabs)/profile.tsx` | Hồ sơ: thông tin user, thống kê (sản phẩm/đơn/đấu giá), menu chức năng |

### `product/` - Sản phẩm

| File | Chức năng |
|---|---|
| `app/product/[id].tsx` | Chi tiết sản phẩm (lớn nhất ~924 dòng): carousel ảnh/video, đấu giá, thêm giỏ, chat người bán, đánh giá |
| `app/product/search.tsx` | Tìm kiếm: theo từ khóa + lọc danh mục + loại bán |
| `app/product/edit/[id].tsx` | Sửa sản phẩm: load dữ liệu cũ, dùng ProductForm cập nhật |

### `orders/` - Đơn hàng

| File | Chức năng |
|---|---|
| `app/orders/checkout.tsx` | Thanh toán: nhập tên/SĐT/địa chỉ, chọn COD hoặc VietQR |
| `app/orders/payment.tsx` | Thanh toán VietQR: hiển thị mã QR, đếm ngược 15 phút, xác nhận |
| `app/orders/success.tsx` | Đặt hàng thành công: mã đơn + tổng tiền |
| `app/orders/my-orders.tsx` | Danh sách đơn: theo vai trò mua/bán, trạng thái, nút chat |
| `app/orders/[id].tsx` | Chi tiết đơn hàng: items, trạng thái, thanh toán |
| `app/orders/review.tsx` | Đánh giá sản phẩm: rating 1-5 sao + nhận xét (chỉ đơn completed) |

### `chat/` - Tin nhắn

| File | Chức năng |
|---|---|
| `app/chat/index.tsx` | Danh sách cuộc hội thoại: realtime Firestore, hiển thị tin nhắn cuối |
| `app/chat/[id].tsx` | Chat 1-1: gửi/nhận tin nhắn realtime, KeyboardAvoidingView |

### `profile/` - Quản lý cá nhân

| File | Chức năng |
|---|---|
| `app/profile/my-products.tsx` | Sản phẩm của tôi: sửa, xoá, đánh dấu đã bán, kết thúc đấu giá |
| `app/profile/my-bids.tsx` | Phiếu đấu giá: danh sách lượt đặt của user |
| `app/profile/account.tsx` | Sửa thông tin: tên, SĐT, avatar, vị trí |

---

## `components/` - UI components

### Core UI

| File | Chức năng |
|---|---|
| `Button.tsx` | Nút bấm: primary/outline/danger/success/ghost + loading state |
| `TextField.tsx` | Ô nhập liệu: label, error, keyboard type, secure text, multiline |
| `Badge.tsx` | Label nhỏ với màu (trạng thái sản phẩm, đơn hàng) |
| `Screen.tsx` | Wrapper SafeAreaView nền trắng cho mỗi màn hình |
| `Segmented.tsx` | Nút switch phân đoạn (tab ngang) |
| `SearchBar.tsx` | Ô tìm kiếm icon + nút xoá |
| `SectionHeader.tsx` | Header section: title trái + link phải |
| `QuantityStepper.tsx` | Nút +/- điều chỉnh số lượng |
| `RatingStars.tsx` | Hiển thị/chọn sao đánh giá 1-5 |
| `Skeleton.tsx` | Skeleton loading (ProductGrid, ListRow, OrderCard, Detail) |
| `Loading.tsx` | Màn loading spinner + thông điệp vui |
| `EmptyState.tsx` | Màn rỗng: icon + title + message + nút |
| `ErrorState.tsx` | Màn lỗi: icon + message + "Thử lại" |
| `CenterMessage.tsx` | Modal thông báo giữa màn (success/error/info) |

### Product-related

| File | Chức năng |
|---|---|
| `ProductCard.tsx` | Card sản phẩm: ảnh, giá, countdown, tình trạng, vị trí |
| `AuctionCard.tsx` | Card đấu giá: ảnh, giá hiện tại, countdown, vị trí |
| `ProductForm.tsx` | Form đăng/sửa sản phẩm: upload ảnh/video Cloudinary, chọn loại bán, giá, đấu giá (~583 dòng) |
| `ImageCarousel.tsx` | Carousel ảnh sản phẩm ngang, indicator chấm tròn |
| `MediaCarousel.tsx` | Carousel ảnh + video kiểu Shopee, video tự dừng khi vuốt |
| `Countdown.tsx` | Đếm ngược giờ:phút:giây đến hết đấu giá |
| `DateTimeField.tsx` | Chọn ngày giờ kết thúc đấu giá (iOS picker, Android 2 bước) |

### Navigation & Layout

| File | Chức năng |
|---|---|
| `AppHeader.tsx` | Header: nút back + tiêu đề + subtitle + nút phải |
| `CartButton.tsx` | Nút giỏ hàng icon + badge số lượng |
| `CategoryChip.tsx` | Chip danh mục: icon + label + active state |
| `LocationPicker.tsx` | Modal chọn vị trí: map WebView + expo-location |

### Media & Display

| File | Chức năng |
|---|---|
| `Avatar.tsx` | Ảnh đại diện hoặc chữ cái đầu (initials) |
| `MessageCenter.tsx` | Hệ thống thông báo popup global (thay Toast) |
| `haptic-tab.tsx` | BottomTabBarButton có haptic feedback trên iOS |
| `external-link.tsx` | Link mở URL ngoài bằng in-app browser |
| `hello-wave.tsx` | Emoji wave animation (template) |
| `parallax-scroll-view.tsx` | ScrollView header parallax (template) |

### Template (Expo default)

| File | Chức năng |
|---|---|
| `themed-text.tsx` | Text theo theme light/dark |
| `themed-view.tsx` | View theo theme light/dark |
| `ui/collapsible.tsx` | Collapsible component |
| `ui/icon-symbol.ios.tsx` | SF Symbol cho iOS |
| `ui/icon-symbol.tsx` | MaterialIcons fallback Android/web |

---

## `context/` - React Context

| File | Chức năng |
|---|---|
| `AuthContext.tsx` | Xác thực: signIn/signUp/signOut, Google sign-in, emailVerified, updateProfile, resendVerificationEmail |
| `CartContext.tsx` | Giỏ hàng: items, totalAmount, totalItems, addItem, changeQuantity, removeItem, clear |

---

## `services/` - Service layer

| File | Chức năng |
|---|---|
| `firebase.ts` | Khởi tạo Firebase app/auth/db + AsyncStorage persistence |
| `authService.ts` | Register, login, Google credential, logout, email verification (Brevo/Firebase), reset password, profile sync |
| `productService.ts` | CRUD sản phẩm: getAll, getById, create, update, delete, getBySeller, markAsSold |
| `auctionService.ts` | Đấu giá: placeBid, getBids, endAuction, endExpiredAuctions, xác định winner, gửi email thắng |
| `cartService.ts` | Giỏ hàng Firestore: get, add, update, remove, clear |
| `orderService.ts` | Đơn hàng: createOrder (COD/VietQR), getById, getMyOrders, getBySeller, updateStatus |
| `chatService.ts` | Chat 1-1: getOrCreateConversation, sendMessage, subscribeMessages, subscribeConversations |
| `cloudinaryService.ts` | Upload ảnh + video lên Cloudinary (unsigned preset) -> URL |
| `mailService.ts` | Gọi mail server gửi email thắng đấu giá (fire-and-forget) |
| `notificationService.ts` | Local push notification: setup kênh, permission, gửi (chỉ dev build) |
| `paymentService.ts` | VietQR: build URL ảnh QR, confirm, mark failed, simulate check |
| `reviewService.ts` | Đánh giá: createReview (chỉ đơn completed), getByProduct, getByOrders, calcStats |
| `userService.ts` | User Firestore: getUsersByIds, getSingleUser |

---

## `constants/` - Cấu hình

| File | Chức năng |
|---|---|
| `config.ts` | Biến môi trường tập trung: Firebase, Cloudinary, Google, VietQR, API URL |
| `colors.ts` | Bảng màu: primary cam, accent vàng đấu giá, success, danger... |
| `categories.ts` | Danh sách danh mục (8 loại), tình trạng, loại bán, nhãn trạng thái đơn |
| `theme.ts` | Theme light/dark + fonts (template) |

---

## `utils/` - Tiện ích

| File | Chức năng |
|---|---|
| `validation.ts` | Validate: email, register, login, product form, bid, order |
| `format.ts` | Định dạng: formatCurrency (VND), formatDateTime, formatDate, formatCountdown |
| `errors.ts` | Bóc lỗi Firebase/Cloudinary -> thông báo tiếng Việt |
| `auction.ts` | Tiện ích đấu giá: getRemainingMs, isAuctionActive, isEnded, getMinNextBid, isBidValid |
| `navigation.ts` | `safeBack()` - quay lại an toàn, fallback về home |

---

## `types/` - Kiểu dữ liệu

| File | Chức năng |
|---|---|
| `types/index.ts` | Product, Bid, CartItem/Document, Order, OrderItem, OrderStatus, PaymentMethod/Status, Review, Location, AppUser, SaleType, ProductStatus |

---

## `hooks/` - Custom hooks

| File | Chức năng |
|---|---|
| `usePushNotifications.ts` | Bắn local notification: tin nhắn mới, đơn đổi trạng thái, bị vượt giá |
| `use-theme-color.ts` | Lấy màu theo theme light/dark (template) |
| `use-color-scheme.ts` | Re-export `useColorScheme` |
| `use-color-scheme.web.ts` | Web: đợi hydration rồi trả colorScheme |

---

## `scripts/` - Seed & Deploy

| File | Chức năng |
|---|---|
| `seed-firestore.js` | Seed dữ liệu demo: 2 TK (seller/buyer) + sản phẩm + đơn hàng (`npm run seed`) |
| `seed-50-products.js` | Seed 50 sản phẩm mẫu (`npm run seed:50`) |
| `deploy-rules.js` | Deploy `firestore.rules` lên Firebase bằng Rules API |
| `reset-project.js` | Reset project về trạng thái trống (template) |

---

## `server/` - Backend mail (Express)

| File | Chức năng |
|---|---|
| `src/index.js` | Server Express: endpoints `/send-verification-email`, `/send-password-reset-email`, `/send-auction-win-email` |
| `src/emailTemplate.js` | Template HTML email: xác thực, đặt lại mật khẩu, thắng đấu giá |
| `package.json` | Dependencies: express, cors, dotenv, firebase-admin |
| `.env.example` | Mẫu env: Firebase service account, Brevo API key, sender email |
| `start.bat` | Script chạy server Windows |

---

## `__mocks__/` - Mock cho web

| File | Chức năng |
|---|---|
| `react-native-webview/index.js` | Mock WebView = View đơn giản |
| `react-native-maps/index.js` | Mock MapView + Marker = View |

---

**Tổng:** ~100 files | 28 screens | 38 components | 13 services | 2 contexts | 4 constants | 5 utils | 1 types | 4 hooks | 5 scripts | 8 backend
