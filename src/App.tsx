import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { Router, Route } from "@solidjs/router";
import { onCleanup, onMount } from "solid-js";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { ToastContainer } from "@/components/ui/toast";
import { Redirect } from "@/components/shared/redirect";
import { StaffLayout } from "@/routes/app/layout";
import { PortalLayout } from "@/routes/portal/layout";
import { Dashboard } from "@/routes/app/dashboard";
import { AppointmentsRoute } from "@/routes/app/appointments";
import { CustomersRoute } from "@/routes/app/crm/customers";
import { ProductsRoute } from "@/routes/app/products";
import { PosRoute } from "@/routes/app/pos";
import { SettingsRoute } from "@/routes/app/settings";
import { PortalDashboard } from "@/routes/portal/dashboard";
import { LoginRoute } from "@/routes/login";
import {
  checkSession,
  initAuthListener,
  useAuthStore,
} from "@/stores/auth.store";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      retry: (failureCount, error) => {
        if (
          error instanceof Error &&
          (error.message.includes("401") || error.message.includes("403"))
        ) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

function LandingRedirect() {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading()) {
    return (
      <div class="flex h-screen w-full items-center justify-center">
        <svg
          class="animate-spin h-8 w-8 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.125 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  if (isAuthenticated()) {
    return <Redirect href="/app/dashboard" replace />;
  }

  return <Redirect href="/login" replace />;
}

function AppRoutes() {
  return (
    <Router base="/">
      <Route path="/login" component={LoginRoute} />
      <Route path="/" component={LandingRedirect} />

      <Route path="/app" component={StaffLayout}>
        <Route path="/app/dashboard" component={Dashboard} />
        <Route path="/app/appointments" component={AppointmentsRoute} />
        <Route path="/app/crm/customers" component={CustomersRoute} />
        <Route path="/app/products" component={ProductsRoute} />
        <Route path="/app/pos" component={PosRoute} />
        <Route path="/app/settings" component={SettingsRoute} />
      </Route>

      <Route path="/portal" component={PortalLayout}>
        <Route path="/portal/dashboard" component={PortalDashboard} />
      </Route>

      <Route path="/health" component={() => <span>OK</span>} />

      <Route path="*" component={() => <Redirect href="/login" replace />} />
    </Router>
  );
}

function App() {
  onMount(() => {
    void checkSession();
    initAuthListener();
  });

  onCleanup(() => {
    void queryClient.clear();
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
