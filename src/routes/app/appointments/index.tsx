import { type Component, createSignal, Show, For, createMemo } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import {
  useTodayQueue,
  useCreateAppointment,
  useUpdateAppointmentStatus,
} from "@/hooks/use-appointments";
import { useCustomers } from "@/hooks/use-customers";
import type { Appointment, UUID } from "@/types";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, createDataTableColumns } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@kobalte/core";
import {
  Plus,
  Edit,
  Save,
  Play,
  Check,
  X as XIcon,
  CalendarCheck,
} from "lucide-solid";
import { addToast } from "@/stores/ui.store";
import { APPOINTMENT_STATUS_LABELS } from "@/lib/constants";
import { AppError } from "@/lib/errors";

interface AppointmentForm {
  customer_id: string;
  pet_id: string;
  appointment_date: string;
  appointment_time: string;
  complaint: string;
  notes: string;
}

export const AppointmentsRoute: Component = () => {
  const [searchParams] = useSearchParams<{
    status?: string;
    search?: string;
  }>();
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);
  const [editingAppointment, setEditingAppointment] =
    createSignal<Appointment | null>(null);
  const [cancelTarget, setCancelTarget] = createSignal<Appointment | null>(
    null,
  );
  const [formData, setFormData] = createSignal<AppointmentForm>({
    customer_id: "",
    pet_id: "",
    appointment_date: "",
    appointment_time: "",
    complaint: "",
    notes: "",
  });

  const todayQueueResult = useTodayQueue();
  const customersResult = useCustomers({ is_active: true });
  const createMutation = useCreateAppointment();
  const updateStatusMutation = useUpdateAppointmentStatus();

  const customers = createMemo(() => customersResult.data?.data ?? []);

  const filteredQueue = createMemo(() => {
    const queue = todayQueueResult.data ?? [];
    const statusFilter = searchParams.status;
    if (!statusFilter) return queue;
    return queue.filter((a) => a.status === statusFilter);
  });

  const todayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const columns = createDataTableColumns<Appointment>([
    {
      key: "queue_number",
      label: "No.",
      render: (row) => (
        <span class="text-sm font-medium">{row.queue_number ?? "-"}</span>
      ),
    },
    {
      key: "customer_id",
      label: "Customer",
      render: (row) => {
        const customer = customers().find((c) => c.id === row.customer_id);
        return (
          <span class="text-sm">
            {customer?.name ?? row.customer_id?.slice(0, 8) ?? "-"}
          </span>
        );
      },
    },
    {
      key: "appointment_time",
      label: "Waktu",
      render: (row) => <span class="text-sm">{row.appointment_time}</span>,
    },
    {
      key: "complaint",
      label: "Keluhan",
      render: (row) => (
        <span class="text-sm text-muted-foreground" title={row.complaint ?? ""}>
          {row.complaint ?? "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          class={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium`}
        >
          {APPOINTMENT_STATUS_LABELS[row.status] ?? row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Aksi",
      render: (row) => (
        <div class="flex items-center gap-1">
          {row.status === "WAITING" && (
            <button
              type="button"
              class="rounded p-1 text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={async () => {
                try {
                  await updateStatusMutation.mutateAsync({
                    id: row.id,
                    status: "IN_PROGRESS",
                  });
                  addToast({
                    type: "success",
                    title: "Berhasil",
                    message: "Janji temu dimulai",
                  });
                } catch (err) {
                  if (err instanceof AppError) {
                    addToast({
                      type: "error",
                      title: "Error",
                      message: err.message,
                    });
                  }
                }
              }}
              aria-label="Mulai janji temu"
            >
              <Play class="h-4 w-4" />
            </button>
          )}
          {row.status === "IN_PROGRESS" && (
            <button
              type="button"
              class="rounded p-1 text-green-600 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={async () => {
                try {
                  await updateStatusMutation.mutateAsync({
                    id: row.id,
                    status: "DONE",
                  });
                  addToast({
                    type: "success",
                    title: "Berhasil",
                    message: "Janji temu selesai",
                  });
                } catch (err) {
                  if (err instanceof AppError) {
                    addToast({
                      type: "error",
                      title: "Error",
                      message: err.message,
                    });
                  }
                }
              }}
              aria-label="Selesaikan janji temu"
            >
              <Check class="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            class="rounded p-1 text-muted-foreground hover:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={(e) => {
              e.stopPropagation();
              setEditingAppointment(row);
              setIsDialogOpen(true);
            }}
            aria-label="Edit janji temu"
          >
            <Edit class="h-4 w-4" />
          </button>
          {row.status !== "DONE" && row.status !== "CANCELLED" && (
            <button
              type="button"
              class="rounded p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={(e) => {
                e.stopPropagation();
                setCancelTarget(row);
              }}
              aria-label="Batalkan janji temu"
            >
              <XIcon class="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]);

  const handleInputChange = (field: keyof AppointmentForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      customer_id: "",
      pet_id: "",
      appointment_date: "",
      appointment_time: "",
      complaint: "",
      notes: "",
    });
    setEditingAppointment(null);
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = formData();

    if (!form.customer_id || !form.appointment_date || !form.appointment_time) {
      addToast({
        type: "error",
        title: "Validasi Error",
        message: "Customer, tanggal, dan waktu wajib diisi",
      });
      return;
    }

    const input = {
      customer_id: form.customer_id as UUID,
      pet_id: (form.pet_id || customers()[0]?.id || "") as UUID,
      appointment_date: form.appointment_date,
      appointment_time: form.appointment_time,
      ...(form.complaint ? { complaint: form.complaint } : {}),
      ...(form.notes ? { notes: form.notes } : {}),
      is_from_portal: false,
    };

    try {
      await createMutation.mutateAsync(input);

      addToast({
        type: "success",
        title: "Berhasil",
        message: "Janji temu berhasil ditambahkan",
      });
      setIsDialogOpen(false);
      resetForm();
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

  const handleCancel = async () => {
    if (!cancelTarget()) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: cancelTarget()!.id,
        status: "CANCELLED",
      });
      addToast({
        type: "success",
        title: "Berhasil",
        message: "Janji temu dibatalkan",
      });
      setCancelTarget(null);
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

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Janji Temu</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Kelola antrian janji temu pasien
          </p>
        </div>
        <Button
          class="flex items-center gap-2"
          onClick={() => {
            resetForm();
            setFormData((prev) => ({ ...prev, appointment_date: todayStr() }));
            setIsDialogOpen(true);
          }}
        >
          <Plus class="h-4 w-4" />
          Tambah Janji Temu
        </Button>
      </div>

      <div class="flex items-center gap-4">
        <SearchInput
          class="max-w-sm"
          placeholder="Cari janji temu..."
          value={() => searchParams.search ?? ""}
          onSearch={(q) =>
            void (window.location.search = q
              ? `?search=${encodeURIComponent(q)}`
              : "")
          }
        />
        <select
          class="rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={searchParams.status ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            if (val) {
              window.location.search = `?status=${encodeURIComponent(val)}`;
            } else {
              window.location.search = "";
            }
          }}
        >
          <option value="">Semua Status</option>
          <option value="WAITING">Menunggu</option>
          <option value="IN_PROGRESS">Dalam Proses</option>
          <option value="DONE">Selesai</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
      </div>

      <Show
        when={!todayQueueResult.isLoading}
        fallback={
          <div class="py-8">
            <LoadingSpinner label="Memuat janji temu..." />
          </div>
        }
      >
        <Show
          when={filteredQueue().length === 0}
          fallback={
            <DataTable<Appointment>
              data={filteredQueue()}
              columns={columns}
              isLoading={false}
              emptyMessage="Tidak ada janji temu"
              striped
            />
          }
        >
          <EmptyState
            title="Belum ada janji temu"
            description="Tambahkan janji temu dengan klik tombol di atas"
            icon={<CalendarCheck class="h-12 w-12" />}
          />
        </Show>
      </Show>

      <ConfirmDialog
        open={() => cancelTarget() !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Batalkan Janji Temu"
        description={`Yakin ingin membatalkan janji temu untuk ${cancelTarget()?.complaint ?? ""}? Anda dapat melanjutkan hanya dengan menekan Konfirmasi.`}
        variant="destructive"
        confirmLabel="Batal"
        onConfirm={handleCancel}
      />

      <Dialog.Root open={isDialogOpen()} onOpenChange={setIsDialogOpen}>
        <Dialog.Trigger as="span">
          <span />
        </Dialog.Trigger>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content class="fixed top-1/2 left-1/2 z-50 grid w-full max-w2xl -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg">
          <Dialog.Title class="text-lg font-semibold text-foreground">
            {editingAppointment() ? "Edit Janji Temu" : "Tambah Janji Temu"}
          </Dialog.Title>
          <Dialog.Description class="text-sm text-muted-foreground">
            {editingAppointment()
              ? "Perbarui data janji temu"
              : "Masukkan data janji temu baru"}
          </Dialog.Description>

          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="text-sm font-medium text-foreground">
                Customer *
              </label>
              <select
                class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData().customer_id}
                onChange={(e) =>
                  handleInputChange(
                    "customer_id",
                    (e.target as HTMLSelectElement).value,
                  )
                }
                required
              >
                <option value="">Pilih customer</option>
                <For each={customers()}>
                  {(customer) => (
                    <option value={customer.id}>{customer.name}</option>
                  )}
                </For>
              </select>
            </div>

            {formData().customer_id ? (
              <div>
                <label class="text-sm font-medium text-foreground">Hewan</label>
                <select
                  class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData().pet_id}
                  onChange={(e) =>
                    handleInputChange(
                      "pet_id",
                      (e.target as HTMLSelectElement).value,
                    )
                  }
                >
                  <option value="">Pilih hewan</option>
                </select>
              </div>
            ) : null}

            <Input
              label="Tanggal"
              type="date"
              required
              value={formData().appointment_date}
              onInput={(e) =>
                handleInputChange(
                  "appointment_date",
                  (e.target as HTMLInputElement).value,
                )
              }
            />
            <Input
              label="Waktu"
              type="time"
              required
              value={formData().appointment_time}
              onInput={(e) =>
                handleInputChange(
                  "appointment_time",
                  (e.target as HTMLInputElement).value,
                )
              }
            />
            <Input
              label="Keluhan"
              placeholder="Masukkan keluhan pasien"
              value={formData().complaint}
              onInput={(e) =>
                handleInputChange(
                  "complaint",
                  (e.target as HTMLInputElement).value,
                )
              }
            />
            <Input
              label="Catatan"
              placeholder="Catatan tambahan"
              value={formData().notes}
              onInput={(e) =>
                handleInputChange("notes", (e.target as HTMLInputElement).value)
              }
            />
          </form>

          <div class="flex justify-end gap-2 pt-4">
            <Dialog.CloseButton as="span">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
            </Dialog.CloseButton>
            <Button
              size="sm"
              loading={createMutation.isPending}
              onClick={() => {
                const formEl = document.querySelector(
                  "form",
                ) as HTMLFormElement | null;
                if (formEl) void formEl.requestSubmit();
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

export default AppointmentsRoute;
