import { createQuery, createMutation, useQueryClient } from '@tanstack/solid-query';
import { AuthService } from '@/services/auth.service';
import { QueryKeys } from '@/lib/query-keys';
import { useAuthStore } from '@/stores/auth.store';
import type { LoginCredentials, LoginResponse, SafeUser } from '@/types/user';
import type { UserRole } from '@/types/user';

export function useAuth() {
  const { state } = useAuthStore();

  return createQuery(() => ({
    queryKey: QueryKeys.currentUser,
    queryFn: () => AuthService.getCurrentUser(),
    initialData: state.user,
    staleTime: Infinity,
  }));
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setUser, setLoading } = useAuthStore();

  return createMutation(() => ({
    mutationFn: (credentials: LoginCredentials): Promise<LoginResponse> =>
      AuthService.login(credentials),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (result) => {
      setUser(result.user, {
        user_id: result.user.id,
        role: result.user.role,
        expires_at: result.expires_at,
      });
      queryClient.setQueryData(QueryKeys.currentUser, result.user);
      queryClient.invalidateQueries({ queryKey: QueryKeys.currentUser });
    },
    onError: () => {
      setLoading(false);
    },
  }));
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { clearUser } = useAuthStore();

  return createMutation(() => ({
    mutationFn: () => AuthService.logout(),
    onSuccess: () => {
      clearUser();
      queryClient.removeQueries({ queryKey: QueryKeys.currentUser });
      queryClient.invalidateQueries({ queryKey: QueryKeys.currentUser });
    },
  }));
}

export function useCurrentUser() {
  return useAuthStore().user;
}

export function useIsAuthenticated() {
  return useAuthStore().isAuthenticated;
}

export function useRequireRole(_allowedRoles: UserRole | UserRole[]) {
  const { hasRole } = useAuthStore();
  const roles = Array.isArray(_allowedRoles) ? _allowedRoles : [_allowedRoles];

  return createQuery(() => ({
    queryKey: ['auth', 'role-check', ...roles],
    queryFn: () => hasRole(roles),
    staleTime: 60000,
  }));
}

export function getCurrentUserSync(): SafeUser | null {
  return AuthService.getCurrentUser();
}

export function getCurrentUserIdSync(): string | null {
  return useAuthStore().userId();
}
