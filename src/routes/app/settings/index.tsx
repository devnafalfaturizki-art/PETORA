import { type Component, createSignal, Show, For, onMount } from "solid-js";
import { useAuthStore } from "@/stores/auth.store";
import { USER_ROLE_LABELS } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Dialog } from "@kobalte/core";
import { Plus, Save, Key, Users, Shield, Bell, Trash2 } from "lucide-solid";
import { addToast } from "@/stores/ui.store";
import { AppError, ErrorCode } from "@/lib/errors";
import type { SafeUser, UUID } from "@/types";
import type { CreateUserInput } from "@/types/user";
import { AuthService } from "@/services/auth.service";
import { useMutation } from "@tanstack/solid-query";

type CreateUserRole = Exclude<SafeUser["role"], "OWNER">;

export const SettingsRoute: Component = () => {
  const { user: currentUser } = useAuthStore();
  const [showCreateDialog, setShowCreateDialog] = createSignal(false);
  const [users, setUsers] = createSignal<SafeUser[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, username, role, full_name, customer_id, created_by, failed_login_attempts, locked_until, created_at, updated_at",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers((data ?? []) as unknown as SafeUser[]);
    } catch (err) {
      addToast({
        type: "error",
        title: "Error",
        message:
          err instanceof Error ? err.message : "Gagal memuat data pengguna",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createMutation = useMutation(() => ({
    mutationFn: (input: {
      username: string;
      pin: string;
      full_name: string;
      role: CreateUserRole;
    }) => {
      const callerId = currentUser()?.id;
      if (!callerId) {
        return Promise.reject(
          new AppError(ErrorCode.FORBIDDEN, "Anda harus login"),
        );
      }
      return AuthService.createUser(input as CreateUserInput, callerId);
    },
  }));

  const resetPinMutation = useMutation(() => ({
    mutationFn: (input: { target_user_id: UUID; new_pin: string }) => {
      const callerId = currentUser()?.id;
      if (!callerId) {
        return Promise.reject(
          new AppError(ErrorCode.FORBIDDEN, "Anda harus login"),
        );
      }
      return AuthService.resetPin(input, callerId);
    },
  }));

  const [createFormData, setCreateFormData] = createSignal<{
    username: string;
    pin: string;
    full_name: string;
    role: CreateUserRole;
  }>({
    username: "",
    pin: "",
    full_name: "",
    role: "KASIR",
  });

  const handleCreate = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = createFormData();

    if (!form.username || !form.pin || !form.full_name) {
      addToast({
        type: "error",
        title: "Validasi Error",
        message: "Semua field wajib diisi",
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        username: form.username,
        pin: form.pin,
        full_name: form.full_name,
        role: form.role,
      });
      addToast({
        type: "success",
        title: "Berhasil",
        message: "Pengguna berhasil dibuat",
      });
      setShowCreateDialog(false);
      setCreateFormData({
        username: "",
        pin: "",
        full_name: "",
        role: "KASIR",
      });
      void fetchUsers();
    } catch (err) {
      if (err instanceof AppError) {
        addToast({ type: "error", title: "Error", message: err.message });
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: "Terjadi kesalahan",
        });
      }
    }
  };

  const handleResetPin = async (userId: UUID) => {
    const newPin = prompt("Masukkan PIN baru (6 digit):");
    if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      addToast({
        type: "error",
        title: "Error",
        message: "PIN harus 6 digit angka",
      });
      return;
    }

    try {
      await resetPinMutation.mutateAsync({
        target_user_id: userId,
        new_pin: newPin,
      });
      addToast({
        type: "success",
        title: "Berhasil",
        message: "PIN berhasil direset",
      });
    } catch (err) {
      if (err instanceof AppError) {
        addToast({ type: "error", title: "Error", message: err.message });
      } else {
        addToast({
          type: "error",
          title: "Error",
          message: "Terjadi kesalahan",
        });
      }
    }
  };

  const handleDeactivate = async (userId: UUID) => {
    if (!confirm("Yakin ingin menonaktifkan pengguna ini?")) return;

    try {
      await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", userId);
      addToast({
        type: "success",
        title: "Berhasil",
        message: "Pengguna berhasil dinonaktifkan",
      });
      void fetchUsers();
    } catch (err) {
      addToast({ type: "error", title: "Error", message: "Terjadi kesalahan" });
    }
  };

  const roleOptions = [
    { value: "ADMIN" as CreateUserRole, label: USER_ROLE_LABELS.ADMIN },
    { value: "DOKTER" as CreateUserRole, label: USER_ROLE_LABELS.DOKTER },
    { value: "KASIR" as CreateUserRole, label: USER_ROLE_LABELS.KASIR },
  ];

  onMount(() => {
    void fetchUsers();
  });

  const userColumns = [
    { key: "username", label: "Username" },
    { key: "full_name", label: "Nama Lengkap" },
    {
      key: "role",
      label: "Role",
      render: (row: SafeUser) => (
        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium">
          {USER_ROLE_LABELS[row.role] ?? row.role}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (row: SafeUser) => (
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => handleResetPin(row.id)}
            aria-label="Reset PIN"
          >
            <Key class="h-4 w-4" />
          </button>
          <Show when={currentUser()?.role === "OWNER" && row.role !== "OWNER"}>
            <button
              type="button"
              class="rounded p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => handleDeactivate(row.id)}
              aria-label="Nonaktifkan"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </Show>
        </div>
      ),
    },
  ];

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Kelola pengguna, peran, dan preferensi sistem
          </p>
        </div>
        <Show when={currentUser()?.role === "OWNER"}>
          <Button
            class="flex items-center gap-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus class="h-4 w-4" />
            Tambah Pengguna
          </Button>
        </Show>
      </div>

      <div class="space-y-4">
        <h2 class="text-lg font-semibold text-foreground">Daftar Pengguna</h2>

        <Show when={isLoading()}>
          <div class="py-8">
            <LoadingSpinner label="Memuat pengguna..." />
          </div>
        </Show>

        <Show when={!isLoading()}>
          <Show
            when={users().length === 0}
            fallback={
              <DataTable<SafeUser>
                data={users()}
                columns={userColumns}
                isLoading={false}
                striped
              />
            }
          >
            <EmptyState
              title="Belum ada pengguna"
              description="Belum ada pengguna terdaftar"
              icon={<Users class="h-12 w-12" />}
            />
          </Show>
        </Show>
      </div>

      <div class="border-t border-border pt-6">
        <h2 class="text-lg font-semibold text-foreground">Pengaturan Sistem</h2>
        <div class="mt-4 space-y-3">
          <div class="flex items-center justify-between rounded-lg border border-border p-3">
            <div class="flex items-center gap-3">
              <Bell class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="font-medium text-foreground">Notifikasi WhatsApp</p>
                <p class="text-sm text-muted-foreground">
                  Aktifkan notifikasi WhatsApp untuk janji temu
                </p>
              </div>
            </div>
            <label class="relative inline-flex h-6 w-10 items-center rounded-full">
              <input type="checkbox" class="sr-only" checked />
              <span class="h-6 w-10 rounded-full bg-primary"></span>
            </label>
          </div>
          <div class="flex items-center justify-between rounded-lg border border-border p-3">
            <div class="flex items-center gap-3">
              <Shield class="h-5 w-5 text-muted-foreground" />
              <div>
                <p class="font-medium text-foreground">Lock Screen Otomatis</p>
                <p class="text-sm text-muted-foreground">
                  Lock layar setelah 5 menit tidak aktif
                </p>
              </div>
            </div>
            <label class="relative inline-flex h-6 w-10 items-center rounded-full">
              <input type="checkbox" class="sr-only" checked />
              <span class="h-6 w-10 rounded-full bg-primary"></span>
            </label>
          </div>
        </div>
      </div>

      <Dialog.Root open={showCreateDialog()} onOpenChange={setShowCreateDialog}>
        <Dialog.Trigger as="span">
          <span />
        </Dialog.Trigger>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content class="fixed top-1/2 left-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg">
          <Dialog.Title class="text-lg font-semibold text-foreground">
            Buat Pengguna Baru
          </Dialog.Title>
          <Dialog.Description class="text-sm text-muted-foreground">
            Buat akun staf atau customer baru
          </Dialog.Description>
          <form onSubmit={handleCreate} class="space-y-4">
            <Input
              label="Username"
              placeholder="Masukkan username"
              required
              value={createFormData().username}
              onInput={(e) =>
                setCreateFormData((prev) => ({
                  ...prev,
                  username: (e.target as HTMLInputElement).value,
                }))
              }
            />
            <Input
              label="PIN"
              type="password"
              placeholder="6 digit angka"
              required
              value={createFormData().pin}
              onInput={(e) =>
                setCreateFormData((prev) => ({
                  ...prev,
                  pin: (e.target as HTMLInputElement).value,
                }))
              }
            />
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama lengkap"
              required
              value={createFormData().full_name}
              onInput={(e) =>
                setCreateFormData((prev) => ({
                  ...prev,
                  full_name: (e.target as HTMLInputElement).value,
                }))
              }
            />
            <div>
              <label class="text-sm font-medium text-foreground">Role</label>
              <select
                class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={createFormData().role}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    role: (e.target as HTMLSelectElement)
                      .value as CreateUserRole,
                  }))
                }
              >
                <For each={roleOptions}>
                  {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
              </select>
            </div>
          </form>
          <div class="flex justify-end gap-2 pt-4">
            <Dialog.CloseButton as="span">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateDialog(false)}
              >
                Batal
              </Button>
            </Dialog.CloseButton>
            <Button
              size="sm"
              loading={createMutation.isPending}
              onClick={() => {
                const form = document.querySelector(
                  "form",
                ) as HTMLFormElement | null;
                if (form) void form.requestSubmit();
              }}
            >
              <Save class="h-4 w-4 mr-2" />
              Simpan
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
};

export default SettingsRoute;
