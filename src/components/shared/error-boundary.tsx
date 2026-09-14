import { type Component, ErrorBoundary as SolidErrorBoundary } from 'solid-js';
import type { JSX } from 'solid-js';
import { AppError } from '@/lib/errors';
import { Button } from '@/components/ui/button';

export interface ErrorBoundaryProps {
  fallback?: (error: Error, reset: () => void) => JSX.Element;
  children: JSX.Element;
}

function getErrorMessage(error: Error): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return error.message || 'Terjadi kesalahan yang tidak diketahui';
}

export const ErrorBoundary: Component<ErrorBoundaryProps> = (props) => {
  return (
    <SolidErrorBoundary
      fallback={(err, reset) =>
        props.fallback ? (
          props.fallback(err, reset)
        ) : (
          <div class="flex min-h-[200px] items-center justify-center">
            <div class="text-center">
              <svg
                class="mx-auto h-12 w-12 text-destructive"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 class="mt-2 font-semibold text-foreground">
                Terjadi Kesalahan
              </h3>
              <p class="mt-1 text-sm text-muted-foreground">
                {getErrorMessage(err)}
              </p>
              <Button
                class="mt-4"
                variant="outline"
                onClick={reset}
                size="sm"
              >
                Coba Lagi
              </Button>
            </div>
          </div>
        )
      }
    >
      {props.children}
    </SolidErrorBoundary>
  );
};

export default ErrorBoundary;
