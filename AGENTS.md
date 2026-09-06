# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Project notes (state: 5/9/2026)

### OTA (expo-updates)
- OTA đã bật trong mọi build: `expo-updates` dependency, `updates.url` + `runtimeVersion.appVersion` (hiện 1.0.0), các profile có `channel` (preview/production).
- APK preview mới nhất: EAS build `303f97ee` (commit `293c868`), tải qua `eas build:list` hoặc dashboard Expo.
- Chỉ push OTA khi thay đổi **JS thuần**:
  - Preview: `eas update --channel preview --environment preview`
  - Production: `npm run eas:update` (= `eas update --channel production`)
- Thay đổi **native** (package name, module native, permissions, icon/splash) phải build lại: `eas build -p android --profile preview` (or `--profile production`).

### Server mail (server/) — Render
- URL: `https://minishop-mail-server.onrender.com` (web service `minishop-mail-server`, free tier).
- Free tier spin-down sau ~30 phút không hoạt động → request đầu có thể chậm ~50s.
- Env trên Render: `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (`0023412290@student.dthu.edu.vn`), `BREVO_SENDER_NAME`, `FIREBASE_SERVICE_ACCOUNT_JSON` (service account project `mini-shop-d981c`), `NODE_VERSION`.
- App gửi mail qua `POST {apiUrl}/send-verification-email`, `/send-password-reset-email`, `/send-auction-win-email`; nếu `EXPO_PUBLIC_API_URL` rỗng → fallback Firebase email mặc định.
- `EXPO_PUBLIC_API_URL` đã đặt = URL Render trong EAS env (preview + production). OTA sau khi SỬA env phải được push lại để bake vào bundle.

### Google sign-in
- Dùng `Google.useIdTokenAuthRequest({ clientId: googleWebClientId })` (login.tsx / register.tsx) -> `GoogleAuthProvider.credential(idToken)`.
- EAS env đã có `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- Cần kiểm tra tay: Web OAuth client `781177173183-kjb5dq5oe7veaoq51uo55sol2046b7ug.apps.googleusercontent.com` có redirect URI `minishop:/oauth2redirect`, và Firebase Auth > Sign-in method > Google bật.

### Thiết kế/layout
- Cỡ chữ đã giảm 1px toàn app (commit `293c868`), fontSize nằm rải rác theo style từng screen/component (không có typography tập trung).
- Fix bàn phím che ô nhập: KeyboardAvoidingView `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` (đã áp dụng các màn nhập liệu).
