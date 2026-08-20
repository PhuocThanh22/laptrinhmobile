import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { isFirebaseConfigured } from '@/constants/config';
import {
  getUserProfile,
  loginUser,
  onAuthChange,
  registerUser,
  logoutUser,
  reloadUserEmailVerified,
  sendVerificationEmail,
  updateUserProfile,
} from '@/services/authService';
import { getFirebaseErrorMessage } from '@/utils/errors';
import type { AppUser } from '@/types';

interface AuthContextValue {
  user: AppUser | null;
  emailVerified: boolean;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerified: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setInitializing(false);
      return;
    }
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        unsubscribe = onAuthChange(async (fbUser) => {
          if (fbUser) {
            if (mounted) setEmailVerified(fbUser.emailVerified);
            try {
              const profile = await getUserProfile(fbUser.uid);
              if (mounted) setUser(profile);
            } catch {
              if (mounted) setUser(null);
            }
          } else if (mounted) {
            setUser(null);
            setEmailVerified(false);
          }
          if (mounted) setInitializing(false);
        });
      } catch {
        if (mounted) {
          setUser(null);
          setInitializing(false);
        }
      }
    };
    init();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const profile = await loginUser(email, password);
      setUser(profile);
    } catch (e) {
      throw new Error(getFirebaseErrorMessage(e));
    }
  }, []);

  const signUp = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string }) => {
      try {
        const profile = await registerUser(input);
        setUser(profile);
      } catch (e) {
        throw new Error(getFirebaseErrorMessage(e));
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await logoutUser();
    } catch (e) {
      throw new Error(getFirebaseErrorMessage(e));
    } finally {
      setUser(null);
      setEmailVerified(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await getUserProfile(user.uid);
      if (profile) setUser(profile);
    } catch {
      // bỏ qua lỗi làm mới
    }
  }, [user]);

  const updateProfile = useCallback(
    async (data: Partial<AppUser>) => {
      if (!user) throw new Error('Bạn chưa đăng nhập.');
      await updateUserProfile(user.uid, data);
      setUser((prev) => (prev ? { ...prev, ...data } : prev));
    },
    [user],
  );

  const resendVerificationEmail = useCallback(async () => {
    try {
      await sendVerificationEmail();
    } catch (e) {
      throw new Error(getFirebaseErrorMessage(e));
    }
  }, []);

  const refreshEmailVerified = useCallback(async () => {
    try {
      const verified = await reloadUserEmailVerified();
      setEmailVerified(verified);
      return verified;
    } catch (e) {
      throw new Error(getFirebaseErrorMessage(e));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      emailVerified,
      initializing,
      signIn,
      signUp,
      signOut,
      refreshUser,
      updateProfile,
      resendVerificationEmail,
      refreshEmailVerified,
    }),
    [
      user,
      emailVerified,
      initializing,
      signIn,
      signUp,
      signOut,
      refreshUser,
      updateProfile,
      resendVerificationEmail,
      refreshEmailVerified,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  return ctx;
}