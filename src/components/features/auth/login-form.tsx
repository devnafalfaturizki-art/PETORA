import { type Component, createSignal } from "solid-js";
import { useLogin } from "@/hooks/use-auth";
import { useNavigate } from "@solidjs/router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppError } from "@/lib/errors";
import { APP_NAME, PIN_LENGTH } from "@/lib/constants";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: Component<LoginFormProps> = (props) => {
  const [username, setUsername] = createSignal("");
  const [pin, setPin] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);

  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    setError(null);

    if (!username() || !pin()) {
      setError("Username dan PIN wajib diisi");
      return;
    }

    try {
      await login.mutateAsync({ username: username(), pin: pin() });
      props.onSuccess?.();
      void navigate("/app/dashboard");
    } catch (err) {
      if (err instanceof AppError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat login");
      }
    }
  };

  const isPending = login.isPending;
  const canSubmit = () =>
    username().length >= 3 && pin().length === PIN_LENGTH && !isPending;

  return (
    <div class="flex min-h-screen items-center justify-center bg-muted/30">
      <form
        onSubmit={handleSubmit}
        class="w-full max-w-md space-y-6 rounded-xl bg-background p-8 shadow-lg"
      >
        <div class="text-center">
          <h1 class="text-3xl font-bold text-foreground">{APP_NAME}</h1>
          <p class="mt-2 text-sm text-muted-foreground">
            Masukkan username dan PIN untuk masuk
          </p>
        </div>

        <div>
          <Input
            type="text"
            label="Username"
            placeholder="Masukkan username"
            required
            value={username()}
            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
            autocomplete="username"
          />
        </div>

        <div>
          <Input
            type="password"
            label="PIN"
            placeholder="Masukkan PIN 6 digit"
            required
            value={pin()}
            onInput={(e) =>
              setPin((e.target as HTMLInputElement).value.slice(0, 8))
            }
            autocomplete="current-password"
          />
          {error() ? (
            <span class="mt-1 text-xs text-destructive">{error()}</span>
          ) : null}
        </div>

        <Button
          type="submit"
          class="w-full"
          loading={isPending}
          disabled={!canSubmit()}
        >
          {isPending ? "Sedang masuk..." : "Masuk"}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
