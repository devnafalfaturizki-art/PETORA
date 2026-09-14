import { type Component, createMemo } from "solid-js";
import { A, useLocation } from "@solidjs/router";
import { setMobileSidebarOpen } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { MENU_ITEMS, USER_ROLE_LABELS } from "@/lib/constants";
import { MenuIcon } from "@/components/shared/menu-icon";
import { ChevronLeft, Menu, LogOut } from "lucide-solid";
import type { UserRole } from "@/types/user";

export const Sidebar: Component = () => {
  const { user, role } = useAuthStore();
  const location = useLocation();

  const visibleMenuItems = createMemo(() => {
    const currentRole = role() as UserRole | null;
    if (!currentRole) return [];
    return MENU_ITEMS.filter((item) =>
      item.roles.some((r) => r === currentRole),
    );
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <aside class="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-muted/30">
      <div class="flex h-14 items-center justify-between border-b border-border px-4">
        <span class="font-semibold text-foreground">Petora</span>
        <button
          type="button"
          class="rounded p-1 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <ChevronLeft class="h-5 w-5" />
        </button>
      </div>
      <nav class="flex-1 overflow-y-auto py-2">
        <ul class="space-y-1 px-2">
          {visibleMenuItems().map((item) => (
            <li>
              <A
                href={item.path}
                class={`
                  flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                  ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                `}
              >
                <MenuIcon name={item.icon} class="h-4 w-4" />
                {item.label}
              </A>
            </li>
          ))}
        </ul>
      </nav>
      <div class="border-t border-border p-4">
        <div class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {user()?.full_name?.charAt(0) ?? "?"}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-foreground truncate">
              {user()?.full_name ?? "Unknown"}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {USER_ROLE_LABELS[user()?.role ?? ""] ?? user()?.role ?? ""}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export function SidebarToggle() {
  return (
    <button
      type="button"
      class="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:hidden"
      onClick={() => setMobileSidebarOpen(true)}
      aria-label="Toggle sidebar"
    >
      <Menu class="h-5 w-5" />
    </button>
  );
}

export function LogoutButton() {
  const logout = useLogout();

  return (
    <button
      type="button"
      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      onClick={() => logout.mutate()}
      aria-label="Logout"
    >
      <LogOut class="h-4 w-4" />
      Keluar
    </button>
  );
}

export const MobileSidebar: Component = () => {
  const { role } = useAuthStore();
  const location = useLocation();

  const visibleMenuItems = createMemo(() => {
    const currentRole = role() as UserRole | null;
    if (!currentRole) return [];
    return MENU_ITEMS.filter((item) =>
      item.roles.some((r) => r === currentRole),
    );
  });

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div class="md:hidden">
      <div
        class="fixed inset-0 z-40 bg-black/50"
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside class="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border shadow-lg overflow-y-auto">
        <div class="flex h-14 items-center justify-between border-b border-border px-4">
          <span class="font-semibold text-foreground">Petora</span>
          <button
            type="button"
            class="rounded p-1 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
        </div>
        <nav class="flex-1 overflow-y-auto py-2">
          <ul class="space-y-1 px-2">
            {visibleMenuItems().map((item) => (
              <li>
                <A
                  href={item.path}
                  class={`
                    flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                    ${
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }
                  `}
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <MenuIcon name={item.icon} class="h-4 w-4" />
                  {item.label}
                </A>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
};

export default Sidebar;
