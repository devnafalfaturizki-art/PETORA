import { type Component, createSignal, Show, For } from "solid-js";
import { useSearchParams, useNavigate } from "@solidjs/router";
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/use-customers";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerTag,
  UUID,
} from "@/types";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, createDataTableColumns } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@kobalte/core";
import { Plus, Edit, Trash2, Save, User } from "lucide-solid";
import { addToast } from "@/stores/ui.store";
import { CUSTOMER_TAG_LABELS } from "@/lib/constants";
import { AppError } from "@/lib/errors";

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  is_guest: boolean;
  tags: CustomerTag[];
}

export const CustomersRoute: Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams<{ search?: string; tab?: string }>();
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);
  const [editingCustomer, setEditingCustomer] = createSignal<Customer | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = createSignal<Customer | null>(null);
  const [formData, setFormData] = createSignal<CustomerForm>({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    is_guest: false,
    tags: [],
  });

  const search = () => searchParams.search ?? "";
  const activeTab = () => searchParams.tab ?? "registered";

  const listParams = () => {
    const params: { search: string; is_guest?: boolean; is_active?: boolean } =
      {
        search: search(),
      };
    if (activeTab() === "guests") {
      params.is_guest = true;
    } else {
      params.is_active = true;
    }
    return params;
  };

  const customersResult = useCustomers(listParams());

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const columns = createDataTableColumns<Customer>([
    {
      key: "name",
      label: "Nama",
      sortable: true,
      render: (row) => (
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {row.name.charAt(0)}
          </div>
          <div>
            <div class="font-medium text-foreground">{row.name}</div>
            <Show when={row.tags.length > 0}>
              <div class="flex flex-wrap gap-1">
                <For each={row.tags}>
                  {(tag) => (
                    <span
                      class={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium`}
                    >
                      {CUSTOMER_TAG_LABELS[tag] ?? tag}
                    </span>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      ),
    },
    {
      key: "phone",
      label: "No. HP",
      render: (row) =>
        row.phone ? (
          <span class="text-sm">{row.phone}</span>
        ) : (
          <span class="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      key: "tags",
      label: "Tag",
      render: (row) => row.tags[0] ?? "-",
    },
    {
      key: "actions",
      label: "Aksi",
      render: (row) => (
        <div class="flex items-center gap-1">
          <button
            type="button"
            class="rounded p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={(e) => {
              e.stopPropagation();
              setEditingCustomer(row);
              setFormData({
                name: row.name,
                phone: row.phone ?? "",
                email: row.email ?? "",
                address: row.address ?? "",
                notes: row.notes ?? "",
                is_guest: row.is_guest,
                tags: row.tags,
              });
              setIsDialogOpen(true);
            }}
            aria-label="Edit customer"
          >
            <Edit class="h-4 w-4" />
          </button>
          <button
            type="button"
            class="rounded p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            aria-label="Delete customer"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]);

  const handleInputChange = (field: keyof CustomerForm, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      notes: "",
      is_guest: false,
      tags: [],
    });
    setEditingCustomer(null);
  };

  const formToInput = (form: CustomerForm): CreateCustomerInput => {
    const input: CreateCustomerInput = {
      name: form.name,
      is_guest: form.is_guest,
      tags: form.tags,
    };
    if (form.phone) input.phone = form.phone;
    if (form.email) input.email = form.email;
    if (form.address) input.address = form.address;
    if (form.notes) input.notes = form.notes;
    return input;
  };

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const input = formToInput(formData());
    if (!input.name) {
      addToast({
        type: "error",
        title: "Validasi Error",
        message: "Nama wajib diisi",
      });
      return;
    }

    try {
      if (editingCustomer()) {
        await updateMutation.mutateAsync({
          id: editingCustomer()!.id,
          input: input as UpdateCustomerInput,
        });
        addToast({
          type: "success",
          title: "Berhasil",
          message: "Customer berhasil diperbarui",
        });
      } else {
        await createMutation.mutateAsync(input);
        addToast({
          type: "success",
          title: "Berhasil",
          message: "Customer berhasil ditambahkan",
        });
      }
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

  const handleDelete = async () => {
    if (!deleteTarget()) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget()!.id);
      addToast({
        type: "success",
        title: "Berhasil",
        message: "Customer berhasil dihapus",
      });
      setDeleteTarget(null);
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

  const handleViewPets = (customerId: UUID) => {
    void navigate(`/app/crm/customers/${customerId}/pets`);
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">CRM & Pasien</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Kelola data customer dan hewan peliharaan
          </p>
        </div>
        <Button
          class="flex items-center gap-2"
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
        >
          <Plus class="h-4 w-4" />
          Tambah Customer
        </Button>
      </div>

      <div class="flex items-center gap-4 border-b border-border">
        <button
          class={`pb-2 text-sm font-medium transition-colors ${
            activeTab() === "registered"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => void navigate("?tab=registered")}
        >
          Terdaftar
        </button>
        <button
          class={`pb-2 text-sm font-medium transition-colors ${
            activeTab() === "guests"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => void navigate("?tab=guests")}
        >
          Tamu
        </button>
      </div>

      <div class="flex items-center gap-4">
        <SearchInput
          class="max-w-sm"
          placeholder="Cari customer..."
          value={search}
          onSearch={(q) =>
            void navigate(
              `?tab=${activeTab()}${q ? `&search=${encodeURIComponent(q)}` : ""}`,
            )
          }
        />
      </div>

      <Show
        when={!customersResult.isLoading}
        fallback={
          <div class="py-8">
            <LoadingSpinner label="Memuat customer..." />
          </div>
        }
      >
        <Show when={customersResult.error}>
          <div class="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {(customersResult.error as Error)?.message ?? "Terjadi kesalahan"}
          </div>
        </Show>

        <Show
          when={customersResult.data?.data.length === 0}
          fallback={
            <DataTable<Customer>
              data={customersResult.data?.data ?? []}
              columns={columns}
              isLoading={false}
              emptyMessage="Tidak ada customer ditemukan"
              striped
              hoverable
              onRowClick={(row) => handleViewPets(row.id)}
            />
          }
        >
          <EmptyState
            title="Belum ada customer"
            description="Tambahkan customer pertama dengan klik tombol di atas"
            icon={<User class="h-12 w-12" />}
          />
        </Show>
      </Show>

      <ConfirmDialog
        open={() => deleteTarget() !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Customer"
        description={`Yakin ingin menghapus ${deleteTarget()?.name ?? ""}? Data tidak dapat dikembalikan.`}
        variant="destructive"
        confirmLabel="Hapus"
        onConfirm={handleDelete}
      />

      <Dialog.Root open={isDialogOpen()} onOpenChange={setIsDialogOpen}>
        <Dialog.Trigger as="span">
          <span />
        </Dialog.Trigger>
        <Dialog.Overlay class="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content class="fixed top-1/2 left-1/2 z-50 grid w-full max-w2xl -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg">
          <Dialog.Title class="text-lg font-semibold text-foreground">
            {editingCustomer() ? "Edit Customer" : "Tambah Customer"}
          </Dialog.Title>
          <Dialog.Description class="text-sm text-muted-foreground">
            {editingCustomer()
              ? "Perbarui data customer"
              : "Masukkan data customer baru"}
          </Dialog.Description>
          <form onSubmit={handleSubmit} class="space-y-4">
            <Input
              label="Nama"
              placeholder="Masukkan nama"
              required
              value={formData().name}
              onInput={(e) =>
                handleInputChange("name", (e.target as HTMLInputElement).value)
              }
            />
            <Input
              label="No. HP"
              placeholder="Masukkan nomor HP"
              value={formData().phone}
              onInput={(e) =>
                handleInputChange("phone", (e.target as HTMLInputElement).value)
              }
            />
            <Input
              label="Email"
              type="email"
              placeholder="Masukkan email"
              value={formData().email}
              onInput={(e) =>
                handleInputChange("email", (e.target as HTMLInputElement).value)
              }
            />
            <Input
              label="Alamat"
              placeholder="Masukkan alamat"
              value={formData().address}
              onInput={(e) =>
                handleInputChange(
                  "address",
                  (e.target as HTMLInputElement).value,
                )
              }
            />
            <Input
              label="Catatan"
              placeholder="Catatan khusus"
              value={formData().notes}
              onInput={(e) =>
                handleInputChange("notes", (e.target as HTMLInputElement).value)
              }
            />
            <div class="flex items-center gap-2">
              <label class="flex items-center gap-2 text-sm font-medium text-foreground">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  checked={formData().is_guest}
                  onChange={(e) =>
                    handleInputChange(
                      "is_guest",
                      (e.target as HTMLInputElement).checked,
                    )
                  }
                />
                Customer tamu (guest)
              </label>
            </div>
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
              loading={createMutation.isPending || updateMutation.isPending}
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

export default CustomersRoute;
