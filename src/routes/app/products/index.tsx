import { type Component, createSignal, Show, For } from "solid-js";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  UUID,
} from "@/types";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCategories,
  useSuppliers,
  useLowStockProducts,
} from "@/hooks/use-products";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable, createDataTableColumns } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@kobalte/core";
import { Plus, Edit, Trash2, Save, Package, AlertTriangle } from "lucide-solid";
import { addToast } from "@/stores/ui.store";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { AppError } from "@/lib/errors";

interface ProductForm {
  sku: string;
  name: string;
  category_id: UUID | "";
  supplier_id: UUID | "";
  barcode: string;
  description: string;
  purchase_price: string;
  selling_price: string;
  stock_quantity: string;
  stock_minimum: string;
  stock_maximum: string;
  photo_url: string;
  expiry_date: string;
}

export const ProductsRoute: Component = () => {
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);
  const [editingProduct, setEditingProduct] = createSignal<Product | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = createSignal<Product | null>(null);
  const [searchTerm, setSearchTerm] = createSignal("");
  const [formData, setFormData] = createSignal<ProductForm>({
    sku: "",
    name: "",
    category_id: "",
    supplier_id: "",
    barcode: "",
    description: "",
    purchase_price: "",
    selling_price: "",
    stock_quantity: "0",
    stock_minimum: String(LOW_STOCK_THRESHOLD),
    stock_maximum: "0",
    photo_url: "",
    expiry_date: "",
  });

  const productsResult = useProducts({ search: searchTerm() });
  const categoriesResult = useCategories();
  const suppliersResult = useSuppliers();
  const lowStockResult = useLowStockProducts();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const categories = () => categoriesResult.data ?? [];
  const suppliers = () => suppliersResult.data ?? [];

  const columns = createDataTableColumns<Product>([
    {
      key: "sku",
      label: "SKU",
      render: (row) => (
        <span class="font-mono text-xs text-muted-foreground">{row.sku}</span>
      ),
    },
    {
      key: "name",
      label: "Nama Produk",
      render: (row) => {
        const lowStock = row.stock_quantity < LOW_STOCK_THRESHOLD;
        return (
          <div class="flex items-center gap-2">
            {lowStock ? (
              <AlertTriangle class="h-4 w-4 text-destructive" />
            ) : null}
            <span
              class={`font-medium ${lowStock ? "text-destructive" : "text-foreground"}`}
            >
              {row.name}
            </span>
          </div>
        );
      },
    },
    {
      key: "stock_quantity",
      label: "Stok",
      render: (row) => (
        <span
          class={
            row.stock_quantity < LOW_STOCK_THRESHOLD
              ? "text-destructive font-medium"
              : "text-foreground"
          }
        >
          {row.stock_quantity}
        </span>
      ),
    },
    {
      key: "selling_price",
      label: "Harga Jual",
      render: (row) => (
        <span class="text-sm">
          Rp{row.selling_price.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.status === "ACTIVE" ? "ACTIVE" : "ARCHIVED"} />
      ),
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
              setEditingProduct(row);
              setFormData({
                sku: row.sku,
                name: row.name,
                category_id: row.category_id ?? "",
                supplier_id: row.supplier_id ?? "",
                barcode: row.barcode ?? "",
                description: row.description ?? "",
                purchase_price: String(row.purchase_price),
                selling_price: String(row.selling_price),
                stock_quantity: String(row.stock_quantity),
                stock_minimum: String(row.stock_minimum),
                stock_maximum: String(row.stock_maximum),
                photo_url: row.photo_url ?? "",
                expiry_date: row.expiry_date ?? "",
              });
              setIsDialogOpen(true);
            }}
            aria-label="Edit product"
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
            aria-label="Delete product"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]);

  const handleInputChange = (field: keyof ProductForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      category_id: "",
      supplier_id: "",
      barcode: "",
      description: "",
      purchase_price: "",
      selling_price: "",
      stock_quantity: "0",
      stock_minimum: String(LOW_STOCK_THRESHOLD),
      stock_maximum: "0",
      photo_url: "",
      expiry_date: "",
    });
    setEditingProduct(null);
  };

  const formToInput = (form: ProductForm): CreateProductInput => ({
    sku: form.sku,
    name: form.name,
    ...(form.category_id ? { category_id: form.category_id as UUID } : {}),
    ...(form.supplier_id ? { supplier_id: form.supplier_id as UUID } : {}),
    ...(form.barcode ? { barcode: form.barcode } : {}),
    ...(form.description ? { description: form.description } : {}),
    purchase_price: Number(form.purchase_price),
    selling_price: Number(form.selling_price),
    ...(form.stock_quantity
      ? { stock_quantity: Number(form.stock_quantity) }
      : {}),
    ...(form.stock_minimum
      ? { stock_minimum: Number(form.stock_minimum) }
      : {}),
    ...(form.stock_maximum
      ? { stock_maximum: Number(form.stock_maximum) }
      : {}),
    ...(form.photo_url ? { photo_url: form.photo_url } : {}),
    ...(form.expiry_date ? { expiry_date: form.expiry_date } : {}),
  });

  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = formData();

    if (!form.sku || !form.name) {
      addToast({
        type: "error",
        title: "Validasi Error",
        message: "SKU dan nama produk wajib diisi",
      });
      return;
    }

    try {
      const input = formToInput(form);

      if (editingProduct()) {
        const updateInput: Partial<CreateProductInput> = { ...input };
        delete (updateInput as { sku?: string }).sku;
        await updateMutation.mutateAsync({
          id: editingProduct()!.id,
          input: updateInput as UpdateProductInput,
        });
        addToast({
          type: "success",
          title: "Berhasil",
          message: "Produk berhasil diperbarui",
        });
      } else {
        await createMutation.mutateAsync(input);
        addToast({
          type: "success",
          title: "Berhasil",
          message: "Produk berhasil ditambahkan",
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
        message: "Produk berhasil dihapus",
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

  const lowStockCount = () => lowStockResult.data?.length ?? 0;

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Produk & Stok</h1>
          <p class="text-sm text-muted-foreground mt-1">
            Kelola stok, harga, dan ketersediaan produk
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Show when={lowStockCount() > 0}>
            <div class="flex items-center gap-1 rounded-md bg-destructive/10 px-3 py-1 text-sm text-destructive">
              <AlertTriangle class="h-4 w-4" />
              <span>{lowStockCount()} produk stok rendah</span>
            </div>
          </Show>
          <Button
            class="flex items-center gap-2"
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
          >
            <Plus class="h-4 w-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <SearchInput
          class="max-w-sm"
          placeholder="Cari produk..."
          value={searchTerm}
          onSearch={setSearchTerm}
        />
      </div>

      <Show
        when={!productsResult.isLoading}
        fallback={
          <div class="py-8">
            <LoadingSpinner label="Memuat produk..." />
          </div>
        }
      >
        <Show
          when={productsResult.data?.data.length === 0}
          fallback={
            <DataTable<Product>
              data={productsResult.data?.data ?? []}
              columns={columns}
              isLoading={false}
              emptyMessage="Tidak ada produk ditemukan"
              striped
              hoverable
            />
          }
        >
          <EmptyState
            title="Belum ada produk"
            description="Tambahkan produk pertama dengan klik tombol di atas"
            icon={<Package class="h-12 w-12" />}
          />
        </Show>
      </Show>

      <ConfirmDialog
        open={() => deleteTarget() !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Produk"
        description={`Yakin ingin menghapus ${deleteTarget()?.name ?? ""}? Produk akan diarsipkan dan tidak dapat dijual.`}
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
            {editingProduct() ? "Edit Produk" : "Tambah Produk"}
          </Dialog.Title>
          <Dialog.Description class="text-sm text-muted-foreground">
            {editingProduct()
              ? "Perbarui data produk"
              : "Masukkan data produk baru"}
          </Dialog.Description>
          <form onSubmit={handleSubmit} class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <Input
                label="SKU *"
                placeholder="Masukkan SKU"
                value={formData().sku}
                onInput={(e) =>
                  handleInputChange("sku", (e.target as HTMLInputElement).value)
                }
                readonly={!!editingProduct()}
              />
              <Input
                label="Barcode"
                placeholder="Masukkan barcode"
                value={formData().barcode}
                onInput={(e) =>
                  handleInputChange(
                    "barcode",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
            </div>

            <Input
              label="Nama Produk *"
              placeholder="Masukkan nama produk"
              required
              value={formData().name}
              onInput={(e) =>
                handleInputChange("name", (e.target as HTMLInputElement).value)
              }
            />

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-foreground">
                  Kategori
                </label>
                <select
                  class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData().category_id}
                  onChange={(e) =>
                    handleInputChange(
                      "category_id",
                      (e.target as HTMLSelectElement).value,
                    )
                  }
                >
                  <option value="">Pilih kategori</option>
                  <For each={categories()}>
                    {(cat) => <option value={cat.id}>{cat.name}</option>}
                  </For>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium text-foreground">
                  Supplier
                </label>
                <select
                  class="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={formData().supplier_id}
                  onChange={(e) =>
                    handleInputChange(
                      "supplier_id",
                      (e.target as HTMLSelectElement).value,
                    )
                  }
                >
                  <option value="">Pilih supplier</option>
                  <For each={suppliers()}>
                    {(sup) => <option value={sup.id}>{sup.name}</option>}
                  </For>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <Input
                label="Harga Beli"
                type="number"
                placeholder="0"
                value={formData().purchase_price}
                onInput={(e) =>
                  handleInputChange(
                    "purchase_price",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
              <Input
                label="Harga Jual"
                type="number"
                placeholder="0"
                value={formData().selling_price}
                onInput={(e) =>
                  handleInputChange(
                    "selling_price",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
            </div>

            <div class="grid grid-cols-3 gap-4">
              <Input
                label="Stok"
                type="number"
                placeholder="0"
                value={formData().stock_quantity}
                onInput={(e) =>
                  handleInputChange(
                    "stock_quantity",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
              <Input
                label="Minimum"
                type="number"
                placeholder="0"
                value={formData().stock_minimum}
                onInput={(e) =>
                  handleInputChange(
                    "stock_minimum",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
              <Input
                label="Maksimum"
                type="number"
                placeholder="0"
                value={formData().stock_maximum}
                onInput={(e) =>
                  handleInputChange(
                    "stock_maximum",
                    (e.target as HTMLInputElement).value,
                  )
                }
              />
            </div>

            <Input
              label="Deskripsi"
              placeholder="Deskripsi produk"
              value={formData().description}
              onInput={(e) =>
                handleInputChange(
                  "description",
                  (e.target as HTMLInputElement).value,
                )
              }
            />

            <Input
              label="Tanggal Kadaluarsa"
              type="date"
              value={formData().expiry_date}
              onInput={(e) =>
                handleInputChange(
                  "expiry_date",
                  (e.target as HTMLInputElement).value,
                )
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
              loading={createMutation.isPending || updateMutation.isPending}
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

export default ProductsRoute;
