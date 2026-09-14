import { type Component, createSignal, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import type { RouteSectionProps } from '@solidjs/router';
import { useAuthStore } from '@/stores/auth.store';
import { Redirect } from '@/components/shared/redirect';
import {
  Sidebar,
  SidebarToggle,
  LogoutButton,
  MobileSidebar,
} from '@/components/layouts/sidebar';

export const StaffLayout: Component<RouteSectionProps> = (props) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [initializing, setInitializing] = createSignal(true);

  onMount(() => {
    if (!isLoading()) {
      if (!isAuthenticated()) {
        navigate('/login', { replace: true });
      } else {
        setInitializing(false);
      }
    } else {
      const timer = setInterval(() => {
        if (!isLoading()) {
          if (!isAuthenticated()) {
            navigate('/login', { replace: true });
          } else {
            setInitializing(false);
          }
          clearInterval(timer);
        }
      }, 50);
    }
  });

  if (isLoading() || initializing()) {
    return (
      <div class="flex h-screen w-full items-center justify-center">
        <svg
          class="animate-spin h-8 w-8 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.125 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Redirect href="/login" replace />;
  }

  return (
    <div class="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <MobileSidebar />
      <div class="flex flex-1 flex-col overflow-hidden">
        <header class="flex h-14 items-center justify-between border-b border-border bg-muted/30 px-3">
          <SidebarToggle />
          <LogoutButton />
        </header>
        <main class="flex-1 overflow-y-auto p-4">
          {props.children}
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
