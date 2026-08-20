/**
 * Xác thực người dùng bằng Firebase Authentication.
 * Sau khi đăng ký thành công -> tự động tạo document trong collection `users`.
 */
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { requireFirebase } from './firebase';
import type { AppUser } from '@/types';

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AppUser> {
  const { auth, db } = requireFirebase();
  const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);

  const user: AppUser = {
    uid: credential.user.uid,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() ?? '',
    avatar: '',
    createdAt: Date.now(),
  };

  await setDoc(doc(db, 'users', credential.user.uid), {
    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: '',
    createdAt: user.createdAt,
  });

  // Gửi email xác thực ngay sau khi đăng ký. Nếu gửi thất bại vẫn cho phép
  // đăng ký (người dùng có thể tự gửi lại từ màn hình xác thực email).
  try {
    await sendEmailVerification(credential.user);
  } catch {
    // bỏ qua lỗi gửi email, không chặn đăng ký
  }

  return user;
}

/** Gửi lại email xác thực cho user đang đăng nhập. */
export async function sendVerificationEmail(): Promise<void> {
  const { auth } = requireFirebase();
  if (!auth.currentUser) throw new Error('Bạn chưa đăng nhập.');
  await sendEmailVerification(auth.currentUser);
}

/** Làm mới user trên Firebase Auth và trả về trạng thái emailVerified mới nhất. */
export async function reloadUserEmailVerified(): Promise<boolean> {
  const { auth } = requireFirebase();
  if (!auth.currentUser) return false;
  await auth.currentUser.reload();
  return auth.currentUser.emailVerified;
}

/** Gửi email đặt lại mật khẩu (quên mật khẩu). */
export async function resetPassword(email: string): Promise<void> {
  const { auth } = requireFirebase();
  await sendPasswordResetEmail(auth, email.trim());
}

/** Kiểm tra email đã được dùng để tạo tài khoản chưa. */
export async function checkEmailExists(email: string): Promise<boolean> {
  const { auth } = requireFirebase();
  const methods = await fetchSignInMethodsForEmail(auth, email.trim());
  return methods.length > 0;
}

export async function loginUser(email: string, password: string): Promise<AppUser> {
  const { auth } = requireFirebase();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const profile = await getUserProfile(credential.user.uid);
  if (!profile) {
    // Tài khoản không có document -> tạo mới cho đồng bộ.
    return {
      uid: credential.user.uid,
      name: credential.user.displayName ?? email.split('@')[0],
      email: email.trim().toLowerCase(),
      phone: '',
      avatar: '',
      createdAt: Date.now(),
    };
  }
  return profile;
}

export async function logoutUser(): Promise<void> {
  const { auth } = requireFirebase();
  await signOut(auth);
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Omit<AppUser, 'uid'>;
  return { uid, ...data };
}

export async function updateUserProfile(uid: string, data: Partial<AppUser>): Promise<void> {
  const { db } = requireFirebase();
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

/** Lắng nghe thay đổi trạng thái đăng nhập. */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const { auth } = requireFirebase();
  return onAuthStateChanged(auth, callback);
}