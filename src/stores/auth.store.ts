import { createStore } from 'solid-js/store';
import { createSignal, createMemo } from 'solid-js';
import { supabase } from '@/lib/supabase';
import { SESSION_EXPIRY_HOURS } from '@/lib/constants';
import type { SafeUser, Session, UserRole } from '@/types/user';

export interface AuthState {
  user: SafeUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const STORAGE_KEY = 'petora-auth';

const initialAuthData = ():AuthState => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          user: SafeUser;
          session: Session;
        };
        const sessionValid =
          parsed.session &&
          new Date(parsed.session.expires_at).getTime() > Date.now();
        if (sessionValid) {
          return {
            user: parsed.user,
            session: parsed.session,
            isAuthenticated: true,
            isLoading: false,
          };
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }
  return {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
  };
};

const [authState, setAuthState] = createStore<AuthState>(initialAuthData());

function persistAuth(user: SafeUser | null, session: Session | null) {
  if (typeof localStorage !== 'undefined') {
    if (user && session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, session }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}

const [sessionExpiryWarning, setSessionExpiryWarning] = createSignal(false);

export const useAuthStore = () => {
  const currentUser = createMemo(() => authState.user);
  const currentUserRole = createMemo(() => authState.user?.role ?? null);
  const isOwner = createMemo(() => authState.user?.role === 'OWNER');
  const isAdmin = createMemo(() => authState.user?.role === 'OWNER' || authState.user?.role === 'ADMIN');
  const isCustomer = createMemo(() => authState.user?.role === 'CUSTOMER');
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!authState.user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(authState.user.role);
  };

  return {
    state: authState,
    user: currentUser,
    userId: () => authState.user?.id ?? null,
    role: currentUserRole,
    isOwner,
    isAdmin,
    isCustomer,
    hasRole,
    isAuthenticated: () => authState.isAuthenticated,
    isLoading: () => authState.isLoading,
    sessionExpiryWarning,
    setUser: (user: SafeUser, session: Session) => {
      persistAuth(user, session);
      setAuthState({
        user,
        session,
        isAuthenticated: true,
        isLoading: false,
      });
    },
    clearUser: () => {
      persistAuth(null, null);
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },
    setLoading: (loading: boolean) => {
      setAuthState('isLoading', loading);
    },
    setSessionExpiryWarning: (value: boolean) => setSessionExpiryWarning(value),
  };
};

export const getCurrentUserId = (): string | null => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { user: SafeUser; session: Session };
        const sessionValid =
          parsed.session &&
          new Date(parsed.session.expires_at).getTime() > Date.now();
        if (sessionValid) {
          return parsed.user.id;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
};

export function initAuthListener() {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      const user = session.user as unknown as SafeUser;
      const newSession: Session = {
        user_id: user.id,
        role: user.role ?? 'CUSTOMER',
        expires_at:
          new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      };
      persistAuth(user, newSession);
      setAuthState({
        user,
        session: newSession,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      persistAuth(null, null);
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  });
}

export const getCurrentUserRole = (): UserRole | null => {
  const id = getCurrentUserId();
  if (!id) return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as { user: SafeUser };
      return parsed.user.role ?? null;
    } catch {
      return null;
    }
  }
  return null;
};

export async function checkSession(): Promise<void> {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      persistAuth(null, null);
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    if (session?.user) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as { user: SafeUser; session: Session };
          const sessionValid =
            parsed.session &&
            new Date(parsed.session.expires_at).getTime() > Date.now();
          if (sessionValid) {
            setAuthState({
              user: parsed.user,
              session: parsed.session,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        } catch {
          persistAuth(null, null);
        }
      }

      const user = session.user as unknown as SafeUser;
      const newSession: Session = {
        user_id: user.id,
        role: user.role ?? 'CUSTOMER',
        expires_at:
          new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString(),
      };
      persistAuth(user, newSession);
      setAuthState({
        user,
        session: newSession,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      persistAuth(null, null);
      setAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  } catch {
    setAuthState('isLoading', false);
  }
}
