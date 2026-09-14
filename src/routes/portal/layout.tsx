import { type Component, createSignal, onMount } from 'solid-js';
import { useNavigate, A, useLocation } from '@solidjs/router';
import type { RouteSectionProps } from '@solidjs/router';
import { useAuthStore } from '@/stores/auth.store';
import { Redirect } from '@/components/shared/redirect';
import { LogoutButton } from '@/components/layouts/sidebar';
import { MenuIcon } from '@/components/shared/menu-icon';
import { Menu } from 'lucide-solid';
import { PORTAL_MENU_ITEMS } from '@/lib/constants';

export const PortalLayout: Component<RouteSectionProps> = (props) => {
  const { user, role, isAuthenticated, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [initializing, setInitializing] = createSignal(true);
  const [menuOpen, setMenuOpen] = createSignal(false);

  onMount(() => {
    if (!isLoading()) {
      if (!isAuthenticated()) {
        void navigate('/login', { replace: true });
      } else {
        setInitializing(false);
      }
    } else {
      const timer = setInterval(() => {
        if (!isLoading()) {
          if (!isAuthenticated()) {
            void navigate('/login', { replace: true });
          } else {
            setInitializing(false);
          }
          clearInterval(timer);
        }
      }, 50);
    }
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

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

  const currentRole = role() as string | null;
  if (currentRole !== 'CUSTOMER') {
    return <Redirect href="/app/dashboard" replace />;
  }

  const userDisplayName = user()?.full_name ?? 'Guest';
  const userInitial = userDisplayName.charAt(0) ?? '?';

  return (
    <div class="flex h-screen flex-col overflow-hidden bg-background">
      <header class="flex h-14 items-center justify-between border-b border-border bg-muted/30 px-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Toggle menu"
          >
            <Menu class="h-5 w-5" />
          </button>
          <span class="font-semibold text-foreground">Petora Portal</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {userInitial}
          </div>
          <LogoutButton />
        </div>
      </header>
      <div class="flex flex-1 overflow-hidden">
        <aside
          class={`
            fixed inset-y-0 left-0 z-40 w-64 -translate-x-full border-r border-border bg-background transition-transform duration-200 md:translate-x-0 md:static md:z-auto
            ${menuOpen() ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav class="flex h-full flex-col overflow-y-auto py-4">
            <ul class="space-y-1 px-2">
              {PORTAL_MENU_ITEMS.map((item) => (
                <li>
                  <A
                    href={item.path}
                    class={`
                      flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                      ${isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'}
                    `}
                    onClick={() => setMenuOpen(false)}
                  >
                    <MenuIcon name={item.icon} class="h-4 w-4" />
                    {item.label}
                  </A>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <main class="flex-1 overflow-y-auto p-4">
          {props.children}
        </main>
      </div>
    </div>
  );
};

export default PortalLayout;
